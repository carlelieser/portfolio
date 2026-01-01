/**
 * Patreon Webhook Signature Verification
 *
 * This module provides utilities to verify the authenticity of webhook requests
 * from Patreon using HMAC-MD5 signature verification.
 *
 * IMPORTANT: Patreon uses MD5 (not SHA256) for webhook signatures.
 * The signature is the hex digest of the message body HMAC signed with MD5
 * using the webhook secret.
 *
 * @module lib/server/patreon/verify-webhook
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { WebhookVerificationResult } from '$lib/types/patreon';

/**
 * Verifies the signature of a Patreon webhook request
 *
 * This function computes an HMAC-MD5 hash of the request body using the
 * webhook secret and compares it with the signature provided by Patreon
 * in the X-Patreon-Signature header.
 *
 * Uses timing-safe comparison to prevent timing attacks that could
 * potentially leak information about the secret.
 *
 * @param body - Raw request body as a string
 * @param signature - Signature from X-Patreon-Signature header
 * @param secret - Webhook secret from Patreon developer dashboard
 * @returns Verification result with isValid boolean and optional error message
 *
 * @example
 * ```typescript
 * const result = verifyWebhookSignature(
 *   requestBody,
 *   request.headers.get('X-Patreon-Signature'),
 *   process.env.PATREON_WEBHOOK_SECRET
 * );
 *
 * if (!result.isValid) {
 *   return new Response('Unauthorized', { status: 401 });
 * }
 * ```
 */
export function verifyWebhookSignature(
	body: string,
	signature: string | null,
	secret: string | undefined
): WebhookVerificationResult {
	// Validate inputs
	if (!signature) {
		return {
			isValid: false,
			error: 'Missing X-Patreon-Signature header'
		};
	}

	if (!secret) {
		return {
			isValid: false,
			error: 'Webhook secret not configured (PATREON_WEBHOOK_SECRET)'
		};
	}

	if (!body) {
		return {
			isValid: false,
			error: 'Request body is empty'
		};
	}

	try {
		// Compute HMAC-MD5 hash of the request body
		// Patreon uses MD5 (not SHA256) for webhook signatures
		const hmac = createHmac('md5', secret);
		hmac.update(body);
		const computedSignature = hmac.digest('hex');

		// Use timing-safe comparison to prevent timing attacks
		// Both signatures must be converted to buffers of equal length
		const signatureBuffer = Buffer.from(signature);
		const computedBuffer = Buffer.from(computedSignature);

		// Ensure buffers are same length before comparison
		if (signatureBuffer.length !== computedBuffer.length) {
			return {
				isValid: false,
				error: 'Signature length mismatch'
			};
		}

		// Perform timing-safe comparison
		const isValid = timingSafeEqual(signatureBuffer, computedBuffer);

		return {
			isValid,
			error: isValid ? undefined : 'Signature verification failed'
		};
	} catch (error) {
		return {
			isValid: false,
			error: `Signature verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
		};
	}
}
