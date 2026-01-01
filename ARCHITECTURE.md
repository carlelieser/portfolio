# Architecture

This document explains the system design, technology choices, and architectural decisions behind the Carlos Santos personal brand website.

## Table of Contents

1. [System Overview](#system-overview)
2. [Design Decisions](#design-decisions)
3. [Project Structure](#project-structure)
4. [Database Architecture](#database-architecture)
5. [Data Flow](#data-flow)
6. [Type System](#type-system)
7. [Component Organization](#component-organization)
8. [Design Principles](#design-principles)
9. [Scalability Considerations](#scalability-considerations)
10. [Extension Points](#extension-points)

## System Overview

The Carlos Santos website is a modern personal brand site built as a **monolithic SvelteKit application** with a focus on simplicity, type safety, and maintainability. The application serves a public landing page and manages Patreon subscriber access through webhook integration.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  SvelteKit Application               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────┐       ┌────────────────────┐   │
│  │  Public Routes │       │   API Routes       │   │
│  │  (Landing Page)│       │  /api/patreon/     │   │
│  │                │       │      webhook       │   │
│  └────────────────┘       └────────────────────┘   │
│         │                          │                │
│         │                          │                │
│         ▼                          ▼                │
│  ┌──────────────────────────────────────────────┐  │
│  │         Server-Side Utilities                │  │
│  │  • Supabase Client (Service Role)            │  │
│  │  • Subscriber Management                     │  │
│  │  • Webhook Verification                      │  │
│  └──────────────────────────────────────────────┘  │
│                          │                          │
└──────────────────────────┼──────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │    Supabase    │
                  │   PostgreSQL   │
                  │   + Auth +RLS  │
                  └────────────────┘
                           ▲
                           │
                  ┌────────────────┐
                  │    Patreon     │
                  │    Webhooks    │
                  └────────────────┘
```

### Tech Stack Rationale

- **SvelteKit 2**: Server-side rendering, API routes, file-based routing
- **Svelte 5**: Reactive UI framework with modern runes API
- **TypeScript**: Type safety throughout the stack
- **Supabase**: PostgreSQL database with Row-Level Security (RLS)
- **shadcn-svelte**: Pre-built, customizable UI components
- **Tailwind CSS v4**: Utility-first styling with modern configuration

## Design Decisions

### Why Monolithic SvelteKit?

**Chosen Approach:** Single SvelteKit application containing both frontend and API routes.

**Rationale:**

- **Unified codebase**: Frontend and backend share types, utilities, and configuration
- **Type safety**: TypeScript flows seamlessly from API routes to UI components
- **Simpler deployment**: Single deployment artifact, no CORS configuration needed
- **Natural API routes**: SvelteKit's file-based routing makes webhook endpoints trivial
- **Developer experience**: Hot module replacement works across entire stack
- **Cost effective**: Single service to host and monitor

**When to consider alternatives:**

- Traffic exceeds 10,000+ concurrent users (unlikely for personal brand site)
- Need to scale webhook processing independently from frontend
- Multiple teams working on different parts of the system

**Alternatives considered:**

1. **Separate API service**: Rejected as overkill for current requirements
2. **Static site + serverless functions**: Rejected because it limits SvelteKit's SSR capabilities

### Why Supabase?

**Rationale:**

- **PostgreSQL with superpowers**: Mature database with built-in auth and real-time capabilities
- **Row-Level Security**: Database-level access control, not just application-level
- **Auto-generated types**: TypeScript types generated from database schema
- **Easy scaling**: Managed service handles backups, scaling, monitoring
- **Developer experience**: Excellent dashboard and CLI tools

**Trade-offs accepted:**

- Vendor lock-in (mitigated by using standard PostgreSQL)
- Relies on Supabase infrastructure availability

### Why shadcn-svelte?

**Rationale:**

- **Customizable components**: Copy components into codebase, full control
- **Svelte 5 compatibility**: Built specifically for modern Svelte
- **Tailwind CSS integration**: Consistent styling approach
- **No runtime overhead**: Components compile to minimal JavaScript
- **Professional design**: Consistent, accessible UI out of the box

**Trade-offs:**

- More verbose than component libraries (but more flexible)
- Need to manually update components (not npm-managed)

## Project Structure

### Directory Organization

```
carlos-santos-site/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── ui/              # shadcn-svelte components
│   │   │       ├── button/
│   │   │       ├── card/
│   │   │       └── separator/
│   │   ├── server/              # Server-only code
│   │   │   ├── env.ts          # Environment validation
│   │   │   ├── supabase.ts     # Supabase service client
│   │   │   ├── subscribers.ts  # Subscriber CRUD operations
│   │   │   └── patreon/
│   │   │       └── verify-webhook.ts
│   │   ├── types/               # TypeScript type definitions
│   │   │   ├── database.ts     # Supabase DB types
│   │   │   └── patreon.ts      # Patreon webhook types
│   │   └── utils.ts             # Utility functions (cn helper)
│   ├── routes/
│   │   ├── +page.svelte         # Landing page
│   │   └── api/
│   │       └── patreon/
│   │           └── webhook/
│   │               └── +server.ts  # Webhook endpoint
│   ├── app.css                  # Global styles + Tailwind
│   └── app.d.ts                 # Global TypeScript definitions
├── static/                      # Static assets (images, fonts)
├── supabase/
│   ├── migrations/              # Database migrations
│   │   └── 001_create_subscribers_table.sql
│   └── README.md                # Supabase setup guide
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies and scripts
├── svelte.config.js             # SvelteKit configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

### Key Files Explained

**Server-Side Core:**

- `src/lib/server/env.ts`: Environment variable validation (fail-fast on missing vars)
- `src/lib/server/supabase.ts`: Supabase client with service role (bypasses RLS)
- `src/lib/server/subscribers.ts`: High-level subscriber operations (upsert, get, check status)
- `src/lib/server/patreon/verify-webhook.ts`: HMAC-MD5 signature verification

**API Routes:**

- `src/routes/api/patreon/webhook/+server.ts`: Webhook endpoint handling Patreon events

**Types:**

- `src/lib/types/database.ts`: Database schema types (subscribers table)
- `src/lib/types/patreon.ts`: Patreon webhook event types

### Separation of Concerns

**Public vs. Private Code:**

- All code in `src/lib/server/` is server-only (never bundled to client)
- Environment variables prefixed with `PUBLIC_` are bundled into client code
- Private env vars (`SUPABASE_SERVICE_ROLE_KEY`, `PATREON_WEBHOOK_SECRET`) are server-only

**File-Based Routing:**

- `+page.svelte`: Page components (can be server-rendered)
- `+server.ts`: API endpoints (server-only)
- `+layout.svelte`: Shared layouts (future use)

## Database Architecture

### Schema Design

**Subscribers Table:**

```sql
CREATE TABLE subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Design Rationale:**

- `email`: Unique identifier from Patreon (normalized: lowercase, trimmed)
- `is_active`: Boolean flag for subscription status (simpler than tracking tiers)
- `id`: UUID for internal references (not exposed to API)
- `created_at` / `updated_at`: Audit trail for subscriber lifecycle

**Indexes:**

- Primary key on `id` (automatic)
- Unique constraint on `email` (enforces one record per email)
- Index on `email` for fast lookups (`idx_subscribers_email`)

**Triggers:**

- `update_subscribers_updated_at`: Auto-updates `updated_at` on row modifications

### Row-Level Security (RLS)

**RLS is ENABLED** on the subscribers table.

**Policies:**

1. **Service Role Policy**:

   ```sql
   CREATE POLICY "Service role has full access"
   ON subscribers FOR ALL
   TO service_role
   USING (true)
   WITH CHECK (true);
   ```

   - Allows server-side operations (webhook, admin functions)
   - Uses `service_role` key which bypasses RLS by default

2. **Anon Role**: No policies (intentional for MVP)
   - All subscriber checks happen server-side
   - Future: Could add read-only policy for client-side access checks

**Security Model:**

- Server-side code uses service role key (full access)
- No client-side database queries (no anon key usage for subscribers table)
- Webhook endpoint verifies Patreon signature before database operations

## Data Flow

### Patreon Webhook → Database

```
1. Patreon sends HTTP POST to /api/patreon/webhook
   Headers:
   - X-Patreon-Event: "members:pledge:create" or "members:pledge:delete"
   - X-Patreon-Signature: HMAC-MD5 signature

2. Webhook endpoint extracts raw request body

3. Verify HMAC-MD5 signature using PATREON_WEBHOOK_SECRET
   ↓ (if invalid) → Return 401 Unauthorized

4. Parse JSON payload and extract email

5. Determine action based on event type:
   - pledge:create → is_active = true
   - pledge:delete → is_active = false

6. Call upsertSubscriber(email, isActive)
   - Normalizes email (lowercase, trim)
   - UPSERT into subscribers table (idempotent)
   - Returns subscriber record

7. Return 200 OK with success message to Patreon
   ↓ (if database fails) → Return 500 to trigger Patreon retry
```

**Idempotency:**

- UPSERT operation ensures duplicate webhook events are safe
- Patreon may retry failed webhooks (500 errors)
- Same event processed multiple times produces same result

### Future: Subscriber Access Control

**Protected Route Flow (not yet implemented):**

```
1. User attempts to access protected route (e.g., /members)

2. Server-side hook extracts user email (from session/auth)

3. Call isActiveSubscriber(email)
   - Queries subscribers table
   - Returns true if record exists with is_active = true

4. If true: Render protected content
   If false: Redirect to Patreon signup page

5. Cache result in session to avoid repeated DB queries
```

**Why email-based, not separate auth:**

- Patreon is the source of truth for subscriber status
- Email from Patreon payload matches user's actual email
- Avoids maintaining separate user accounts
- Future: Can integrate Supabase Auth if needed for additional features

## Type System

### TypeScript Configuration

**Strict Mode Enabled:**

```json
{
	"compilerOptions": {
		"strict": true,
		"noImplicitAny": true,
		"strictNullChecks": true
	}
}
```

**Why strict mode:**

- Catches errors at compile time
- Self-documenting code (types as documentation)
- Refactoring confidence
- Better IDE autocomplete

### Type Definitions

**Database Types** (`src/lib/types/database.ts`):

```typescript
export interface Subscriber {
	id: string;
	email: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}
```

**Patreon Types** (`src/lib/types/patreon.ts`):

```typescript
export type PatreonEventType = 'members:pledge:create' | 'members:pledge:delete';

export interface PatreonWebhookEvent {
	data: {
		id: string;
		type: string;
		attributes: {
			email: string;
			// ... other Patreon fields
		};
	};
}
```

### Type Safety Patterns

**Environment Validation:**

- Environment variables validated at application startup
- Throws clear errors if required vars are missing
- TypeScript knows env vars are defined after validation

**Error Types:**

- Custom `SubscriberError` class for database operations
- Includes error code and details for debugging
- Allows catch blocks to differentiate error sources

**Supabase Typing:**

- Type-safe database queries with Supabase client
- Database types define expected query results
- `@ts-expect-error` comments document known Supabase type inference issues

## Component Organization

### shadcn-svelte Integration

**Component Location:** `src/lib/components/ui/`

**Installed Components:**

- **Button**: Multiple variants (default, outline, ghost, destructive, link)
- **Card**: Composite component (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- **Separator**: Visual dividers

**Customization Approach:**

- Components copied into codebase (not npm package)
- Modify components directly for custom behavior
- Tailwind classes can be overridden via `class` prop
- Theme configured via CSS variables in `src/app.css`

**Adding New Components:**

```bash
npx shadcn-svelte@latest add [component-name]
```

### Svelte 5 Patterns

**Runes for Reactive State:**

```svelte
<script lang="ts">
	let count = $state(0); // Reactive variable
	let doubled = $derived(count * 2); // Computed value
</script>
```

**Why Svelte 5:**

- Modern reactivity API (runes replace stores)
- Better TypeScript support
- Improved performance
- Simpler mental model

**Server-Side Rendering:**

- All routes are server-rendered by default
- Improves SEO and initial load performance
- Can add client-side interactivity with `<script>` blocks

## Design Principles

### 1. Fail Fast with Clear Errors

- Environment validation on startup (not first request)
- Webhook signature verification before processing
- Database errors thrown as typed exceptions
- Comprehensive error logging

### 2. Type Safety Throughout

- TypeScript strict mode enabled
- No `any` types in production code
- Database types match schema
- API payloads typed and validated

### 3. Security by Default

- Row-Level Security on database tables
- Webhook signature verification (HMAC-MD5)
- Service role key never exposed to client
- Environment variables properly scoped (PUBLIC\_ prefix)

### 4. Idempotent Operations

- UPSERT for subscriber management (safe to replay)
- Webhook endpoint can handle duplicate events
- Email normalization ensures consistency

### 5. Comprehensive Documentation

- JSDoc comments on all public functions
- Inline code comments explain "why", not "what"
- README guides for setup and deployment
- Architecture documentation (this file)

### 6. Separation of Public/Private Code

- `src/lib/server/` for server-only code
- Environment variables scoped appropriately
- Clear boundary between client and server code

## Scalability Considerations

### Current Scale (MVP)

**Designed for:**

- Hundreds to low thousands of subscribers
- Moderate landing page traffic (< 1,000 concurrent users)
- Low webhook frequency (few events per hour)
- Single-region deployment

**Bottlenecks:**

- Database queries (mitigated by indexing on email)
- Webhook processing (lightweight, stateless)
- Server-side rendering (SvelteKit handles well)

### Future Scaling Options

**Database Scaling:**

- Supabase auto-scales connection pooling
- Read replicas available if needed
- PostgreSQL can handle millions of rows easily

**Application Scaling:**

- Vercel/Netlify provide automatic edge scaling
- SvelteKit generates optimized builds
- Static assets served via CDN

**Webhook Scaling:**

- Currently processes webhooks synchronously
- If needed: Queue webhooks for async processing (Redis + worker)
- If needed: Separate webhook handler as standalone service

**Caching Strategy (Future):**

- Cache subscriber status in session (avoid repeated DB queries)
- Redis/Memcached for distributed caching
- Supabase realtime subscriptions for cache invalidation

### When to Re-Architecture

Consider microservices or separate services if:

- Webhook traffic exceeds 100 requests/second
- Multiple developers working on different features
- Need independent scaling of components
- Adding complex features (CMS, analytics, etc.)

## Extension Points

### Adding Protected Content Routes

**Current pattern to follow:**

```typescript
// src/routes/members/+page.server.ts
import { isActiveSubscriber } from '$lib/server/subscribers';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const email = locals.session?.user?.email;

	if (!email || !(await isActiveSubscriber(email))) {
		throw redirect(303, '/patreon-signup');
	}

	return {
		// Protected content data
	};
};
```

**Key points:**

- Server-side load function checks access
- Uses `isActiveSubscriber()` utility
- Redirects non-subscribers to Patreon
- No client-side checks (security by server)

### Adding Admin Dashboard

**Recommended approach:**

1. Create `/admin` route with authentication
2. Use Supabase Auth for admin login
3. Use service role for admin operations:

   ```typescript
   import { supabaseServer } from '$lib/server/supabase';

   // List all subscribers
   const { data } = await supabaseServer
   	.from('subscribers')
   	.select('*')
   	.order('created_at', { ascending: false });
   ```

4. Add UI for manual subscriber management
5. Implement audit logging for admin actions

### Adding Email Notifications

**Recommended approach:**

1. Choose email service (SendGrid, Postmark, Resend)
2. Trigger emails from webhook handler:
   ```typescript
   // After upsertSubscriber()
   if (eventType === 'members:pledge:create') {
   	await sendWelcomeEmail(email);
   }
   ```
3. Create email templates (welcome, cancellation)
4. Handle email failures gracefully (log but don't block webhook)

### Adding Multiple Subscription Tiers

**Recommended approach:**

1. Update database schema:
   ```sql
   ALTER TABLE subscribers
   ADD COLUMN tier TEXT CHECK (tier IN ('basic', 'premium', 'ultimate'));
   ```
2. Extract tier from Patreon webhook payload
3. Update type definitions to include tier
4. Modify `isActiveSubscriber()` to check specific tiers

## References

- **Solution Planning**: `.stark/solutions/crimson-pulse-3x/solution.md`
- **Database Setup**: `supabase/README.md`
- **Security Guide**: `SECURITY.md`
- **Deployment Guide**: README.md (Deployment section)
- **SvelteKit Docs**: https://kit.svelte.dev/docs
- **Supabase Docs**: https://supabase.com/docs
- **Patreon API**: https://docs.patreon.com/

---

**Last Updated:** 2025-12-15

**Document Version:** 1.0

**Maintained By:** Carlos Santos
