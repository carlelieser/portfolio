# Task: Patreon Webhook Endpoint Implementation

**Solution:** crimson-pulse-3x
**Task ID:** task-05-patreon-webhook-endpoint
**Status:** Complete

---

## Description

Implement a secure API endpoint to receive and process Patreon webhook events for subscription management. This endpoint will handle incoming webhook requests from Patreon, verify their authenticity, and automatically update the subscriber database when users subscribe or unsubscribe.

The endpoint needs to:
- Accept POST requests at `/api/patreon/webhook`
- Verify webhook signatures to ensure requests are legitimate
- Parse Patreon webhook payloads to extract subscriber information
- Handle subscription creation and deletion events
- Update the Supabase subscribers table with the appropriate status
- Return proper HTTP status codes and error messages
- Log events for debugging and monitoring

---

## Analysis

### Webhook Architecture

**Endpoint Location:** The webhook will be implemented as a SvelteKit API route at `src/routes/api/patreon/webhook/+server.ts`. This leverages SvelteKit's built-in API routing system, which provides:
- Type-safe request/response handling
- Automatic route registration
- Easy integration with the rest of the application
- Server-side execution environment

### Patreon Webhook Events

**Primary Events to Handle:**

1. **`members:pledge:create`** - Fired when a user becomes a patron
   - Extract user's email address from payload
   - Add email to subscribers table with `is_active = true`
   - Set `created_at` timestamp

2. **`members:pledge:delete`** - Fired when a user cancels their pledge
   - Extract user's email address from payload
   - Update existing record to set `is_active = false`
   - Update `updated_at` timestamp

**Payload Structure Considerations:**
- Email address location in payload (typically in `data.attributes.email` or user object)
- Patron ID for tracking (optional for future enhancements)
- Subscription tier information (may be needed for future tier-based access)
- Event timestamp for audit logging

### Security Implementation

**Webhook Signature Verification:**
Patreon signs webhook requests using HMAC-SHA256. The implementation must:

1. Extract the signature from request headers (`X-Patreon-Signature`)
2. Compute HMAC-SHA256 hash of the raw request body using the webhook secret
3. Compare computed hash with received signature using constant-time comparison
4. Reject requests with invalid or missing signatures (401 Unauthorized)

**Security Considerations:**
- Use Node.js `crypto` module for HMAC computation
- Implement timing-safe comparison to prevent timing attacks
- Never log or expose the webhook secret
- Validate payload structure before processing
- Handle replay attacks (optional: timestamp validation)

### Database Operations

**Subscriber Table Interactions:**

```sql
-- Table structure (from Task 2)
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Operations Required:**

1. **New Subscription (UPSERT):**
   ```typescript
   // Insert new subscriber or update if exists
   await supabase
     .from('subscribers')
     .upsert({
       email: subscriberEmail,
       is_active: true,
       updated_at: new Date().toISOString()
     }, {
       onConflict: 'email'
     });
   ```

2. **Cancelled Subscription (UPDATE):**
   ```typescript
   // Update existing subscriber to inactive
   await supabase
     .from('subscribers')
     .update({
       is_active: false,
       updated_at: new Date().toISOString()
     })
     .eq('email', subscriberEmail);
   ```

### Error Handling Strategy

**Error Categories:**

1. **Authentication Errors (401):**
   - Missing signature
   - Invalid signature
   - Missing webhook secret configuration

2. **Validation Errors (400):**
   - Malformed JSON payload
   - Missing required fields (email, event type)
   - Unsupported event type

3. **Server Errors (500):**
   - Database connection failures
   - Supabase query errors
   - Unexpected exceptions

**Logging Strategy:**
- Log all webhook attempts (timestamp, event type, success/failure)
- Log errors with stack traces for debugging
- Sanitize logs to avoid exposing sensitive data (emails can be partially masked)
- Use structured logging for easy filtering and monitoring

### TypeScript Type Safety

**Type Definitions Required:**

```typescript
// Patreon webhook event structure
interface PatreonWebhookEvent {
  data: {
    type: 'member' | string;
    id: string;
    attributes: {
      email: string;
      full_name?: string;
      patron_status?: string;
      // ... other fields
    };
  };
  included?: Array<unknown>;
  // ... other fields
}

// Webhook verification result
interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
}

// Database operation result
interface SubscriberUpdateResult {
  success: boolean;
  error?: string;
}
```

### Performance Considerations

**Response Time:**
- Webhook endpoints should respond quickly (<2 seconds)
- Patreon may retry if endpoint times out
- Database operations should be optimized with proper indexes
- Consider async processing for non-critical operations

**Concurrency:**
- Handle multiple simultaneous webhook events gracefully
- Database UPSERT prevents race conditions
- No complex locking needed for MVP

---

## Acceptance Criteria

- [x] API route created at `/api/patreon/webhook`
- [x] POST endpoint accepts webhook payload
- [x] Webhook signature verification implemented
- [x] Handles `members:pledge:create` event (new subscriber)
- [x] Handles `members:pledge:delete` event (cancelled subscription)
- [x] Extracts email from Patreon payload
- [x] Updates Supabase subscribers table accordingly
- [x] Returns appropriate HTTP status codes
- [x] Error handling for invalid payloads
- [x] Logging for debugging webhook events

---

## Execution Plan

### Step 1: Create TypeScript Types for Patreon Webhooks

**Action:** Define TypeScript interfaces for Patreon webhook payloads and internal data structures.

**Details:**
- Create `src/lib/types/patreon.ts` file
- Define interfaces for:
  - PatreonWebhookEvent (full payload structure)
  - PatreonMember (member data attributes)
  - WebhookEventType (enum for supported events)
- Research Patreon API documentation for exact payload structure
- Add JSDoc comments explaining each field

**Output:** Type-safe interfaces ready for import in webhook handler

---

### Step 2: Implement Webhook Signature Verification Utility

**Action:** Create a reusable function to verify Patreon webhook signatures using HMAC-SHA256.

**Details:**
- Create `src/lib/server/patreon/verify-webhook.ts`
- Import Node.js `crypto` module
- Implement `verifyWebhookSignature(body: string, signature: string, secret: string): boolean`
- Use `crypto.createHmac('sha256', secret)` to compute hash
- Implement timing-safe comparison using `crypto.timingSafeEqual()`
- Add error handling for missing parameters
- Write function with clear JSDoc documentation

**Output:** Secure, reusable verification function

---

### Step 3: Create Supabase Subscriber Service

**Action:** Build service module for subscriber database operations.

**Details:**
- Create `src/lib/server/subscribers.ts` (or extend existing from Task 6)
- Implement `addOrUpdateSubscriber(email: string): Promise<Result>`
- Implement `deactivateSubscriber(email: string): Promise<Result>`
- Use Supabase client with service role key for server-side operations
- Add proper error handling and return structured results
- Include TypeScript types for all function signatures

**Output:** Clean API for subscriber database operations

---

### Step 4: Implement Main Webhook Endpoint Handler

**Action:** Create the SvelteKit API route that processes incoming webhook requests.

**Details:**
- Create `src/routes/api/patreon/webhook/+server.ts`
- Export `POST` function handler
- Parse incoming request body
- Extract `X-Patreon-Signature` header
- Call verification function with body, signature, and secret from env
- Return 401 if signature verification fails
- Parse JSON payload into typed PatreonWebhookEvent
- Handle JSON parsing errors with 400 response

**Output:** Functional endpoint that securely accepts webhook requests

---

### Step 5: Implement Event Processing Logic

**Action:** Add business logic to handle different Patreon event types.

**Details:**
- Inside webhook handler, extract event type from payload
- Implement switch/case or if/else for event types:
  - `members:pledge:create`: Extract email, call addOrUpdateSubscriber()
  - `members:pledge:delete`: Extract email, call deactivateSubscriber()
  - Unsupported events: Log and return 200 (acknowledge but don't process)
- Extract email from `event.data.attributes.email`
- Validate email is present and valid format
- Return 400 if required data is missing

**Output:** Event-driven logic that routes to appropriate database operations

---

### Step 6: Add Error Handling and Logging

**Action:** Implement comprehensive error handling and logging throughout the webhook handler.

**Details:**
- Wrap all operations in try/catch blocks
- Log incoming webhook events (sanitize sensitive data)
- Log verification failures with reason
- Log database operation results
- Return appropriate HTTP status codes:
  - 200: Success
  - 400: Bad request (malformed payload)
  - 401: Unauthorized (signature verification failed)
  - 500: Internal server error (database/unexpected errors)
- Include helpful error messages in response body (for debugging, not for Patreon)
- Use console.error() for errors, console.log() for info (or use logging library)

**Output:** Robust error handling and debugging capability

---

### Step 7: Configure Environment Variables

**Action:** Ensure webhook secret is properly configured in environment.

**Details:**
- Add `PATREON_WEBHOOK_SECRET` to `.env` file (local development)
- Add to `.env.example` with documentation
- Document how to obtain webhook secret from Patreon developer portal
- Add validation to check secret is loaded at runtime
- Update deployment platform environment variables (from Task 8)

**Output:** Secure secret management in all environments

---

### Step 8: Local Testing with Mock Payloads

**Action:** Test webhook endpoint locally using simulated Patreon payloads.

**Details:**
- Create sample webhook payloads for both event types
- Generate valid signatures using the webhook secret
- Use curl, Postman, or HTTP client to send test requests
- Test scenarios:
  - Valid subscription creation
  - Valid subscription deletion
  - Invalid signature (should return 401)
  - Malformed payload (should return 400)
  - Missing email field (should return 400)
- Verify database updates correctly after each test
- Check logs for proper output

**Output:** Verified endpoint behavior before production deployment

---

### Step 9: Documentation and Comments

**Action:** Document the webhook implementation for future maintenance.

**Details:**
- Add inline comments explaining signature verification
- Document event type handling logic
- Add JSDoc comments to all functions
- Update main README with webhook configuration instructions
- Document Patreon webhook setup process:
  1. How to create webhook in Patreon dashboard
  2. What URL to use
  3. Which events to subscribe to
  4. How to obtain and configure webhook secret
- Include troubleshooting section for common issues

**Output:** Well-documented, maintainable code

---

### Step 10: Integration Verification

**Action:** Verify endpoint works with actual Patreon webhook delivery.

**Details:**
- Deploy endpoint to production (or use ngrok for local testing)
- Configure webhook in Patreon developer portal
- Trigger test event from Patreon dashboard (if available)
- Monitor logs for incoming requests
- Verify signature verification works with real Patreon signatures
- Check database updates correctly
- Test with real subscription if possible (or wait for first real event)
- Document any issues or edge cases discovered

**Output:** Production-ready webhook endpoint verified with Patreon integration

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Patreon API documentation incomplete/outdated | Medium | High | Research multiple sources, check Patreon community forums, test with real payloads early |
| Signature verification implementation errors | Medium | Critical | Use well-tested crypto libraries, implement timing-safe comparison, test thoroughly with known signatures |
| Email field missing or in different location in payload | Medium | High | Add validation and fallback logic, check multiple possible locations for email, log payload structure when email not found |
| Database connection failures during webhook processing | Low | High | Implement retry logic, return 500 to trigger Patreon retry, add monitoring/alerting |
| Patreon webhook secret exposure | Low | Critical | Use environment variables, never commit to git, restrict access to deployment platform |
| Race conditions with simultaneous events | Low | Medium | Use database UPSERT operations, rely on email UNIQUE constraint |
| Webhook endpoint DDoS or abuse | Low | Medium | Implement rate limiting (future), rely on signature verification, monitor unusual activity |
| TypeScript type mismatches with actual payload | High | Medium | Start with flexible types, tighten as real payloads are observed, add runtime validation |
| SvelteKit API route not accessible in production | Low | High | Test deployment early, verify serverless function configuration, check platform-specific requirements |
| Patreon webhook retry logic overwhelming system | Low | Medium | Ensure fast response times, fix issues quickly, implement idempotent operations |

---

## Dependencies

### Technical Dependencies

**Must exist before execution:**
- [ ] SvelteKit project initialized with TypeScript (Task 1)
- [ ] Supabase project configured with subscribers table (Task 2)
- [ ] Supabase client configured in application (Task 2)
- [ ] Environment variable infrastructure set up (Task 7, can be done in parallel)

**External service requirements:**
- [ ] Patreon account with webhook access
- [ ] Patreon webhook secret obtained from developer portal
- [ ] Understanding of Patreon webhook event structure

**Development environment:**
- [ ] Node.js crypto module available (built-in)
- [ ] HTTP testing tool (curl, Postman, or similar)
- [ ] Access to Patreon developer documentation

### Knowledge Dependencies

**Required understanding:**
- HMAC signature verification principles
- SvelteKit API route structure and request handling
- Supabase server-side client usage
- TypeScript async/await and error handling patterns
- HTTP status codes and REST API conventions

### Optional Dependencies

**Nice to have but not required:**
- ngrok or similar tool for local webhook testing
- Patreon test account for generating real events
- Structured logging library (can use console for MVP)
- Request validation library (can implement manually)

---

## Notes

### Implementation Considerations

**Email Extraction Strategy:**
The exact location of the email field in Patreon webhooks may vary. Need to check:
1. `data.attributes.email` (most likely)
2. `included` array with user object
3. Alternative fields if email is not directly provided

Implement defensive extraction with fallbacks and clear error messages.

**Idempotency:**
Webhook endpoints should be idempotent - processing the same event multiple times should have the same result. The UPSERT operation for new subscriptions naturally provides this. For deletions, updating an already-inactive subscriber is safe.

**Future Enhancements:**
- Webhook event replay prevention (timestamp validation)
- Support for additional event types (pledge updates, tier changes)
- Detailed audit logging of all subscription changes
- Admin notifications for subscription events
- Patron tier tracking for tiered access control
- Webhook delivery failure alerting

**Testing Strategy:**
Due to the external dependency on Patreon, testing should include:
1. Unit tests for signature verification function
2. Integration tests with mock payloads
3. Manual testing with Patreon test events
4. Monitoring first real production events closely

---

## Success Metrics

**Functional Success:**
- Endpoint returns 200 for valid webhook events
- Endpoint returns 401 for invalid signatures
- Endpoint returns 400 for malformed payloads
- Database correctly updated for subscription events
- Can successfully process test events locally

**Code Quality:**
- All code properly typed with TypeScript
- No `any` types in production code
- Comprehensive error handling implemented
- Clear logging for debugging
- Well-documented with comments and README

**Security:**
- Signature verification working correctly
- Webhook secret never exposed in code or logs
- Proper HTTP status codes prevent information leakage
- No sensitive data logged unnecessarily

**Operational:**
- Fast response time (<2 seconds)
- Clear error messages for debugging
- Easy to configure via environment variables
- Documented setup process for Patreon integration
