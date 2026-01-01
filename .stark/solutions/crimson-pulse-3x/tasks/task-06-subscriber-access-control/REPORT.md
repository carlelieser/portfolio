# Task: Subscriber Access Control Logic

**Solution:** crimson-pulse-3x
**Task ID:** task-06-subscriber-access-control
**Status:** Planning

---

## Description

Implement utility functions and middleware to check subscriber access based on email address. This task creates the core access control logic that will be used throughout the application to determine whether a given email address corresponds to an active Patreon subscriber.

---

## Analysis

### Purpose
This task establishes the foundational access control system for the Carlos Santos personal brand website. The subscriber access logic will serve as the gatekeeper for any protected content or features that should only be available to active Patreon subscribers.

### Technical Requirements

**Core Functionality:**
- Query Supabase `subscribers` table to check if an email exists and is active
- Provide a clean, type-safe API for access verification
- Handle edge cases gracefully (null/undefined emails, database errors, network issues)
- Optimize for performance to avoid excessive database queries

**TypeScript Integration:**
- Define clear interfaces for subscriber data structures
- Ensure full type safety with no `any` types
- Export types for reuse across the application
- Type guard functions for runtime validation

**Error Handling:**
- Gracefully handle database connection failures
- Return appropriate defaults when errors occur (fail-safe approach)
- Log errors for debugging without exposing internals
- Handle malformed email addresses

**Performance Considerations:**
- Consider implementing caching to reduce database load
- Optimize query structure for fast lookups
- Prepare for future scaling needs (indexing strategy)
- Minimize response time for access checks

### Integration Points

**Supabase Client:**
- Uses the Supabase client established in Task 2
- Queries the `subscribers` table schema
- Leverages RLS policies for security

**Future Usage:**
- Will be used by protected route middleware (future feature)
- Can be called from server-side API routes
- May be extended for subscriber tier checking
- Foundation for admin dashboard functionality

### Security Considerations

- Email addresses are sensitive PII - handle carefully
- Ensure RLS policies prevent unauthorized access to subscriber data
- Use server-side only functions (not exposed to client)
- Validate email format before database queries
- Prevent injection attacks through parameterized queries

---

## Acceptance Criteria

- [ ] Function to check if email exists in active subscribers
- [ ] TypeScript interface for subscriber data
- [ ] Reusable across application
- [ ] Handles edge cases (null email, database errors)
- [ ] Cached or optimized for performance

---

## Execution Plan

### Step 1: Define TypeScript Interfaces and Types

**Details:**
- Create `src/lib/types/subscriber.ts` file
- Define `Subscriber` interface matching database schema:
  - `id`: string (UUID)
  - `email`: string
  - `is_active`: boolean
  - `created_at`: Date/string
  - `updated_at`: Date/string
- Define `SubscriberAccessResult` type for access check responses
- Export all types for application-wide use

**Expected Outcome:** Type-safe subscriber data structures available for import

---

### Step 2: Create Subscriber Utility Module

**Details:**
- Create `src/lib/server/subscribers.ts` file
- Import Supabase client from `src/lib/server/supabase.ts`
- Import subscriber types
- Create server-side only module (in `/server` directory)

**Expected Outcome:** Module structure ready for utility functions

---

### Step 3: Implement Email Validation Helper

**Details:**
- Create `isValidEmail(email: string): boolean` function
- Basic email format validation using regex
- Handle null/undefined inputs gracefully
- Return `false` for invalid emails

**Expected Outcome:** Reliable email validation before database queries

---

### Step 4: Implement Core Access Check Function

**Details:**
- Create `checkSubscriberAccess(email: string): Promise<boolean>` function
- Validate email using helper function
- Query Supabase: `SELECT is_active FROM subscribers WHERE email = ?`
- Return `true` if subscriber exists and `is_active` is `true`
- Return `false` for non-existent or inactive subscribers
- Handle database errors with try/catch
- Log errors appropriately

**Expected Outcome:** Working access verification function

---

### Step 5: Implement Subscriber Retrieval Function

**Details:**
- Create `getSubscriberByEmail(email: string): Promise<Subscriber | null>` function
- Validate email format
- Query full subscriber record from database
- Return typed `Subscriber` object or `null`
- Include error handling

**Expected Outcome:** Function to retrieve full subscriber details when needed

---

### Step 6: Add Error Handling and Logging

**Details:**
- Wrap database queries in try/catch blocks
- Use console.error for development (consider structured logging later)
- Return safe defaults on errors (deny access by default)
- Add JSDoc comments for all functions
- Document error scenarios in comments

**Expected Outcome:** Robust error handling with helpful debugging information

---

### Step 7: Performance Optimization - Caching Strategy (Optional)

**Details:**
- Evaluate if caching is needed for MVP
- If implementing: use in-memory cache with TTL (Time To Live)
- Consider using simple Map-based cache or library like `lru-cache`
- Set reasonable TTL (e.g., 5 minutes)
- Cache subscriber status by email
- Invalidate cache on webhook updates (future integration)

**Expected Outcome:** Reduced database load for repeated access checks

---

### Step 8: Create Unit Tests (Optional for MVP)

**Details:**
- If time permits, create basic tests
- Test valid email scenarios
- Test invalid email scenarios
- Test error handling
- Mock Supabase client for isolated testing

**Expected Outcome:** Basic test coverage for critical functions

---

### Step 9: Integration Verification

**Details:**
- Create test script or API endpoint to verify functions work
- Test with known email addresses (seed test data if needed)
- Verify TypeScript compilation
- Ensure no type errors
- Check server-side only restrictions (not exported to client)

**Expected Outcome:** Confirmed working subscriber access control

---

### Step 10: Documentation

**Details:**
- Add JSDoc comments to all exported functions
- Document function parameters and return types
- Include usage examples in comments
- Document error scenarios and edge cases
- Update relevant documentation files if needed

**Expected Outcome:** Well-documented, self-explanatory code

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase client not properly initialized | Low | High | Verify Task 2 completion, test database connection before proceeding |
| Email validation too strict/lenient | Medium | Medium | Use standard email regex, test with various email formats |
| Performance issues with repeated queries | Medium | Medium | Implement caching strategy, use database indexing on email column |
| Type mismatches with database schema | Low | Medium | Use Supabase type generation, manual verification of schema |
| Error handling exposes sensitive info | Low | High | Log errors server-side only, return generic responses to client |
| RLS policies block legitimate queries | Low | High | Use service role key for server-side operations, test thoroughly |

---

## Dependencies

**Hard Dependencies (Must exist before execution):**
- Task 2: Supabase project setup and configuration must be complete
  - `subscribers` table must exist in database
  - Supabase client must be initialized in `src/lib/server/supabase.ts`
  - Environment variables configured (SUPABASE_URL, keys)
- Task 1: Project initialization with TypeScript
  - SvelteKit project structure in place
  - TypeScript compiler configured

**Soft Dependencies (Nice to have):**
- Database indexing on `email` column for performance
- Test data in subscribers table for verification
- Logging infrastructure (can use console for MVP)

**Provides For (Enables future tasks):**
- Task 5: Patreon webhook can use these functions to verify subscribers
- Future protected routes can use access control
- Admin dashboard can leverage subscriber retrieval functions

---

## Notes

**Design Decisions:**
- Server-side only module to protect sensitive operations
- Fail-safe approach: deny access on errors rather than risk unauthorized access
- Simple boolean return for most common use case (access check)
- Separate function for retrieving full subscriber data when needed

**Future Enhancements:**
- Implement Redis or similar for distributed caching
- Add subscriber tier/level checking
- Webhook cache invalidation on subscriber updates
- Comprehensive logging with structured logger
- Advanced analytics on subscriber access patterns

**Testing Strategy:**
- Manual testing sufficient for MVP
- Future: Unit tests with mocked Supabase
- Integration tests with test database
- Load testing for performance validation
