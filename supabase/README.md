# Supabase Setup Guide

This guide walks through setting up the Supabase backend for the Carlos Santos personal brand website.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Supabase Project](#create-supabase-project)
3. [Run Database Migration](#run-database-migration)
4. [Configure Environment Variables](#configure-environment-variables)
5. [Verify Setup](#verify-setup)
6. [Database Schema](#database-schema)
7. [Security & RLS Policies](#security--rls-policies)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Supabase account (free tier is sufficient)
- Access to Supabase dashboard: https://app.supabase.com
- Node.js 20+ installed locally
- Project dependencies installed (`npm install`)

## Create Supabase Project

1. **Log in to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Sign in with your account

2. **Create New Project**
   - Click "New Project" button
   - Fill in project details:
     - **Name**: `carlos-santos-site` (or your preferred name)
     - **Database Password**: Choose a strong password (save this securely!)
     - **Region**: Select closest to your users (e.g., `us-east-1`)
   - Click "Create new project"

3. **Wait for Provisioning**
   - Project setup takes 1-2 minutes
   - Database status should show as "Healthy" when ready

## Run Database Migration

Once your Supabase project is ready, run the database migration to create the subscribers table.

### Option 1: Supabase Dashboard (Recommended for First Setup)

1. Navigate to your project in Supabase dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of `supabase/migrations/001_create_subscribers_table.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Cmd/Ctrl + Enter`
7. Verify success message appears

### Option 2: Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Link your local project to Supabase
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Verify Migration Success

Run this query in the SQL Editor to verify the table was created:

```sql
SELECT * FROM subscribers;
```

You should see an empty result set (no rows), confirming the table exists.

## Configure Environment Variables

1. **Get Your Supabase Credentials**
   - In Supabase dashboard, navigate to: **Project Settings > API**
   - You'll need three values:
     - Project URL
     - `anon` public key
     - `service_role` secret key (⚠️ Keep this private!)

2. **Update Local Environment File**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and replace placeholder values:
     ```env
     PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
     PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
     ```

3. **Verify .gitignore**
   - Ensure `.env` is in `.gitignore` (it should be by default)
   - Run `git status` to confirm `.env` is not tracked

⚠️ **IMPORTANT**: Never commit your `.env` file or expose the service role key!

## Verify Setup

### Test Database Connection

Create a temporary test file to verify the connection:

```typescript
// test-db.ts
import { supabaseServer } from './src/lib/server/supabase';

async function testConnection() {
	const { data, error } = await supabaseServer.from('subscribers').select('count');

	if (error) {
		console.error('Connection failed:', error);
	} else {
		console.log('Connection successful!', data);
	}
}

testConnection();
```

Run with:

```bash
npx tsx test-db.ts
```

### Test Utility Functions

```typescript
// test-subscribers.ts
import { upsertSubscriber, getSubscriberByEmail } from './src/lib/server/subscribers';

async function test() {
	// Add a test subscriber
	await upsertSubscriber('test@example.com', true);
	console.log('✅ Created test subscriber');

	// Retrieve the subscriber
	const subscriber = await getSubscriberByEmail('test@example.com');
	console.log('✅ Retrieved subscriber:', subscriber);

	// Deactivate the subscriber
	await upsertSubscriber('test@example.com', false);
	console.log('✅ Updated subscriber status');
}

test();
```

## Database Schema

### Subscribers Table

| Column       | Type        | Description                | Constraints                      |
| ------------ | ----------- | -------------------------- | -------------------------------- |
| `id`         | UUID        | Unique identifier          | PRIMARY KEY, auto-generated      |
| `email`      | TEXT        | Subscriber email address   | NOT NULL, UNIQUE, indexed        |
| `is_active`  | BOOLEAN     | Subscription active status | NOT NULL, default: true          |
| `created_at` | TIMESTAMPTZ | Record creation timestamp  | NOT NULL, default: NOW()         |
| `updated_at` | TIMESTAMPTZ | Last update timestamp      | NOT NULL, auto-updated on change |

### Indexes

- **Primary Key**: `id` (automatic)
- **Email Index**: `idx_subscribers_email` on `email` column for fast lookups

### Triggers

- **Auto-update timestamp**: `update_subscribers_updated_at` trigger automatically updates `updated_at` on row modifications

## Security & RLS Policies

Row-Level Security (RLS) is **ENABLED** on the subscribers table with the following policies:

### Service Role Policy

- **Name**: "Service role has full access"
- **Scope**: All operations (SELECT, INSERT, UPDATE, DELETE)
- **Access**: `service_role` key only
- **Purpose**: Allows webhook endpoints and admin operations

### Anon Role Policy

- **Status**: Not configured (intentional for MVP)
- **Reason**: All subscriber verification happens server-side
- **Future**: Can be added if client-side read access is needed

### Best Practices

1. **Never expose service role key** to client-side code
2. **Use service role key only** in server-side code:
   - API routes (`src/routes/api/*`)
   - Server hooks (`src/hooks.server.ts`)
   - Server-side utilities (`src/lib/server/*`)
3. **Test RLS policies** to ensure unauthorized access is blocked

## Troubleshooting

### Connection Errors

**Problem**: `fetch failed` or `Network request failed`

- **Solution**: Check if `PUBLIC_SUPABASE_URL` is correct
- **Solution**: Verify internet connection
- **Solution**: Check if Supabase project is healthy in dashboard

**Problem**: `Invalid API key`

- **Solution**: Verify you're using the correct key for the environment
- **Solution**: Check for extra spaces or quotes in `.env` file
- **Solution**: Regenerate keys in Supabase dashboard if compromised

### TypeScript Errors

**Problem**: `Module not found: '$env/static/private'`

- **Solution**: Ensure you're importing from `$env/static/private` in server-side code only
- **Solution**: Run `npm run dev` to start the SvelteKit dev server

**Problem**: Type errors on database queries

- **Solution**: Verify `src/lib/types/database.ts` matches your database schema
- **Solution**: Run `npm run check` to validate TypeScript configuration

### RLS Policy Issues

**Problem**: `Row level security policy violation`

- **Solution**: Ensure you're using `supabaseServer` (service role) for admin operations
- **Solution**: Check if RLS policies are configured correctly in Supabase dashboard
- **Solution**: Verify the policy allows the operation you're attempting

### Migration Errors

**Problem**: `relation "subscribers" already exists`

- **Solution**: Table already exists; no action needed
- **Solution**: If you need to recreate, drop the table first (⚠️ deletes all data):
  ```sql
  DROP TABLE IF EXISTS subscribers CASCADE;
  ```

**Problem**: `permission denied for schema public`

- **Solution**: Ensure you're logged in as project owner in Supabase dashboard
- **Solution**: Check database permissions in project settings

## Next Steps

After completing Supabase setup:

1. ✅ Database schema is ready
2. ✅ Environment variables configured
3. ✅ Type-safe client initialized
4. ✅ Utility functions available

You can now proceed to:

- **Task 3**: Install shadcn-svelte UI components
- **Task 4**: Build landing page
- **Task 5**: Implement Patreon webhook endpoint

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client Reference](https://supabase.com/docs/reference/javascript/introduction)
- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-static-private)

## Support

If you encounter issues not covered in this guide:

1. Check the [Supabase Discord](https://discord.supabase.com)
2. Review [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Consult the project README.md for general setup guidance
