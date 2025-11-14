-- Subscription system with Stripe integration
-- Creates subscription plans, user subscriptions, and usage tracking

-- Subscription Plans (managed by admins)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- in cents
  price_yearly INTEGER, -- in cents
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb, -- e.g., {"ai_tailoring_per_month": 10, "resume_exports": 5}
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, trialing
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking (for metered features)
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL, -- e.g., 'ai_tailoring', 'resume_export', 'cover_letter_generation'
  count INTEGER DEFAULT 1,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe Events (webhook history for debugging)
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON public.usage_tracking(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON public.usage_tracking(feature);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON public.stripe_events(processed);

-- RLS Policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Plans are publicly readable
CREATE POLICY subscription_plans_read ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Users can read their own subscriptions
CREATE POLICY user_subscriptions_read ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own usage
CREATE POLICY usage_tracking_read ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can write to these tables (via API)
-- Stripe events are managed by webhooks (service role)

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans
INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, features, limits, sort_order)
VALUES
  (
    'free',
    'Free',
    'Perfect for getting started',
    0,
    0,
    '[
      "Browse 1000+ Werkstudent jobs",
      "Basic resume editor",
      "Job matching algorithm",
      "5 AI tailoring credits/month",
      "Basic templates"
    ]'::jsonb,
    '{
      "ai_tailoring_per_month": 5,
      "resume_exports_per_month": 3,
      "cover_letters_per_month": 2
    }'::jsonb,
    1
  ),
  (
    'pro',
    'Pro',
    'For serious job seekers',
    999,
    9990,
    '[
      "Everything in Free",
      "Unlimited AI-powered tailoring",
      "Unlimited resume exports",
      "Unlimited cover letter generation",
      "Premium templates",
      "Priority support",
      "Job application tracking",
      "Advanced analytics"
    ]'::jsonb,
    '{
      "ai_tailoring_per_month": -1,
      "resume_exports_per_month": -1,
      "cover_letters_per_month": -1
    }'::jsonb,
    2
  ),
  (
    'enterprise',
    'Enterprise',
    'For teams and organizations',
    4999,
    49990,
    '[
      "Everything in Pro",
      "Team collaboration",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "Volume discounts"
    ]'::jsonb,
    '{
      "ai_tailoring_per_month": -1,
      "resume_exports_per_month": -1,
      "cover_letters_per_month": -1,
      "team_members": 10
    }'::jsonb,
    3
  )
ON CONFLICT (id) DO NOTHING;

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id UUID,
  p_feature TEXT,
  p_period_start TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()),
  p_period_end TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
)
RETURNS JSONB AS $$
DECLARE
  v_subscription RECORD;
  v_usage_count INTEGER;
  v_limit INTEGER;
  v_has_access BOOLEAN;
  v_remaining INTEGER;
BEGIN
  -- Get user's active subscription
  SELECT us.*, sp.limits
  INTO v_subscription
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
  ORDER BY sp.sort_order DESC
  LIMIT 1;

  -- If no subscription, check free tier
  IF NOT FOUND THEN
    SELECT limits
    INTO v_subscription
    FROM public.subscription_plans
    WHERE id = 'free';
  END IF;

  -- Get feature limit from subscription
  v_limit := (v_subscription.limits->>p_feature)::INTEGER;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN jsonb_build_object(
      'has_access', true,
      'is_unlimited', true,
      'used', 0,
      'limit', -1,
      'remaining', -1
    );
  END IF;

  -- Get current usage
  SELECT COALESCE(SUM(count), 0)::INTEGER
  INTO v_usage_count
  FROM public.usage_tracking
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND period_start >= p_period_start
    AND period_end <= p_period_end;

  v_has_access := v_usage_count < v_limit;
  v_remaining := GREATEST(0, v_limit - v_usage_count);

  RETURN jsonb_build_object(
    'has_access', v_has_access,
    'is_unlimited', false,
    'used', v_usage_count,
    'limit', v_limit,
    'remaining', v_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  v_period_start := DATE_TRUNC('month', NOW());
  v_period_end := v_period_start + INTERVAL '1 month';

  INSERT INTO public.usage_tracking (user_id, feature, count, period_start, period_end)
  VALUES (p_user_id, p_feature, p_count, v_period_start, v_period_end);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
