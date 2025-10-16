# 🔐 Google OAuth Setup Guide

## ⚠️ COMPLETE BEFORE DEPLOYING

This guide will help you set up Google OAuth authentication for werkstudentjobs.com.

---

## ✅ Step 1: Google Cloud Console Setup

### A. Create OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Select/Create Project**
   - You can reuse your existing Firebase project or create a new one
   - Name: "WerkstudentJobs" (or any name you prefer)

3. **Configure OAuth Consent Screen**
   - Navigate to: `APIs & Services` → `OAuth consent screen`
   - Click `Configure Consent Screen` (if not already done)
   
   **Settings:**
   - **User Type**: External
   - **App name**: WerkstudentJobs
   - **User support email**: Your email
   - **App logo**: (Optional) Upload your logo
   - **Developer contact information**: Your email
   
   **Scopes:**
   - Click `Add or Remove Scopes`
   - Add these scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
   - Click `Update` → `Save and Continue`
   
   **Test users** (Optional for testing phase):
   - Add your email address
   - Click `Save and Continue`

4. **Create OAuth Client ID**
   - Navigate to: `APIs & Services` → `Credentials`
   - Click: `+ CREATE CREDENTIALS` → `OAuth client ID`
   
   **Configuration:**
   - **Application type**: Web application
   - **Name**: WerkstudentJobs Web Client
   
   **Authorized JavaScript origins:**
   ```
   https://ieliwaibbkexqbudfher.supabase.co
   https://werkstudentjobs.com
   https://www.werkstudentjobs.com
   http://localhost:3000
   ```
   
   **Authorized redirect URIs:**
   ```
   https://ieliwaibbkexqbudfher.supabase.co/auth/v1/callback
   https://werkstudentjobs.com/auth/callback
   https://www.werkstudentjobs.com/auth/callback
   http://localhost:3000/auth/callback
   ```
   
   - Click `Create`

5. **Save Your Credentials**
   - A popup will show your **Client ID** and **Client Secret**
   - ⚠️ **COPY BOTH** - You'll need these for Supabase
   - Format:
     - Client ID: `123456789-abc123def456.apps.googleusercontent.com`
     - Client Secret: `GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ`

---

## ✅ Step 2: Supabase Configuration

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com/project/ieliwaibbkexqbudfher
   - Navigate to: `Authentication` → `Providers`

2. **Enable Google Provider**
   - Find "Google" in the providers list
   - Toggle it ON (should be green)

3. **Add OAuth Credentials**
   - **Client IDs**: Paste your OAuth Client ID from Step 1.5
     ```
     Example: 123456789-abc123def456.apps.googleusercontent.com
     ```
   - **Client Secret (for OAuth)**: Paste your OAuth Client Secret from Step 1.5
     ```
     Example: GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
     ```

4. **Click Save**

---

## ✅ Step 3: Verify Configuration

### Before deploying, verify these URLs are correct:

**In Google Cloud Console** (Authorized redirect URIs):
```
✓ https://ieliwaibbkexqbudfher.supabase.co/auth/v1/callback
✓ https://werkstudentjobs.com/auth/callback
✓ https://www.werkstudentjobs.com/auth/callback
```

**In Supabase Dashboard**:
```
✓ Google provider is enabled (green toggle)
✓ Client ID is filled in (not empty)
✓ Client Secret is filled in (not empty)
```

---

## 🚀 Step 4: Deploy to Production

Once Steps 1, 2, and 3 are complete, run:

```bash
vercel --prod
```

---

## 🧪 Step 5: Test the Integration

After deployment:

1. **Go to**: https://werkstudentjobs.com/login
2. **Click**: "Sign in with Google" button
3. **Verify**: You're redirected to Google login
4. **Complete**: Google authentication
5. **Check**: You're redirected back to https://werkstudentjobs.com/dashboard

If successful, you should be logged in! ✅

---

## ⚠️ Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
**Solution**: Check that your authorized redirect URIs in Google Cloud Console EXACTLY match:
```
https://ieliwaibbkexqbudfher.supabase.co/auth/v1/callback
```

### Issue: "invalid_client"
**Solution**: Double-check that you copied the correct Client ID and Secret from Google Cloud Console to Supabase.

### Issue: "Access denied"
**Solution**: 
- If your app is in "Testing" mode, add your email as a test user in Google Cloud Console
- OR publish your OAuth consent screen to production

### Issue: "Error 400: redirect_uri_mismatch" with werkstudentjobs.com
**Solution**: Make sure you added BOTH the Supabase redirect URI AND your domain redirect URI in Google Cloud Console.

---

## 📋 Pre-Deployment Checklist

Before deploying, confirm:

- [ ] Google Cloud Console OAuth credentials created
- [ ] OAuth consent screen configured
- [ ] All redirect URIs added (Supabase + werkstudentjobs.com)
- [ ] Client ID and Secret copied
- [ ] Supabase Google provider enabled
- [ ] Client ID pasted into Supabase
- [ ] Client Secret pasted into Supabase
- [ ] Clicked "Save" in Supabase dashboard

**Once ALL boxes are checked, you're ready to deploy!** 🚀

---

## 🎯 What Happens After Deployment

Users will see:
1. ✅ "Sign in with Google" button on login page
2. ✅ "Sign up with Google" button on register page
3. ✅ Smooth OAuth flow: Click → Google login → Redirect back → Dashboard
4. ✅ User profile automatically created in Supabase

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all URLs match exactly
4. Ensure OAuth consent screen is published (for production use)

---

**Created**: October 16, 2025  
**For**: WerkstudentJobs Production Deployment

