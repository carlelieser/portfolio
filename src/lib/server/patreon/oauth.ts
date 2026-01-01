/**
 * Patreon OAuth Client
 *
 * Handles OAuth 2.0 authentication flow with Patreon API v2.
 * Provides methods for authorization URL generation, token exchange,
 * and fetching user identity with membership information.
 *
 * @module lib/server/patreon/oauth
 */

import { env } from '$lib/server/env';
import type {
	PatreonTokenResponse,
	PatreonIdentityResponse,
	PatreonUserInfo,
	PatreonMembershipData
} from '$lib/types/patreon';

const PATREON_API_BASE = 'https://www.patreon.com';
const PATREON_API_V2 = 'https://www.patreon.com/api/oauth2/v2';

/**
 * OAuth scopes needed for the integration
 * - identity: Basic user info
 * - identity[email]: User's email address
 * - identity.memberships: User's membership/patron status
 */
const OAUTH_SCOPES = ['identity', 'identity[email]', 'identity.memberships'].join(' ');

/**
 * Generates the Patreon OAuth authorization URL
 *
 * @param redirectUri - The callback URL after authorization
 * @param state - CSRF protection state token
 * @returns The full authorization URL to redirect users to
 */
export function getAuthorizationUrl(redirectUri: string, state: string): string {
	const params = new URLSearchParams({
		response_type: 'code',
		client_id: env.PATREON_CLIENT_ID,
		redirect_uri: redirectUri,
		scope: OAUTH_SCOPES,
		state
	});

	return `${PATREON_API_BASE}/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access and refresh tokens
 *
 * @param code - The authorization code from the callback
 * @param redirectUri - The same redirect URI used in authorization
 * @returns Token response containing access_token, refresh_token, etc.
 * @throws Error if the token exchange fails
 */
export async function exchangeCodeForTokens(
	code: string,
	redirectUri: string
): Promise<PatreonTokenResponse> {
	const response = await fetch(`${PATREON_API_BASE}/api/oauth2/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			code,
			grant_type: 'authorization_code',
			client_id: env.PATREON_CLIENT_ID,
			client_secret: env.PATREON_CLIENT_SECRET,
			redirect_uri: redirectUri
		})
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('Patreon token exchange failed:', error);
		throw new Error(`Failed to exchange code for tokens: ${response.status}`);
	}

	return response.json();
}

/**
 * Refreshes an expired access token using a refresh token
 *
 * @param refreshToken - The refresh token to use
 * @returns New token response with fresh access_token
 * @throws Error if the refresh fails
 */
export async function refreshAccessToken(refreshToken: string): Promise<PatreonTokenResponse> {
	const response = await fetch(`${PATREON_API_BASE}/api/oauth2/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: env.PATREON_CLIENT_ID,
			client_secret: env.PATREON_CLIENT_SECRET
		})
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('Patreon token refresh failed:', error);
		throw new Error(`Failed to refresh access token: ${response.status}`);
	}

	return response.json();
}

/**
 * Fetches the current user's identity and membership information
 *
 * @param accessToken - Valid Patreon access token
 * @returns Identity response with user data and included memberships
 * @throws Error if the API call fails
 */
export async function fetchUserIdentity(accessToken: string): Promise<PatreonIdentityResponse> {
	// Request identity with memberships and campaign info included
	const fields = new URLSearchParams({
		'fields[user]': 'email,first_name,last_name,full_name,image_url,thumb_url,url,is_email_verified,created',
		'fields[member]': 'patron_status,is_follower,pledge_cadence,currently_entitled_amount_cents,lifetime_support_cents,campaign_lifetime_support_cents,last_charge_status,last_charge_date,next_charge_date,will_pay_amount_cents',
		include: 'memberships'
	});

	const response = await fetch(`${PATREON_API_V2}/identity?${fields.toString()}`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('Patreon identity fetch failed:', error);
		throw new Error(`Failed to fetch user identity: ${response.status}`);
	}

	return response.json();
}

/**
 * Processes the raw identity response into a simplified user info object
 *
 * @param identity - Raw identity response from Patreon API
 * @returns Processed user info with patron status
 */
export function processUserIdentity(identity: PatreonIdentityResponse): PatreonUserInfo {
	const user = identity.data;
	const memberships = (identity.included?.filter(
		(item): item is PatreonMembershipData => item.type === 'member'
	)) ?? [];

	// Find the first active membership (if any)
	const activeMembership = memberships.find(
		(m) => m.attributes.patron_status === 'active_patron'
	);

	// Get membership info (prefer active, fall back to first)
	const membership = activeMembership ?? memberships[0];

	return {
		id: user.id,
		email: user.attributes.email,
		fullName: user.attributes.full_name,
		firstName: user.attributes.first_name,
		lastName: user.attributes.last_name,
		imageUrl: user.attributes.image_url,
		isEmailVerified: user.attributes.is_email_verified,
		isPatron: membership?.attributes.patron_status === 'active_patron',
		patronStatus: membership?.attributes.patron_status ?? null,
		currentTierAmountCents: membership?.attributes.currently_entitled_amount_cents ?? 0,
		lifetimeSupportCents: membership?.attributes.lifetime_support_cents ?? 0
	};
}

/**
 * Complete OAuth flow helper: exchanges code and fetches user info
 *
 * @param code - Authorization code from callback
 * @param redirectUri - The callback redirect URI
 * @returns User info and tokens
 */
export async function completeOAuthFlow(
	code: string,
	redirectUri: string
): Promise<{ user: PatreonUserInfo; tokens: PatreonTokenResponse }> {
	const tokens = await exchangeCodeForTokens(code, redirectUri);
	const identity = await fetchUserIdentity(tokens.access_token);
	const user = processUserIdentity(identity);

	return { user, tokens };
}
