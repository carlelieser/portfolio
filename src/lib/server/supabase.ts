/**
 * Supabase Server Client
 *
 * This module initializes and exports the Supabase client for server-side operations.
 * Uses the service role key for privileged database access (e.g., webhook operations).
 *
 * IMPORTANT: This client bypasses Row-Level Security (RLS) policies.
 * Only use in trusted server-side code (API routes, server hooks, etc.).
 *
 * @module lib/server/supabase
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { Database } from '$lib/types/database';

/**
 * Supabase client instance with service role privileges
 *
 * Features:
 * - Full database access (bypasses RLS)
 * - Type-safe queries with TypeScript
 * - Used for webhook endpoints and admin operations
 *
 * @example
 * ```typescript
 * import { supabaseServer } from '$lib/server/supabase';
 *
 * const { data, error } = await supabaseServer
 *   .from('subscribers')
 *   .select('*')
 *   .eq('email', 'user@example.com');
 * ```
 */
export const supabaseServer = createClient<Database>(
	PUBLIC_SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}
);
