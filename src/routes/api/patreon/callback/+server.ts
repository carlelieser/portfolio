/**
 * Patreon OAuth Callback Endpoint
 *
 * GET /api/patreon/callback
 *
 * Handles the OAuth callback from Patreon. Exchanges the authorization code
 * for tokens, fetches user identity, and creates/updates subscriber record.
 *
 * Query Parameters (from Patreon):
 * - code: Authorization code to exchange for tokens
 * - state: CSRF state token to verify
 *
 * @module routes/api/patreon/callback
 */

import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { completeOAuthFlow } from '$lib/server/patreon/oauth';
import { upsertSubscriber } from '$lib/server/subscribers';

interface StateData {
	token: string;
	redirect: string;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	// Get the authorization code and state from query params
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	// Check if user denied access
	if (errorParam) {
		console.log('Patreon OAuth denied:', errorParam);
		throw redirect(302, '/?error=access_denied');
	}

	// Validate required parameters
	if (!code || !state) {
		console.error('Missing code or state in callback');
		throw error(400, 'Missing required parameters');
	}

	// Verify CSRF state token
	const stateCookie = cookies.get('patreon_oauth_state');
	if (!stateCookie) {
		console.error('Missing state cookie');
		throw error(400, 'Invalid state - session expired');
	}

	let stateData: StateData;
	try {
		stateData = JSON.parse(stateCookie);
	} catch {
		console.error('Failed to parse state cookie');
		throw error(400, 'Invalid state format');
	}

	if (stateData.token !== state) {
		console.error('State mismatch - possible CSRF attack');
		throw error(400, 'State verification failed');
	}

	// Clear the state cookie
	cookies.delete('patreon_oauth_state', { path: '/' });

	// Build callback URL for token exchange
	const protocol = url.protocol;
	const host = url.host;
	const callbackUrl = `${protocol}//${host}/api/patreon/callback`;

	try {
		// Complete OAuth flow: exchange code and get user info
		const { user } = await completeOAuthFlow(code, callbackUrl);

		console.log('Patreon OAuth successful:', {
			email: user.email,
			isPatron: user.isPatron,
			patronStatus: user.patronStatus
		});

		// Create or update subscriber based on patron status
		await upsertSubscriber(user.email, user.isPatron);

		// Set a session cookie with user info (for client-side display)
		// Note: In production, you'd want proper session management
		const sessionData = JSON.stringify({
			email: user.email,
			fullName: user.fullName,
			imageUrl: user.imageUrl,
			isPatron: user.isPatron,
			patronStatus: user.patronStatus
		});

		cookies.set('patreon_session', sessionData, {
			path: '/',
			httpOnly: false, // Allow client-side access for UI
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		// Redirect to the original destination
		const redirectTo = stateData.redirect || '/';
		throw redirect(302, redirectTo);
	} catch (err) {
		// Re-throw redirects
		if (err instanceof Response || (err && typeof err === 'object' && 'status' in err)) {
			throw err;
		}

		console.error('OAuth callback error:', err);
		throw redirect(302, '/?error=auth_failed');
	}
};
