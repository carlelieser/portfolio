/**
 * Patreon Logout Endpoint
 *
 * POST /api/patreon/logout
 *
 * Clears the Patreon session cookie and redirects to the homepage.
 *
 * @module routes/api/patreon/logout
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear the session cookie
	cookies.delete('patreon_session', { path: '/' });

	throw redirect(302, '/');
};

// Also support GET for simple link-based logout
export const GET: RequestHandler = async ({ cookies }) => {
	cookies.delete('patreon_session', { path: '/' });
	throw redirect(302, '/');
};
