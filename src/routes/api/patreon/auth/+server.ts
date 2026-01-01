/**
 * Patreon OAuth Authorization Endpoint
 *
 * GET /api/patreon/auth
 *
 * Initiates the Patreon OAuth flow by redirecting users to Patreon's
 * authorization page. Generates a CSRF state token for security.
 *
 * Query Parameters:
 * - redirect: (optional) URL to redirect to after successful auth (defaults to /)
 *
 * @module routes/api/patreon/auth
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthorizationUrl } from '$lib/server/patreon/oauth';

/**
 * Generates a cryptographically secure random state token
 */
function generateState(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	// Get the final redirect destination after auth (optional)
	const finalRedirect = url.searchParams.get('redirect') || '/';

	// Generate CSRF state token
	const state = generateState();

	// Store state in a secure cookie for verification in callback
	// Include the final redirect destination encoded in the state
	const stateData = JSON.stringify({ token: state, redirect: finalRedirect });
	cookies.set('patreon_oauth_state', stateData, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 60 * 10 // 10 minutes
	});

	// Build the callback URL
	const protocol = url.protocol;
	const host = url.host;
	const callbackUrl = `${protocol}//${host}/api/patreon/callback`;

	// Get the Patreon authorization URL
	const authUrl = getAuthorizationUrl(callbackUrl, state);

	// Redirect to Patreon
	throw redirect(302, authUrl);
};
