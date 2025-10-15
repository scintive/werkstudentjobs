# Email Templates Configuration

This directory contains professional email templates for WerkStudentJobs user authentication emails.

## Files

- `confirmation-email.html` - Professional HTML email template for email confirmations
- `confirmation-email.txt` - Plain text fallback for email clients that don't support HTML

## Configuring Supabase Email Templates

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Authentication Settings**:
   - Visit: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/templates
   - Or navigate: Project → Authentication → Email Templates

2. **Select "Confirm signup" Template**:
   - Click on the "Confirm signup" template in the left sidebar

3. **Update the Email Template**:

   **Subject Line**:
   ```
   Confirm Your Email - WerkStudentJobs
   ```

   **Message Body**:
   - Copy the entire contents of `confirmation-email.html`
   - Paste into the "Message (Body)" field
   - **Important**: Supabase uses `{{ .ConfirmationURL }}` as the template variable for the confirmation link
   - Make sure this variable is preserved in the HTML

4. **Configure Email Settings**:
   - **From Email**: `noreply@werkstudentjobs.com` (or your verified domain)
   - **From Name**: `WerkStudentJobs`
   - **Enable email confirmations**: ✅ Checked

5. **Save Changes**:
   - Click "Save" at the bottom of the page

### Option 2: Via Supabase SQL (Advanced)

You can also configure email templates directly via SQL if you have custom SMTP setup:

```sql
-- Note: This requires Supabase Pro plan with custom SMTP
-- Configure via dashboard instead for standard plans
```

## Email Template Features

### Professional Design
- ✅ Responsive design (mobile-friendly)
- ✅ Modern gradient header
- ✅ Clear call-to-action button
- ✅ Security notice for user confidence
- ✅ Alternative text link for accessibility
- ✅ Feature highlights list
- ✅ Professional footer with legal links
- ✅ Email client compatibility (Gmail, Outlook, Apple Mail, etc.)

### Branding
- ✅ WerkStudentJobs logo in header
- ✅ Brand colors (blue gradient)
- ✅ Consistent typography
- ✅ Professional tone

### Legal Compliance
- ✅ Links to Privacy Policy (Datenschutzerklärung)
- ✅ Links to Impressum
- ✅ Unsubscribe notice
- ✅ Copyright notice

## Testing Email Templates

### Test Locally

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Sign Up with a Test Email**:
   - Go to http://localhost:3000/register
   - Use a real email address you have access to
   - Check your inbox for the confirmation email

3. **Check Email Rendering**:
   - Verify the logo loads correctly
   - Test the confirmation button
   - Check on mobile device
   - Test in different email clients

### Preview Email Template

You can preview the HTML email by opening it in a browser:

```bash
open email-templates/confirmation-email.html
```

**Note**: The `{{ .ConfirmationURL }}` will show as-is in preview. In actual emails, Supabase replaces this with the real confirmation link.

## Supabase Email Configuration Checklist

Before deploying to production:

- [ ] Logo URL points to production domain (https://werkstudentjobs.com/werkstudentjobslogo.png)
- [ ] All links point to production domain (not localhost)
- [ ] Impressum page has actual company information
- [ ] Privacy policy (Datenschutzerklärung) is complete
- [ ] Support email (support@werkstudentjobs.com) is configured
- [ ] Custom domain email is verified (if using custom domain)
- [ ] SMTP settings configured (if using custom SMTP)
- [ ] Email confirmations are enabled in Supabase Auth settings
- [ ] Template has been saved in Supabase dashboard
- [ ] Test email sent and verified in production

## Custom SMTP Setup (Optional)

For production, you may want to use a custom SMTP provider for better deliverability:

### Recommended Providers:
1. **SendGrid** (Free tier: 100 emails/day)
2. **Mailgun** (Free tier: 5,000 emails/month)
3. **AWS SES** (Pay as you go, very cheap)
4. **Postmark** (Free tier: 100 emails/month)

### Configuration Steps:
1. Sign up for SMTP provider
2. Verify your domain
3. Get SMTP credentials
4. Configure in Supabase: Project → Settings → Auth → SMTP Settings
5. Test with a real email

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify email is not on suppression list
- Check Supabase Auth logs
- Verify SMTP settings if using custom provider

### Logo Not Loading
- Ensure logo is deployed to production
- Check logo URL in email template
- Verify CORS settings allow email clients
- Test with absolute URL (https://)

### Links Not Working
- Verify `{{ .ConfirmationURL }}` is preserved in template
- Check redirect URLs in Supabase Auth settings
- Test confirmation link in different browsers

### Styling Issues
- Some email clients strip CSS
- Use inline styles for critical elements
- Test in multiple email clients
- Use email testing service (Litmus, Email on Acid)

## Support

For issues with email templates:
- Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-email-templates
- Contact Supabase support: https://supabase.com/support
- Email us: support@werkstudentjobs.com

## Version History

- **v1.0** (2025-01-15): Initial professional email template with WerkStudentJobs branding
