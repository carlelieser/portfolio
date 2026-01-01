# Patreon Integration Setup Guide

This guide provides step-by-step instructions for configuring Patreon webhooks to automatically sync subscriber status with your Carlos Santos website.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Patreon App](#step-1-create-patreon-app)
3. [Step 2: Configure Webhook](#step-2-configure-webhook)
4. [Step 3: Get Webhook Secret](#step-3-get-webhook-secret)
5. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
6. [Step 5: Test Webhook](#step-5-test-webhook)
7. [Step 6: Monitor Webhook Deliveries](#step-6-monitor-webhook-deliveries)
8. [Troubleshooting](#troubleshooting)
9. [Production Checklist](#production-checklist)
10. [Maintenance](#maintenance)

## Prerequisites

Before starting, ensure you have:

- ✅ Patreon Creator account with an active campaign
- ✅ Application deployed with webhook endpoint accessible
- ✅ Access to your deployment platform's environment variable settings
- ✅ HTTPS-enabled deployment URL (Patreon webhooks require HTTPS)

**Note:** Patreon webhooks will NOT work with `localhost`. You must deploy to a public HTTPS URL first.

## Step 1: Create Patreon App

### 1.1 Access Patreon Developer Portal

1. Navigate to: https://www.patreon.com/portal/registration/register-clients
2. Sign in with your Patreon creator account
3. You'll see the "Clients & API Keys" page

### 1.2 Create New Client

1. Click **"Create Client"** button
2. Fill in the required information:

   **App Name:**

   ```
   Carlos Santos Website
   ```

   **Description:**

   ```
   Personal brand website with exclusive subscriber content
   ```

   **App Category:**
   - Select **"Content & Publishing"**

   **Author/Artist Name:**

   ```
   Carlos Santos
   ```

   **Client API Version:**
   - Select **v2** (recommended for webhooks)

   **Redirect URIs:**
   - Leave blank (not needed for webhook-only integration)

3. Click **"Create Client"**

### 1.3 Save Your Credentials

After creation, you'll see your client details:

- **Client ID**: `abcd1234...` (save this securely)
- **Client Secret**: `xyz789...` (save this securely)

**⚠️ Important:** Keep these credentials secure. You'll need them if you expand to OAuth integration later.

## Step 2: Configure Webhook

### 2.1 Navigate to Webhooks Section

1. In the Patreon Developer Portal, select your newly created app
2. Find and click on **"Webhooks"** in the left sidebar
3. Click **"Add Webhook"** button

### 2.2 Configure Webhook Settings

**Webhook URL:**

```
https://your-actual-domain.com/api/patreon/webhook
```

**Replace `your-actual-domain.com` with:**

- Your custom domain (e.g., `carlossantos.com`)
- OR your Vercel deployment URL (e.g., `carlos-santos-site.vercel.app`)
- OR your Netlify deployment URL (e.g., `carlos-santos-site.netlify.app`)

**⚠️ Requirements:**

- Must use `https://` (not `http://`)
- Must be publicly accessible (not localhost)
- Endpoint must be deployed and responding

**Triggers to Select:**

Check the following event types:

- ✅ **members:pledge:create** - Triggered when someone becomes a patron
- ✅ **members:pledge:delete** - Triggered when someone cancels their pledge

**Leave unchecked:**

- members:pledge:update (not currently handled by the webhook endpoint)

### 2.3 Save Webhook Configuration

1. Click **"Add Webhook"** or **"Save"**
2. Patreon will create the webhook and generate a webhook secret
3. You should see your webhook listed in the Webhooks section

## Step 3: Get Webhook Secret

### 3.1 Retrieve the Secret

1. In the Webhooks section, click on your newly created webhook
2. Look for the **"Webhook Secret"** field
3. Click the "Show" or "Copy" button to reveal the secret

**Example format:**

```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 3.2 Store Securely

⚠️ **This secret is critical for security!**

- It verifies that webhook requests are genuinely from Patreon
- Store it in a password manager (1Password, LastPass, etc.)
- Never commit it to version control
- You'll need it for the next step

## Step 4: Configure Environment Variables

### 4.1 Local Development (Optional)

For local testing (note: webhooks won't work on localhost):

1. Edit your `.env` file:

   ```bash
   PATREON_WEBHOOK_SECRET=your-actual-secret-from-step-3
   ```

2. Verify `.env` is in `.gitignore`:
   ```bash
   git status  # Should NOT show .env
   ```

### 4.2 Production (Vercel)

#### Via Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Navigate to your project
3. Click **Settings** → **Environment Variables**
4. Add new variable:

   **Key:**

   ```
   PATREON_WEBHOOK_SECRET
   ```

   **Value:**

   ```
   [paste your webhook secret from Step 3]
   ```

   **Environment:**
   - ✅ Production
   - ⬜ Preview (optional, for testing)
   - ⬜ Development

5. Click **"Save"**

#### Via Vercel CLI:

```bash
vercel env add PATREON_WEBHOOK_SECRET production
# Paste your secret when prompted
```

### 4.3 Production (Netlify)

1. Go to https://app.netlify.com
2. Navigate to your site
3. Click **Site settings** → **Environment variables**
4. Click **"Add a variable"**

   **Key:**

   ```
   PATREON_WEBHOOK_SECRET
   ```

   **Value:**

   ```
   [paste your webhook secret]
   ```

   **Scopes:**
   - ✅ Production
   - ⬜ Deploy previews (optional)

5. Click **"Create variable"**

### 4.4 Trigger Redeployment

⚠️ **Important:** Environment variable changes require redeployment!

**Vercel:**

```bash
# Option 1: Git push
git commit --allow-empty -m "Trigger redeploy"
git push

# Option 2: Vercel dashboard
# Go to Deployments → Redeploy latest
```

**Netlify:**

```bash
# Option 1: Git push
git commit --allow-empty -m "Trigger redeploy"
git push

# Option 2: Netlify dashboard
# Go to Deploys → Trigger deploy → Deploy site
```

## Step 5: Test Webhook

### 5.1 Using Patreon Test Tool (Recommended)

1. **Navigate to Webhooks Section**
   - Patreon Developer Portal → Your App → Webhooks
   - Click on your webhook to view details

2. **Send Test Event**
   - Find the **"Test"** or **"Send Test Webhook"** button
   - Select event type: **"members:pledge:create"**
   - Click **"Send Test"**

3. **Check Response**

   **✅ Success (200 OK):**

   ```json
   {
   	"success": true,
   	"message": "Successfully processed pledge:create",
   	"subscriber": {
   		"email": "test@example.com",
   		"isActive": true
   	}
   }
   ```

   **❌ Error (401 Unauthorized):**

   ```json
   {
   	"message": "Unauthorized: Invalid webhook signature"
   }
   ```

   → **Solution:** Webhook secret mismatch. Verify environment variable.

   **❌ Error (500 Internal Server Error):**

   ```json
   {
   	"message": "Internal Server Error: Failed to update subscriber"
   }
   ```

   → **Solution:** Database connection issue. Check Supabase credentials.

### 5.2 Verify Database Update

After successful test webhook:

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Open Table Editor**
   - Click **"Table Editor"** in left sidebar
   - Select **"subscribers"** table

3. **Verify Record**
   - Look for a new row with test email
   - Check `is_active` = `true`
   - Verify `created_at` timestamp

**Example:**

```
id: 550e8400-e29b-41d4-a716-446655440000
email: test@patreon.com
is_active: true
created_at: 2025-12-15 20:30:00+00
updated_at: 2025-12-15 20:30:00+00
```

### 5.3 Test Cancellation Event

1. Send another test webhook with event type: **"members:pledge:delete"**
2. Check database - same email should now have `is_active` = `false`

### 5.4 Manual cURL Test (Advanced)

⚠️ **Note:** This requires calculating HMAC-MD5 signature. Use Patreon test tool instead.

```bash
# Example structure (signature calculation complex)
curl -X POST https://your-domain.com/api/patreon/webhook \
  -H "Content-Type: application/json" \
  -H "X-Patreon-Event: members:pledge:create" \
  -H "X-Patreon-Signature: [calculated-hmac-md5-signature]" \
  -d '{
    "data": {
      "id": "12345",
      "type": "pledge",
      "attributes": {
        "email": "test@example.com"
      }
    }
  }'
```

**Signature calculation** (Node.js):

```javascript
const crypto = require('crypto');
const payload = '{"data":...}'; // Exact request body
const secret = 'your-webhook-secret';
const signature = crypto.createHmac('md5', secret).update(payload).digest('hex');
```

## Step 6: Monitor Webhook Deliveries

### 6.1 In Patreon Dashboard

1. **Navigate to Webhook Details**
   - Developer Portal → Your App → Webhooks
   - Click on your webhook

2. **View Recent Deliveries**
   - Scroll to **"Recent Deliveries"** section
   - See list of webhook events sent

3. **Check Each Delivery**
   - **Response Code**: 200 = success, 4xx/5xx = error
   - **Retry Attempts**: Number of times Patreon retried
   - **Timestamp**: When event was sent
   - **Payload**: Click to view full webhook payload

### 6.2 In Application Logs

**Vercel:**

1. Go to Vercel Dashboard → Your Project
2. Click **"Functions"** tab
3. Filter by: `/api/patreon/webhook`
4. Look for log entries:
   ```
   [Patreon Webhook] Processing new pledge: { email: 'user@example.com' }
   [Patreon Webhook] Successfully processed event: { event: 'pledge:create', ... }
   ```

**Netlify:**

1. Go to Netlify Dashboard → Your Site
2. Click **"Functions"** tab
3. Find `api-patreon-webhook` function
4. View recent invocations and logs

### 6.3 Set Up Monitoring Alerts (Recommended)

**Option 1: Vercel Monitoring**

- Enable error notifications in Vercel project settings
- Receive emails when webhook returns 5xx errors

**Option 2: External Monitoring**

- Use services like Better Uptime, UptimeRobot
- Monitor webhook endpoint availability
- Alert on repeated failures

## Troubleshooting

### Issue: Webhook Returns 401 Unauthorized

**Cause:** Signature verification failed - webhook secret mismatch.

**Solutions:**

1. **Verify Secret Matches**
   - Compare secret in Patreon dashboard with environment variable
   - No extra spaces or quotes

2. **Check Environment Variable Name**
   - Must be exactly: `PATREON_WEBHOOK_SECRET`
   - Case-sensitive

3. **Verify Environment Scope**
   - Ensure variable is in **Production** environment (not just Preview)

4. **Redeploy Application**
   - Changes to environment variables require redeployment

   ```bash
   git commit --allow-empty -m "Redeploy"
   git push
   ```

5. **Regenerate Secret**
   - In Patreon dashboard, regenerate webhook secret
   - Update environment variable
   - Redeploy

### Issue: Webhook Returns 400 Bad Request

**Cause:** Invalid payload or missing email.

**Solutions:**

1. **Check Event Type**
   - Webhook must be `members:pledge:create` or `members:pledge:delete`
   - Other event types return 200 but don't process

2. **Verify Email in Payload**
   - Patreon payload must include `data.attributes.email`
   - Check logs for specific error message

3. **Test with Patreon Tool**
   - Use Patreon's built-in test webhook feature
   - Ensures payload structure is correct

### Issue: Webhook Returns 500 Internal Server Error

**Cause:** Database connection or operation failed.

**Solutions:**

1. **Verify Supabase Credentials**
   - Check `PUBLIC_SUPABASE_URL` is correct
   - Check `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Ensure using PRODUCTION credentials

2. **Check Supabase Project Health**
   - Go to Supabase dashboard
   - Verify project status is "Healthy"
   - Check database is accessible

3. **Verify Table Exists**
   - Table Editor → Check `subscribers` table exists
   - Run migration if missing (see `supabase/README.md`)

4. **Check RLS Policies**
   - Service role should have full access
   - Verify RLS policy exists (see `supabase/README.md`)

5. **Review Application Logs**
   - Check Vercel/Netlify function logs
   - Look for specific database error messages

### Issue: Webhook Not Receiving Events

**Cause:** URL incorrect or deployment inaccessible.

**Solutions:**

1. **Verify Webhook URL**
   - Must be exact: `https://your-domain.com/api/patreon/webhook`
   - Must use HTTPS (not HTTP)
   - Check for typos

2. **Test Endpoint Manually**
   - Visit URL in browser (should return 405 Method Not Allowed for GET)
   - Confirms endpoint exists and is accessible

3. **Check Deployment Status**
   - Ensure latest deployment succeeded
   - Check deployment logs for build errors

4. **Verify DNS Configuration**
   - If using custom domain, ensure DNS is properly configured
   - May take 24-48 hours to propagate

### Issue: Events Received But Database Not Updating

**Cause:** Database permissions or RLS policy issue.

**Solutions:**

1. **Verify Service Role Key**
   - Must use `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
   - Service role bypasses RLS

2. **Check RLS Policies**
   - Supabase dashboard → Authentication → Policies
   - Verify policy allows service role access

3. **Review Subscriber Utility Functions**
   - Check `src/lib/server/subscribers.ts` for errors
   - Verify `upsertSubscriber()` logic

4. **Check for SubscriberError in Logs**
   - Application logs will show `SubscriberError` if database operation fails
   - Includes error code and details

### Issue: Duplicate Webhooks / Race Conditions

**Cause:** Patreon may retry webhooks or send duplicates.

**Solution:** Already handled! The application uses UPSERT operations:

- Multiple webhook events for same email are idempotent
- Last event "wins" and updates `is_active` status
- No duplicate subscriber records created

## Production Checklist

Before going live with Patreon integration:

- [ ] Patreon app created and configured
- [ ] Webhook URL set to production domain (HTTPS)
- [ ] Webhook subscribed to `members:pledge:create` and `members:pledge:delete`
- [ ] Webhook secret copied from Patreon dashboard
- [ ] `PATREON_WEBHOOK_SECRET` environment variable set in production
- [ ] Application redeployed after environment variable added
- [ ] Test webhook sent successfully (200 OK response)
- [ ] Database update verified in Supabase (test record created)
- [ ] Test cancellation event verified (test record updated to inactive)
- [ ] Application logs show successful webhook processing
- [ ] Monitoring set up for webhook failures (optional but recommended)
- [ ] Webhook secret stored in password manager for safekeeping

## Maintenance

### Rotating Webhook Secret

**Recommended frequency:** Every 90 days or immediately if compromised.

See `SECURITY.md` for complete rotation procedure.

**Quick Steps:**

1. **Generate New Secret in Patreon**
   - Developer Portal → Webhooks → Your webhook
   - Click "Regenerate Secret"
   - Copy new secret

2. **Update Environment Variable**
   - Deployment platform → Environment Variables
   - Update `PATREON_WEBHOOK_SECRET` value
   - Save changes

3. **Redeploy Application**

   ```bash
   git commit --allow-empty -m "Rotate webhook secret"
   git push
   ```

4. **Update Patreon Webhook Configuration**
   - Patreon will automatically use new secret
   - No additional steps needed

5. **Test Webhook**
   - Send test event to verify new secret works
   - Check logs for successful processing

⚠️ **Important:** Update environment variable BEFORE Patreon starts using new secret to avoid downtime.

### Monitoring Best Practices

**Weekly Tasks:**

- Check Patreon delivery logs for failed webhooks
- Verify subscriber count matches Patreon metrics
- Review application logs for errors

**Monthly Tasks:**

- Audit subscriber database for anomalies
- Check Supabase project health and storage
- Review and rotate webhook secret (if 90 days passed)

**Set Up Alerts For:**

- Repeated webhook failures (5+ in a row)
- 500 errors from webhook endpoint
- Unauthorized access attempts (401 errors)
- Database connection failures

## References

- **Webhook Implementation**: `src/routes/api/patreon/webhook/+server.ts`
- **Patreon API Documentation**: https://docs.patreon.com/#webhooks
- **Signature Verification**: `src/lib/server/patreon/verify-webhook.ts`
- **Testing Guide**: `POST_DEPLOYMENT_TESTING.md`
- **Security Best Practices**: `SECURITY.md`
- **Database Setup**: `supabase/README.md`

## Support

If you encounter issues not covered in this guide:

1. Check **Patreon Developer Documentation**: https://docs.patreon.com/
2. Review **Application Logs** in your deployment platform
3. Check **Supabase Dashboard** for database errors
4. Consult **SECURITY.md** for security-related questions
5. Join **Patreon Creator Discord**: https://discord.gg/patreon

---

**Last Updated:** 2025-12-15

**Document Version:** 1.0

**Maintained By:** Carlos Santos
