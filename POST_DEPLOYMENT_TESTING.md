# Post-Deployment Testing Checklist

This document provides a comprehensive testing checklist to execute after deploying the Carlos Santos website to production with real credentials configured.

**Prerequisites:**

- Application deployed to production (Vercel, Netlify, etc.)
- Real Supabase project created with database tables
- Environment variables configured with actual credentials
- Patreon developer account with webhook configured

---

## Phase 1: Infrastructure Verification

### Database Setup

- [ ] Verify Supabase project is accessible
- [ ] Confirm `subscribers` table exists with correct schema
- [ ] Test Row Level Security (RLS) policies
- [ ] Verify indexes are created
- [ ] Test database connection from production application

### Deployment Verification

- [ ] Production URL loads successfully
- [ ] SSL/HTTPS certificate valid
- [ ] No 404 errors on routes
- [ ] Environment variables properly loaded

### Health Check

- [ ] Run: `curl https://your-domain.com/api/health`
- [ ] Verify "healthy" status
- [ ] Confirm Supabase connection passing

---

## Phase 2: Landing Page Testing

### Visual Verification

- [ ] Load production homepage
- [ ] Verify all sections render: Hero, About, Projects, Contact
- [ ] Check all buttons and links work
- [ ] Test Patreon CTA buttons link correctly
- [ ] Verify email link works: `hello@carlossantos.dev`
- [ ] Test social media links (GitHub, LinkedIn, Twitter)

### Responsive Design

- [ ] 320px (smallest mobile)
- [ ] 375px (iPhone standard)
- [ ] 414px (iPhone Plus)
- [ ] 768px (tablet portrait)
- [ ] 1024px (tablet landscape)
- [ ] 1280px (laptop)
- [ ] 1440px (desktop)

### Real Device Testing

- [ ] iPhone (Safari)
- [ ] Android device (Chrome)
- [ ] iPad or tablet
- [ ] Desktop browser

### Cross-Browser

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (macOS)
- [ ] Safari (iOS)

### Console Check

- [ ] Open DevTools console
- [ ] Navigate through all sections
- [ ] Verify zero JavaScript errors
- [ ] Check Network tab for no 404s
- [ ] Verify no CORS errors

---

## Phase 3: Webhook Integration Testing

### Patreon Configuration

- [ ] Log into Patreon Developer Portal
- [ ] Configure webhook URL: `https://your-domain.com/api/patreon/webhook`
- [ ] Set webhook secret in Patreon and environment
- [ ] Subscribe to events: `members:pledge:create`, `members:pledge:delete`

### Test Case 1: New Subscriber

- [ ] Send `members:pledge:create` event via Patreon testing tool
- [ ] Verify 200 OK response
- [ ] Check application logs for success
- [ ] Query database: `SELECT * FROM subscribers WHERE email = '[test-email]'`
- [ ] Confirm record created with `is_active = true`

### Test Case 2: Subscriber Cancellation

- [ ] Send `members:pledge:delete` event
- [ ] Verify 200 OK response
- [ ] Confirm subscriber marked `is_active = false`
- [ ] Verify `updated_at` timestamp changed

### Test Case 3: Invalid Signature (Security)

- [ ] Send payload with incorrect signature
- [ ] Expected: 401 Unauthorized
- [ ] Verify no database changes

### Test Case 4: Malformed Payload

- [ ] Send invalid JSON
- [ ] Expected: 400 Bad Request
- [ ] Verify no database changes

### Test Case 5: Idempotency

- [ ] Send same event twice
- [ ] Verify no duplicate records

### Test Case 6: Real-World (Optional)

- [ ] Create test Patreon account
- [ ] Make real pledge
- [ ] Verify webhook fires and database updates
- [ ] Cancel pledge and verify update

---

## Phase 4: Performance & Optimization

### Lighthouse Audit - Desktop

- [ ] Open Chrome DevTools > Lighthouse
- [ ] Run audit on production homepage
- [ ] Performance score >90
- [ ] Accessibility score >90
- [ ] Best Practices score >90
- [ ] SEO score >90
- [ ] Screenshot results

### Lighthouse Audit - Mobile

- [ ] Switch to mobile configuration
- [ ] Run audit on production homepage
- [ ] Largest Contentful Paint (LCP) <2.5s
- [ ] First Input Delay (FID) <100ms
- [ ] Cumulative Layout Shift (CLS) <0.1
- [ ] Screenshot results

### Performance Issues (if scores <90)

- [ ] Identify issues from Lighthouse report
- [ ] Optimize images if needed
- [ ] Review bundle size
- [ ] Check render-blocking resources
- [ ] Verify caching headers
- [ ] Test on 3G simulation

---

## Phase 5: Security & Privacy

### Security Checks

- [ ] Verify HTTPS enforced (HTTP → HTTPS redirect)
- [ ] Check SSL certificate validity
- [ ] Verify webhook signature verification working
- [ ] Ensure environment variables not in client bundle
- [ ] Verify service role key server-side only
- [ ] Test Supabase RLS prevents unauthorized access

### Privacy Checks

- [ ] Verify subscriber data not publicly accessible
- [ ] Test database queries require authentication
- [ ] Check email addresses not exposed in client

---

## Phase 6: End-to-End User Journey

### Complete Flow

- [ ] User discovers site
- [ ] User browses landing page
- [ ] User clicks "Become a Patron"
- [ ] User subscribes on Patreon
- [ ] Webhook fires to application
- [ ] Database records subscriber
- [ ] User later cancels
- [ ] Webhook processes cancellation
- [ ] Database updates status

### Edge Cases

- [ ] Multiple rapid subscriptions
- [ ] Network interruptions
- [ ] Database temporarily unavailable
- [ ] Verify graceful error handling

---

## Phase 7: Documentation & Sign-Off

### Test Results

- [ ] Document all test outcomes
- [ ] Screenshot Lighthouse scores
- [ ] Record webhook test results
- [ ] Note any issues and resolutions

### Launch Readiness

- [ ] All critical tests passing
- [ ] Lighthouse scores >90 (or documented)
- [ ] Webhook integration working
- [ ] Database operations verified
- [ ] No critical security issues
- [ ] Ready for public launch

---

## Quick Reference Commands

**Health Check:**

```bash
curl https://your-domain.com/api/health | jq .
```

**Test Webhook (with valid signature):**

```bash
curl -X POST https://your-domain.com/api/patreon/webhook \
  -H "Content-Type: application/json" \
  -H "X-Patreon-Signature: [signature]" \
  -d @test-payload.json
```

**Query Subscribers:**

```sql
-- In Supabase SQL Editor
SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 10;
```

**Check Active Subscribers:**

```sql
SELECT COUNT(*) FROM subscribers WHERE is_active = true;
```

---

## Support Resources

- **Patreon Webhook Documentation:** https://docs.patreon.com/#webhooks
- **Supabase Documentation:** https://supabase.com/docs
- **Lighthouse Scoring Guide:** https://developer.chrome.com/docs/lighthouse/
- **Web Vitals:** https://web.dev/vitals/

---

**Last Updated:** 2025-12-16

**Notes:**
This checklist should be executed after deploying the application. All tests marked in the local testing phase (TypeScript compilation, build verification, landing page rendering) have already passed. This document focuses on production-specific testing that requires real credentials and deployment infrastructure.
