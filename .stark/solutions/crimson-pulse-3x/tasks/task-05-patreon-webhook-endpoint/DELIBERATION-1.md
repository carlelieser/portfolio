# Deliberation 1

**Task:** Patreon Webhook Endpoint Implementation
**Created:** 2025-12-15T19:05:00Z

---

## Review of Prior Thinking

This is the first deliberation for Task 5. The REPORT.md provides a comprehensive execution plan with 10 steps covering:
1. TypeScript type definitions for Patreon webhooks
2. Webhook signature verification utility
3. Supabase subscriber service integration
4. Main webhook endpoint handler in SvelteKit
5. Event processing logic for subscription events
6. Error handling and logging
7. Environment variable configuration
8. Local testing with mock payloads
9. Documentation
10. Production integration verification

The report identifies key risks around API documentation accuracy, signature verification implementation, and email field extraction from the payload.

---

## New Insights

### Critical Discovery: MD5 vs SHA256 for Signature Verification

**Finding:** Based on research into Patreon's webhook implementation, Patreon uses **MD5** (not SHA256) for HMAC signature verification. This is a critical deviation from the initial assumption in the REPORT.md which mentioned HMAC-SHA256.

**Evidence:**
- The Patreon developer community confirms: "The message signature is the HEX digest of the message body HMAC signed (with MD5) using your webhook's secret"
- Reference implementation in Go uses: `hmac.New(md5.New, []byte(secret))`
- Header used: `X-Patreon-Signature` (confirmed)

**Implications:**
- Must use Node.js `crypto.createHmac('md5', secret)` instead of 'sha256'
- MD5 is cryptographically weak but still used by Patreon for legacy reasons
- Security note: HMAC-MD5 is still acceptable for webhook verification (preventing unauthorized requests) even though MD5 is broken for collision attacks

**Code Impact:**
```typescript
// Correct implementation
import crypto from 'crypto';

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('md5', secret);
  hmac.update(body);
  const computedSignature = hmac.digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}
```

### Webhook Payload Structure Clarity

**Real Production Payload:**
From developer testing, the actual payload structure for `members:pledge:create` includes:
- `data.attributes.email` - Subscriber email (PRIMARY identifier)
- `data.attributes.full_name` - Patron name
- `data.attributes.patron_status` - Status (e.g., "active_patron")
- `data.attributes.last_charge_status` - Payment status
- `data.id` - Unique member ID

**Key Observation:** Email is reliably present in `data.attributes.email`. The initial concern about email location variability appears less critical based on production examples.

### Integration with Existing Subscriber Utilities

**Excellent News:** Task 2 has already delivered a complete subscriber management module at:
`/Users/devplex/Documents/Projects/Development/carlelieser/carlos-santos-site/src/lib/server/subscribers.ts`

**Available Functions:**
1. `upsertSubscriber(email: string, isActive: boolean)` - Perfect for `members:pledge:create`
2. `updateSubscriberStatus(email: string, isActive: boolean)` - Alternative for `members:pledge:delete`
3. `getSubscriberByEmail(email: string)` - For verification
4. `isActiveSubscriber(email: string)` - Convenience method

**Email Normalization:** Already implemented (lowercase + trim) in the subscriber utilities, ensuring consistency.

**Error Handling:** Custom `SubscriberError` class with code and details already in place.

**This significantly reduces implementation complexity** - we don't need to build database operations from scratch.

### Event Type Handling Strategy

**Events to Support:**
1. `members:pledge:create` → Call `upsertSubscriber(email, true)`
2. `members:pledge:delete` → Call `upsertSubscriber(email, false)` (soft delete via is_active flag)

**Recommendation:** Use `upsertSubscriber` for BOTH events rather than separate update/delete functions:
- Provides idempotency (safe to replay)
- Handles edge cases (subscriber doesn't exist on delete)
- Consistent interface
- Matches webhook retry behavior

### Patreon Testing Limitations

**Critical Finding:** Patreon does NOT have a test environment. Quote from research: "Patreon does not have a test environment per their own docs."

**Impact on Testing Strategy:**
1. Local testing MUST use manually crafted payloads
2. Cannot rely on Patreon's test event feature (appears unreliable based on developer reports)
3. Need to generate valid MD5 signatures locally for testing
4. Consider using ngrok or similar for production webhook testing with real Patreon events

**Recommendation:** Create a local testing script that generates valid signatures for both event types.

### Webhook Retry Behavior

**Patreon's Reliability Guarantee:**
- Patreon stores failed webhook deliveries
- Automatic retries for network failures or 5xx errors
- Continues retrying until server recovers

**Implementation Requirement:**
- MUST respond quickly (<2 seconds as noted in REPORT)
- MUST be idempotent (handle duplicate events gracefully)
- Return 200 for successful processing
- Return 5xx only for systemic failures (not validation errors)
- Return 4xx for bad requests to stop retries

### Environment Variables Already Configured

**Confirmed:** The `.env.example` already includes:
```
PATREON_WEBHOOK_SECRET=your-patreon-webhook-secret
```

This was set up in Task 2/7. No additional environment configuration needed beyond populating the actual secret.

---

## Questions Resolved

### Q1: What hashing algorithm does Patreon use for signatures?
**A:** MD5 (not SHA256 as initially assumed). Use `crypto.createHmac('md5', secret)`.

### Q2: Where is the email field located in the webhook payload?
**A:** Reliably at `data.attributes.email` based on production examples.

### Q3: Do we need to build database operations from scratch?
**A:** No. Task 2 already delivered a complete subscriber utilities module with all needed functions.

### Q4: Should we use separate functions for create vs delete events?
**A:** Use `upsertSubscriber(email, isActive)` for both - provides better idempotency and consistency.

### Q5: Can we test with Patreon's test environment?
**A:** No test environment exists. Must use local testing with crafted payloads or ngrok for production testing.

### Q6: What HTTP status codes should we return?
**A:**
- 200: Success
- 401: Invalid signature (stop retries)
- 400: Bad payload (stop retries)
- 500: Server error (triggers Patreon retries)

---

## Open Questions

### Q1: Should we extract and store patron name or other metadata?
**Current Plan:** Only extract email (minimal viable approach).

**Consideration:** The payload includes `full_name`, `patron_status`, `last_charge_date`, etc. Should we extend the database schema to store this?

**Recommendation for MVP:** Stick with email-only. The subscribers table currently only has email and is_active. Can enhance later if needed.

### Q2: How should we handle the `members:pledge:update` event?
**Not in Current Scope:** The REPORT only mentions create and delete events.

**Consideration:** Patrons can modify their pledge amount or tier. Should we handle updates?

**Recommendation for MVP:** Log the event but don't process it. Focus on create/delete for MVP. Document as future enhancement.

### Q3: Should we implement request ID tracking for debugging?
**Current Plan:** Basic logging of events.

**Consideration:** Patreon might include request/event IDs in headers or payload. Should we track these for debugging webhook issues?

**Recommendation:** Check for standard headers (X-Request-ID, X-Patreon-Event) and log them if present. Low effort, high value for debugging.

### Q4: Do we need rate limiting on the webhook endpoint?
**Security Consideration:** The signature verification provides authentication, but could the endpoint be abused with valid signatures from compromised secrets?

**Recommendation for MVP:** No rate limiting initially. Signature verification is primary defense. Can add rate limiting post-MVP if needed.

### Q5: Should we validate the patron_status field?
**Consideration:** The payload includes `patron_status` which might be "active_patron", "former_patron", etc. Should we validate this before updating the database?

**Recommendation:** For `members:pledge:create`, we could verify patron_status is "active_patron" before setting is_active=true. Adds robustness.

**Decision Needed:** Include basic validation or trust Patreon's event type?

---

## Confidence Assessment

| Aspect | Confidence | Notes |
|--------|------------|-------|
| Understanding | High | Clear understanding of Patreon webhook structure and requirements after research |
| Approach | High | Leveraging existing subscriber utilities greatly simplifies implementation |
| Risks identified | High | MD5 vs SHA256 discovery prevented critical implementation error |
| Signature verification | High | Clear implementation path using MD5 HMAC with hex encoding |
| Payload parsing | Medium-High | Production examples provide clarity, but edge cases may exist |
| Integration points | High | Subscriber utilities from Task 2 are well-designed and ready to use |
| Testing strategy | Medium | Lack of Patreon test environment requires manual testing approach |
| Error handling | High | Clear HTTP status code strategy and existing error types |
| Security | Medium-High | Signature verification solid, but MD5 weakness noted (acceptable for HMAC) |
| Performance | High | Upsert operations are fast, response time should be well under 2 seconds |

---

## Recommendation

**READY FOR EXECUTION**

### Rationale

**Strengths:**
1. **Clear technical path:** MD5 HMAC signature verification is well-understood and documented
2. **Excellent code reuse:** Subscriber utilities from Task 2 eliminate need for database operation implementation
3. **Simple scope:** Only two event types to handle with a single function (`upsertSubscriber`)
4. **Environment ready:** Webhook secret already configured in environment template
5. **Type safety:** Can define precise TypeScript types based on production payload examples
6. **Testing approach:** Can create local test script with valid signatures

**Managed Risks:**
1. MD5 weakness documented but acceptable for HMAC use case
2. No Patreon test environment, but manual testing strategy viable
3. Edge cases (missing email, etc.) handled by existing error handling

**Minimal Open Questions:**
- All critical questions resolved
- Remaining questions are enhancements (metadata storage, update events, request tracking)
- Can make pragmatic decisions to keep MVP scope tight

**Dependencies Satisfied:**
- Task 1 (Project Init): Complete ✓
- Task 2 (Supabase Setup): Complete ✓ (including subscriber utilities)
- Environment infrastructure: Ready ✓

### Suggested Execution Refinements

**Streamlined Steps (vs REPORT's 10 steps):**

1. **Define Patreon webhook types** (`src/lib/types/patreon.ts`)
   - Based on production payload structure from research
   - Include only needed fields for MVP

2. **Implement signature verification** (`src/lib/server/patreon/verify-webhook.ts`)
   - Use MD5 (not SHA256)
   - Timing-safe comparison

3. **Create webhook endpoint** (`src/routes/api/patreon/webhook/+server.ts`)
   - Extract signature from `X-Patreon-Signature` header
   - Verify signature
   - Parse payload
   - Extract email from `data.attributes.email`
   - Route to `upsertSubscriber(email, isActive)` based on event type
   - Return appropriate HTTP status codes

4. **Create local testing script**
   - Generate valid MD5 signatures
   - Test both event types
   - Verify database updates

5. **Add logging and documentation**
   - Log all webhook attempts
   - Document Patreon webhook configuration
   - Add inline code comments

**Estimated Complexity:** Medium (was High before discovering existing subscriber utilities)

**Estimated Time:** 2-3 hours (vs 4-6 hours originally)

**Biggest Value-Add:** Discovering the MD5 requirement and existing subscriber utilities - both would have caused significant rework if found during execution.

---

## Implementation Checklist

**Before Starting:**
- [ ] Confirm Patreon account has webhook access
- [ ] Verify PATREON_WEBHOOK_SECRET can be obtained from Patreon dashboard
- [ ] Review subscriber utilities API in detail

**During Execution:**
- [ ] Use MD5 for HMAC (not SHA256)
- [ ] Extract email from `data.attributes.email`
- [ ] Use `upsertSubscriber` for both create and delete events
- [ ] Implement timing-safe signature comparison
- [ ] Return 200 for success, 401 for auth failure, 400 for bad request, 500 for server error
- [ ] Create test script with valid signature generation

**Post-Execution:**
- [ ] Test locally with crafted payloads
- [ ] Verify database updates correctly
- [ ] Document Patreon webhook setup process
- [ ] Consider ngrok testing before production deployment

---

## Research Sources

This deliberation was informed by research into Patreon's webhook implementation:

- [Webhooks HMAC verification - Patreon Developers](https://www.patreondevelopers.com/t/webhooks-hmac-verification/634)
- [Using Patreon's Webhooks to Track Pledges](http://www.brianchuchua.dev/patreon-webhooks/)
- [Patreon API Documentation](https://docs.patreon.com/)
- [Patreon Go Implementation - webhook.go](https://github.com/mxpv/patreon-go/blob/master/webhook.go)

Key finding: Patreon uses MD5 for HMAC signatures, not SHA256. Production payloads reliably include email at `data.attributes.email`.
