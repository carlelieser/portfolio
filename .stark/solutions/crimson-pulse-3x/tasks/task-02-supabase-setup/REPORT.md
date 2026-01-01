# Task: Supabase Project Setup and Configuration

**Solution:** crimson-pulse-3x
**Task ID:** task-02-supabase-setup
**Status:** Complete

---

## Description

Set up the Supabase backend infrastructure for the Carlos Santos personal brand website. This includes creating or configuring a Supabase project, designing and implementing the database schema for subscriber management, configuring Row-Level Security (RLS) policies, integrating the Supabase client into the SvelteKit application, and establishing proper environment variable configuration for secure access to Supabase services.

---

## Analysis

### Technical Requirements

**Database Schema Design:**
- Create a `subscribers` table to track Patreon subscriber status
- Fields required:
  - `id`: UUID primary key (auto-generated)
  - `email`: Text field (unique, not null) - primary identifier from Patreon
  - `is_active`: Boolean (default true) - subscription status
  - `created_at`: Timestamp with timezone (auto-set on insert)
  - `updated_at`: Timestamp with timezone (auto-updated on modification)
- Additional considerations:
  - Email normalization (lowercase, trimmed)
  - Soft deletion vs hard deletion strategy
  - Historical tracking of subscription changes (optional for MVP)

**Security Architecture:**
- Row-Level Security (RLS) must be enabled on subscribers table
- RLS policies needed:
  - Service role: Full access (for webhook operations)
  - Anon role: Read-only access for checking subscriber status
  - Public: No direct INSERT/UPDATE/DELETE (only via webhook endpoint)
- Environment-based access control using Supabase client keys
- Webhook endpoint uses service role key for privileged operations
- Frontend uses anon key for read-only verification

**Integration Points:**
- Supabase JavaScript client (@supabase/supabase-js) integration in SvelteKit
- Client initialization in server-side code (`src/lib/server/supabase.ts`)
- Separate client instances for:
  - Server-side operations (service role key)
  - Client-side operations (anon key) - if needed
- TypeScript type generation from database schema
- Environment variable management for keys and URLs

**Performance Considerations:**
- Email field should be indexed for fast lookups
- Consider UPSERT operations for webhook handlers (idempotent)
- Connection pooling handled by Supabase (no manual pool management)
- Query optimization for subscriber status checks

### Dependencies

**Prerequisites:**
- Task 1 (Project Initialization) must be completed
- SvelteKit project must be scaffolded and functional
- Node.js environment with npm/pnpm available
- Access to Supabase account (free tier sufficient)

**External Services:**
- Supabase account with project creation permissions
- Internet connectivity for Supabase API access
- Browser access to Supabase dashboard for initial configuration

**Package Dependencies:**
- `@supabase/supabase-js` (v2.x) - official JavaScript client
- `dotenv` or SvelteKit's built-in env handling
- TypeScript definitions for Supabase types

### Risks and Challenges

**Risk 1: RLS Policy Misconfiguration**
- Impact: Could expose subscriber data or block legitimate operations
- Probability: Medium
- Mitigation: Start with permissive policies, test thoroughly, then restrict
- Testing strategy: Use Supabase dashboard SQL editor to test policies with different roles

**Risk 2: Environment Variable Leakage**
- Impact: Critical security vulnerability if keys exposed
- Probability: Low (with proper .gitignore)
- Mitigation: Use .env.example template, never commit .env, verify .gitignore
- Validation: Check git status before commits, use secret scanning tools

**Risk 3: TypeScript Type Generation Failures**
- Impact: Loss of type safety for database operations
- Probability: Low
- Mitigation: Manual type definitions as fallback, use Supabase CLI
- Alternative: Define types manually in `src/lib/types/database.ts`

**Risk 4: Database Migration Management**
- Impact: Schema changes difficult to track and deploy
- Probability: Medium (for future updates)
- Mitigation: Use Supabase migrations or document manual schema changes
- Future-proofing: Set up migration workflow early

### Success Indicators

**Immediate Verification:**
- Can connect to Supabase from SvelteKit app
- Can perform CRUD operations on subscribers table
- RLS policies enforce expected access patterns
- TypeScript autocomplete works for database queries
- No TypeScript compilation errors related to Supabase

**Integration Verification:**
- Webhook endpoint can write to database using service role
- Environment variables load correctly in development and production
- Database connection is stable and performant
- Error handling for database failures is in place

---

## Acceptance Criteria

- [ ] Supabase project created (or existing project identified)
- [ ] Database table `subscribers` created with fields: id, email, is_active, created_at, updated_at
- [ ] Row-level security policies configured appropriately
- [ ] Supabase client initialized in SvelteKit project
- [ ] Environment variables configured (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Database connection tested and verified

**Extended Criteria:**
- [ ] Email field has unique constraint and index
- [ ] `created_at` and `updated_at` timestamps auto-populate
- [ ] Service role key environment variable configured (SUPABASE_SERVICE_ROLE_KEY)
- [ ] TypeScript types generated or manually defined for database schema
- [ ] RLS policies tested with both anon and service role keys
- [ ] Error handling implemented for database connection failures
- [ ] Database client exported from `src/lib/server/supabase.ts`

---

## Execution Plan

### Step 1: Create or Configure Supabase Project

**Actions:**
- Log in to Supabase dashboard (https://app.supabase.com/)
- Create new project or identify existing project to use
- Note project URL and API keys (anon key, service role key)
- Wait for project provisioning to complete (if new project)
- Verify project is accessible and database is ready

**Deliverables:**
- Supabase project URL
- Anon key (public, client-safe)
- Service role key (private, server-only)
- Project reference ID

**Verification:**
- Can access Supabase dashboard for the project
- Database is in "healthy" status
- API endpoint responds to requests

---

### Step 2: Design and Create Database Schema

**Actions:**
- Navigate to Supabase SQL Editor in dashboard
- Create `subscribers` table with SQL:
  ```sql
  CREATE TABLE subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );
  ```
- Create index on email field:
  ```sql
  CREATE INDEX idx_subscribers_email ON subscribers(email);
  ```
- Create updated_at trigger function:
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';
  ```
- Attach trigger to subscribers table:
  ```sql
  CREATE TRIGGER update_subscribers_updated_at
    BEFORE UPDATE ON subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  ```

**Deliverables:**
- `subscribers` table in Supabase database
- Email index for performance
- Auto-updating `updated_at` field
- SQL migration script saved (for documentation)

**Verification:**
- Run `SELECT * FROM subscribers;` in SQL editor (should return empty set)
- Insert test row and verify auto-populated fields
- Update test row and verify `updated_at` changes
- Delete test row to clean up

---

### Step 3: Configure Row-Level Security Policies

**Actions:**
- Enable RLS on subscribers table:
  ```sql
  ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
  ```
- Create policy for service role (full access):
  ```sql
  CREATE POLICY "Service role has full access"
    ON subscribers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  ```
- Create policy for anon role (read-only):
  ```sql
  CREATE POLICY "Anon can read subscribers"
    ON subscribers
    FOR SELECT
    TO anon
    USING (true);
  ```
- Test policies using different API keys

**Deliverables:**
- RLS enabled on subscribers table
- Service role policy for webhook operations
- Anon role policy for frontend verification
- Policy test results documented

**Verification:**
- Attempt SELECT with anon key (should succeed)
- Attempt INSERT with anon key (should fail)
- Attempt INSERT with service role key (should succeed)
- Verify policy enforcement in Supabase dashboard

---

### Step 4: Install Supabase Client Dependencies

**Actions:**
- Navigate to SvelteKit project root
- Install Supabase JavaScript client:
  ```bash
  npm install @supabase/supabase-js
  ```
- Verify installation in package.json
- Lock dependency version with package-lock.json or pnpm-lock.yaml

**Deliverables:**
- `@supabase/supabase-js` package installed
- Dependency version locked
- No installation errors or warnings

**Verification:**
- Check `node_modules/@supabase/supabase-js` exists
- Verify package.json includes dependency
- Run `npm list @supabase/supabase-js` to confirm version

---

### Step 5: Configure Environment Variables

**Actions:**
- Create or update `.env` file in project root:
  ```env
  PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```
- Update `.env.example` template:
  ```env
  PUBLIC_SUPABASE_URL=
  PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- Verify `.env` is in `.gitignore`
- Document each variable's purpose

**Deliverables:**
- `.env` file with actual credentials (gitignored)
- `.env.example` file with template (committed)
- Documentation of environment variable purposes
- Confirmation `.env` is not tracked by git

**Verification:**
- Run `git status` to ensure `.env` is ignored
- Check `.gitignore` contains `.env` entry
- Verify environment variables load in SvelteKit (test with console.log in dev)

---

### Step 6: Initialize Supabase Client in SvelteKit

**Actions:**
- Create server-side Supabase client file:
  - Path: `src/lib/server/supabase.ts`
  - Initialize client with service role key
  - Export client instance for server-side operations
- Create client-side Supabase client file (optional):
  - Path: `src/lib/supabase.ts`
  - Initialize client with anon key
  - Export client instance for client-side operations
- Implement client initialization code:
  ```typescript
  import { createClient } from '@supabase/supabase-js';
  import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

  export const supabaseServer = createClient(
    PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
  ```

**Deliverables:**
- `src/lib/server/supabase.ts` with server client
- Client instance properly typed with TypeScript
- Environment variables imported correctly
- Export ready for use in API routes

**Verification:**
- TypeScript compilation succeeds
- Can import `supabaseServer` in other files
- No runtime errors when importing
- Environment variables resolve correctly

---

### Step 7: Generate or Define TypeScript Types

**Actions:**
- Option A: Use Supabase CLI type generation:
  ```bash
  npx supabase gen types typescript --project-id your-project-ref > src/lib/types/database.ts
  ```
- Option B: Manually define types:
  ```typescript
  export interface Subscriber {
    id: string;
    email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface Database {
    public: {
      Tables: {
        subscribers: {
          Row: Subscriber;
          Insert: Omit<Subscriber, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Subscriber, 'id' | 'created_at'>>;
        };
      };
    };
  }
  ```
- Update Supabase client initialization to use types:
  ```typescript
  export const supabaseServer = createClient<Database>(
    PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
  ```

**Deliverables:**
- TypeScript types for database schema
- Typed Supabase client instances
- Type definitions in `src/lib/types/database.ts`

**Verification:**
- TypeScript autocomplete works for database queries
- No type errors when querying subscribers table
- Type safety enforced for insert/update operations

---

### Step 8: Test Database Connection and Operations

**Actions:**
- Create test file or temporary route to verify connection
- Test operations:
  - SELECT: Query all subscribers
  - INSERT: Add test subscriber
  - UPDATE: Modify subscriber status
  - DELETE: Remove test subscriber
- Example test code:
  ```typescript
  const { data, error } = await supabaseServer
    .from('subscribers')
    .select('*');
  console.log('Subscribers:', data, 'Error:', error);
  ```
- Verify RLS policies enforce correctly
- Test error handling for connection failures

**Deliverables:**
- Successful database queries from SvelteKit
- Confirmation all CRUD operations work
- RLS policy enforcement verified
- Test data cleaned up

**Verification:**
- Can read subscribers from database
- Can insert new subscriber with service role
- Cannot insert with anon key (RLS working)
- Error handling catches database failures gracefully

---

### Step 9: Implement Error Handling and Utility Functions

**Actions:**
- Create database utility functions in `src/lib/server/subscribers.ts`:
  - `getSubscriberByEmail(email: string)`
  - `addSubscriber(email: string)`
  - `removeSubscriber(email: string)`
  - `updateSubscriberStatus(email: string, isActive: boolean)`
- Implement error handling for each function
- Add logging for debugging
- Export functions for use in webhook endpoint

**Deliverables:**
- Reusable subscriber management functions
- Proper error handling and TypeScript typing
- Logging for debugging
- Functions ready for webhook integration

**Verification:**
- Each utility function works correctly
- Error cases handled gracefully
- TypeScript types are correct
- Functions are importable in other modules

---

### Step 10: Documentation and Cleanup

**Actions:**
- Document Supabase setup in README or separate docs
- Add comments to Supabase client initialization code
- Document environment variable requirements
- Save SQL migration scripts for future reference
- Clean up any test data from database
- Verify .env.example is up to date

**Deliverables:**
- Complete setup documentation
- SQL scripts saved in project
- Clean database ready for production use
- Updated environment variable documentation

**Verification:**
- Another developer can set up Supabase from documentation
- All test data removed
- .env.example matches actual .env structure
- SQL scripts are executable and reproducible

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| RLS policies misconfigured, exposing subscriber data | Medium | Critical | Start with restrictive policies, test with different roles, review Supabase RLS documentation, validate with Supabase policy checker |
| Service role key leaked in git history | Low | Critical | Verify .gitignore before any commits, use git-secrets or similar tools, never hardcode keys, use environment variables exclusively |
| Database connection failures in production | Low | High | Implement retry logic, add error logging, monitor connection health, use Supabase's built-in connection pooling |
| TypeScript type generation fails or is outdated | Medium | Medium | Use manual type definitions as fallback, document type update process, validate types against schema regularly |
| Email uniqueness constraint causes webhook failures | Medium | Medium | Implement UPSERT logic in webhook handler, handle duplicate email errors gracefully, normalize emails before insert |
| Performance issues with subscriber lookups | Low | Medium | Create index on email field (already planned), monitor query performance, optimize queries if needed |
| Environment variables not loading correctly | Low | High | Test environment variable loading early, use SvelteKit's env validation, log warnings for missing variables |
| Supabase project provisioning delays | Low | Low | Plan for setup time, use existing project if available, have backup Supabase account |
| Migration tracking issues for future changes | Medium | Low | Document all schema changes, use Supabase migrations or maintain SQL scripts, version control migration files |
| Timezone handling for timestamps | Low | Low | Use TIMESTAMPTZ for all timestamps, standardize on UTC, handle timezone conversion in application if needed |

---

## Dependencies

### Prerequisites
- Task 1 (Project Initialization and Setup) must be completed
- SvelteKit project scaffolded and development server running
- Node.js and npm/pnpm available
- Git repository initialized with .gitignore

### External Dependencies
- Supabase account with project creation permissions
- Internet connectivity for Supabase API access
- Browser access to Supabase dashboard

### Technical Dependencies
- `@supabase/supabase-js` v2.x package
- SvelteKit environment variable support
- TypeScript compiler
- PostgreSQL knowledge (for SQL schema creation)

### Knowledge Dependencies
- Understanding of Row-Level Security concepts
- Familiarity with Supabase dashboard
- SQL syntax for table and index creation
- Environment variable best practices
- TypeScript type definitions

### Blocks/Enables
**Blocks:**
- Task 5 (Patreon Webhook Endpoint Implementation) - webhook needs database client
- Task 6 (Subscriber Access Control Logic) - requires database queries
- Task 9 (Testing and Verification) - needs database to test against

**Blocked By:**
- Task 1 (Project Initialization) - need SvelteKit project structure

**Enables:**
- All subsequent tasks requiring database access
- Webhook endpoint can store subscriber data
- Access control logic can query subscriber status
- Future protected content features

---

## Definition of Done

**Functional Requirements:**
- [ ] Can successfully query subscribers table from SvelteKit application
- [ ] Environment variables properly loaded in both development and production contexts
- [ ] TypeScript types generated or defined for database schema with full autocomplete
- [ ] RLS policies prevent unauthorized access while allowing legitimate operations

**Technical Requirements:**
- [ ] Supabase client initialized in `src/lib/server/supabase.ts`
- [ ] Database connection stable and performant
- [ ] Error handling implemented for all database operations
- [ ] TypeScript compilation succeeds with zero errors

**Quality Requirements:**
- [ ] Code follows project conventions and style guide
- [ ] All database operations are type-safe
- [ ] Security best practices followed (no hardcoded keys, proper RLS)
- [ ] Performance is acceptable (queries < 100ms for subscriber lookups)

**Documentation Requirements:**
- [ ] Setup process documented for future reference
- [ ] Environment variables documented in .env.example
- [ ] SQL migration scripts saved and version controlled
- [ ] Code comments explain Supabase client configuration

**Testing Requirements:**
- [ ] Manual testing of all CRUD operations completed
- [ ] RLS policies tested with both anon and service role keys
- [ ] Error scenarios tested (connection failure, invalid queries)
- [ ] Test data cleaned up from database

**Deliverables:**
- [ ] Supabase project configured and accessible
- [ ] Database schema implemented with indexes and triggers
- [ ] RLS policies configured and tested
- [ ] Supabase client integrated into SvelteKit
- [ ] Environment variables configured
- [ ] TypeScript types available
- [ ] Utility functions for subscriber management
- [ ] Documentation complete

---

## Notes

**Implementation Order Recommendations:**
1. Set up Supabase project first (Steps 1-3) - can be done in Supabase dashboard
2. Install dependencies and configure environment (Steps 4-5) - prepares local environment
3. Initialize client and types (Steps 6-7) - establishes integration
4. Test and verify (Step 8) - ensures everything works
5. Build utilities and document (Steps 9-10) - creates reusable abstractions

**Key Decision Points:**
- Should we use Supabase CLI for migrations? (Recommended for future-proofing)
- Do we need client-side Supabase client? (Not for MVP, only webhook uses database)
- Should we implement soft deletion? (No for MVP, can add later)
- What email normalization strategy? (Lowercase and trim on insert/update)

**Future Enhancements:**
- Set up Supabase local development environment
- Implement database migrations workflow
- Add database backup automation
- Create admin panel for manual subscriber management
- Add subscription history tracking
- Implement database monitoring and alerting

**References:**
- Supabase Docs: https://supabase.com/docs
- Row-Level Security Guide: https://supabase.com/docs/guides/auth/row-level-security
- Supabase JavaScript Client: https://supabase.com/docs/reference/javascript
- SvelteKit Environment Variables: https://kit.svelte.dev/docs/modules#$env-static-private
