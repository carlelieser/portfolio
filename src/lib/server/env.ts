/**
 * Environment Variable Validation Module
 *
 * This module validates all required environment variables at application startup,
 * ensuring proper configuration before the application begins processing requests.
 *
 * It performs:
 * - Presence checking: Ensures all required variables are defined
 * - Format validation: Validates URL structures and basic formats
 * - Type safety: Exports a typed environment object for use throughout the application
 *
 * If any validation fails, the application will fail fast with clear error messages,
 * preventing runtime errors due to misconfiguration.
 */

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import {
	SUPABASE_SERVICE_ROLE_KEY,
	PATREON_WEBHOOK_SECRET,
	PATREON_CLIENT_ID,
	PATREON_CLIENT_SECRET,
	PATREON_CREATOR_ACCESS_TOKEN,
	PATREON_CREATOR_REFRESH_TOKEN
} from '$env/static/private';

/**
 * Validated and typed environment configuration object
 */
export interface ValidatedEnv {
	// Public variables (safe for client-side)
	PUBLIC_SUPABASE_URL: string;
	PUBLIC_SUPABASE_ANON_KEY: string;

	// Private variables (server-side only)
	SUPABASE_SERVICE_ROLE_KEY: string;

	// Patreon configuration
	PATREON_WEBHOOK_SECRET: string;
	PATREON_CLIENT_ID: string;
	PATREON_CLIENT_SECRET: string;
	PATREON_CREATOR_ACCESS_TOKEN: string;
	PATREON_CREATOR_REFRESH_TOKEN: string;
}

/**
 * Validates that a URL is properly formatted with HTTPS protocol
 */
function validateUrl(url: string, name: string): void {
	if (!url) {
		throw new Error(`Environment variable ${name} is required but not set`);
	}

	if (!url.startsWith('https://')) {
		throw new Error(`${name} must be a valid HTTPS URL. Got: ${url.substring(0, 20)}...`);
	}

	try {
		new URL(url);
	} catch (_error) {
		throw new Error(`${name} is not a valid URL format. Got: ${url.substring(0, 20)}...`);
	}
}

/**
 * Validates that a secret key is present and has reasonable length
 */
function validateSecret(secret: string, name: string, minLength = 10): void {
	if (!secret) {
		throw new Error(`Environment variable ${name} is required but not set`);
	}

	if (secret.length < minLength) {
		throw new Error(
			`${name} appears to be invalid (too short). Expected at least ${minLength} characters.`
		);
	}

	// Check for placeholder values from .env.example
	const placeholders = [
		'your-project-ref',
		'your-anon-key',
		'your-service-role-key',
		'your-patreon-webhook-secret',
		'your-',
		'example'
	];

	const lowerSecret = secret.toLowerCase();
	for (const placeholder of placeholders) {
		if (lowerSecret.includes(placeholder)) {
			throw new Error(
				`${name} appears to contain a placeholder value. Please set a real value in your .env file.`
			);
		}
	}
}

/**
 * Validates all required environment variables and returns a typed configuration object
 *
 * This function is called at module initialization, so any validation errors
 * will cause the application to fail fast at startup rather than during request handling.
 *
 * @throws {Error} If any required variable is missing or invalid
 * @returns {ValidatedEnv} Typed and validated environment configuration
 */
function validateEnv(): ValidatedEnv {
	const errors: string[] = [];

	// Validate public variables
	try {
		validateUrl(PUBLIC_SUPABASE_URL, 'PUBLIC_SUPABASE_URL');
	} catch (error) {
		errors.push(error instanceof Error ? error.message : String(error));
	}

	try {
		validateSecret(PUBLIC_SUPABASE_ANON_KEY, 'PUBLIC_SUPABASE_ANON_KEY', 20);
	} catch (error) {
		errors.push(error instanceof Error ? error.message : String(error));
	}

	// Validate private variables
	try {
		validateSecret(SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY', 20);
	} catch (error) {
		errors.push(error instanceof Error ? error.message : String(error));
	}

	try {
		validateSecret(PATREON_WEBHOOK_SECRET, 'PATREON_WEBHOOK_SECRET', 10);
	} catch (error) {
		errors.push(error instanceof Error ? error.message : String(error));
	}

	try {
		validateSecret(PATREON_CLIENT_ID, 'PATREON_CLIENT_ID', 20);
	} catch (error) {
		errors.push(error instanceof Error ? error.message : String(error));
	}

	try {
		validateSecret(PATREON_CLIENT_SECRET, 'PATREON_CLIENT_SECRET', 20);
	} catch (error) {
		errors.push(error instanceof Error ? error.message : String(error));
	}

	try {
		validateSecret(PATREON_CREATOR_ACCESS_TOKEN, 'PATREON_CREATOR_ACCESS_TOKEN', 20);
	} catch (error) {
		errors.push(error instanceof Error ? error.message : String(error));
	}

	try {
		validateSecret(PATREON_CREATOR_REFRESH_TOKEN, 'PATREON_CREATOR_REFRESH_TOKEN', 20);
	} catch (error) {
		errors.push(error instanceof Error ? error.message : String(error));
	}

	// If there are any validation errors, throw with all of them
	if (errors.length > 0) {
		const errorMessage = [
			'',
			'========================================',
			'❌ ENVIRONMENT CONFIGURATION ERROR',
			'========================================',
			'',
			'The following environment variables are missing or invalid:',
			'',
			...errors.map((err, i) => `${i + 1}. ${err}`),
			'',
			'Please check your .env file and ensure all required variables are set.',
			'See .env.example for the required variables and their format.',
			'',
			'Documentation: README.md - Environment Setup section',
			'========================================',
			''
		].join('\n');

		throw new Error(errorMessage);
	}

	// Return validated environment object
	return {
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		SUPABASE_SERVICE_ROLE_KEY,
		PATREON_WEBHOOK_SECRET,
		PATREON_CLIENT_ID,
		PATREON_CLIENT_SECRET,
		PATREON_CREATOR_ACCESS_TOKEN,
		PATREON_CREATOR_REFRESH_TOKEN
	};
}

/**
 * Validated environment configuration
 *
 * Import this object throughout your server-side code to access validated environment variables.
 *
 * @example
 * ```typescript
 * import { env } from '$lib/server/env';
 *
 * const supabase = createClient(
 *   env.PUBLIC_SUPABASE_URL,
 *   env.SUPABASE_SERVICE_ROLE_KEY
 * );
 * ```
 */
export const env = validateEnv();

/**
 * Logs environment configuration status (without exposing secrets)
 *
 * Useful for debugging and verifying configuration in development.
 * Never logs actual secret values, only their presence and basic validation status.
 */
export function logEnvStatus(): void {
	console.log('✅ Environment configuration validated successfully');
	console.log('   - Supabase URL:', env.PUBLIC_SUPABASE_URL);
	console.log('   - Supabase Anon Key: [SET]');
	console.log('   - Supabase Service Role Key: [SET]');
	console.log('   - Patreon Webhook Secret: [SET]');
	console.log('   - Patreon Client ID: [SET]');
	console.log('   - Patreon Client Secret: [SET]');
	console.log('   - Patreon Creator Access Token: [SET]');
	console.log('   - Patreon Creator Refresh Token: [SET]');
}
