/**
 * Patreon Webhook Type Definitions
 *
 * These types define the structure of webhook payloads sent by Patreon
 * when subscription events occur. Based on production webhook examples
 * and Patreon API documentation.
 *
 * @module lib/types/patreon
 */

/**
 * Patreon webhook event types that we support
 */
export type PatreonEventType = 'members:pledge:create' | 'members:pledge:delete';

/**
 * Member attributes from Patreon webhook payload
 * Contains subscriber information including email and patron status
 */
export interface PatreonMemberAttributes {
	/** Patron's email address - primary identifier for our subscriber system */
	email: string;

	/** Patron's full name */
	full_name?: string;

	/** Current patron status (e.g., "active_patron", "former_patron") */
	patron_status?: string;

	/** Status of the last charge attempt */
	last_charge_status?: string;

	/** Date of the last charge */
	last_charge_date?: string;

	/** Current tier amount in cents */
	currently_entitled_amount_cents?: number;
}

/**
 * Member data object from Patreon webhook payload
 */
export interface PatreonMemberData {
	/** Resource type, typically "member" */
	type: string;

	/** Unique member ID from Patreon */
	id: string;

	/** Member attributes containing email and subscription details */
	attributes: PatreonMemberAttributes;
}

/**
 * Complete Patreon webhook event payload
 * This is the top-level structure received in webhook POST requests
 */
export interface PatreonWebhookEvent {
	/** Member data containing subscription information */
	data: PatreonMemberData;

	/** Additional related resources (optional) */
	included?: Array<unknown>;

	/** Links to related resources (optional) */
	links?: Record<string, string>;
}

/**
 * Result of webhook signature verification
 */
export interface WebhookVerificationResult {
	/** Whether the signature is valid */
	isValid: boolean;

	/** Error message if verification failed */
	error?: string;
}

// ============================================
// OAuth Types
// ============================================

/**
 * OAuth token response from Patreon
 */
export interface PatreonTokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	scope: string;
	token_type: 'Bearer';
}

/**
 * User identity attributes from Patreon API v2
 */
export interface PatreonUserAttributes {
	email: string;
	first_name: string;
	last_name: string;
	full_name: string;
	image_url: string;
	thumb_url: string;
	url: string;
	is_email_verified: boolean;
	created: string;
}

/**
 * User identity data object from Patreon API v2
 */
export interface PatreonUserData {
	type: 'user';
	id: string;
	attributes: PatreonUserAttributes;
	relationships?: {
		memberships?: {
			data: Array<{ id: string; type: 'member' }>;
		};
	};
}

/**
 * Membership attributes from Patreon API v2
 */
export interface PatreonMembershipAttributes {
	patron_status: 'active_patron' | 'declined_patron' | 'former_patron' | null;
	is_follower: boolean;
	pledge_cadence: number;
	currently_entitled_amount_cents: number;
	lifetime_support_cents: number;
	campaign_lifetime_support_cents: number;
	last_charge_status: 'Paid' | 'Declined' | 'Deleted' | 'Pending' | 'Refunded' | 'Fraud' | null;
	last_charge_date: string | null;
	next_charge_date: string | null;
	will_pay_amount_cents: number;
}

/**
 * Membership data object from Patreon API v2
 */
export interface PatreonMembershipData {
	type: 'member';
	id: string;
	attributes: PatreonMembershipAttributes;
	relationships?: {
		campaign?: {
			data: { id: string; type: 'campaign' };
		};
		currently_entitled_tiers?: {
			data: Array<{ id: string; type: 'tier' }>;
		};
		user?: {
			data: { id: string; type: 'user' };
		};
	};
}

/**
 * Tier data object from Patreon API v2
 */
export interface PatreonTierData {
	type: 'tier';
	id: string;
	attributes: {
		title: string;
		description: string;
		amount_cents: number;
		published: boolean;
		patron_count: number;
	};
}

/**
 * Campaign data object from Patreon API v2
 */
export interface PatreonCampaignData {
	type: 'campaign';
	id: string;
	attributes: {
		creation_name: string;
		is_monthly: boolean;
		is_nsfw: boolean;
		summary: string;
		url: string;
		patron_count: number;
	};
}

/**
 * Identity API response from Patreon API v2
 */
export interface PatreonIdentityResponse {
	data: PatreonUserData;
	included?: Array<PatreonMembershipData | PatreonCampaignData | PatreonTierData>;
	links?: {
		self: string;
	};
}

/**
 * Processed user info after OAuth
 */
export interface PatreonUserInfo {
	id: string;
	email: string;
	fullName: string;
	firstName: string;
	lastName: string;
	imageUrl: string;
	isEmailVerified: boolean;
	isPatron: boolean;
	patronStatus: PatreonMembershipAttributes['patron_status'];
	currentTierAmountCents: number;
	lifetimeSupportCents: number;
}
