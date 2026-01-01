/**
 * Patreon Webhook Endpoint
 *
 * This endpoint receives webhook events from Patreon when subscription events occur.
 * It verifies the webhook signature, processes the event, and updates the subscriber
 * database accordingly.
 *
 * Supported events:
 * - members:pledge:create: User becomes a patron (sets is_active = true)
 * - members:pledge:delete: User cancels their pledge (sets is_active = false)
 *
 * @module routes/api/patreon/webhook
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyWebhookSignature } from '$lib/server/patreon/verify-webhook';
import { upsertSubscriber, SubscriberError } from '$lib/server/subscribers';
import type { PatreonWebhookEvent, PatreonEventType } from '$lib/types/patreon';
import { PATREON_WEBHOOK_SECRET } from '$env/static/private';

/**
 * POST handler for Patreon webhook events
 *
 * Flow:
 * 1. Extract raw request body and signature header
 * 2. Verify webhook signature using HMAC-MD5
 * 3. Parse JSON payload
 * 4. Extract email and event type
 * 5. Update subscriber database based on event type
 * 6. Return appropriate HTTP status code
 */
export const POST: RequestHandler = async ({ request }) => {
	let requestBody: string;
	let event: PatreonWebhookEvent;

	try {
		// Step 1: Extract raw request body
		// We need the raw body for signature verification
		requestBody = await request.text();

		// Step 2: Verify webhook signature
		const signature = request.headers.get('X-Patreon-Signature');
		const verificationResult = verifyWebhookSignature(
			requestBody,
			signature,
			PATREON_WEBHOOK_SECRET
		);

		if (!verificationResult.isValid) {
			console.error('[Patreon Webhook] Signature verification failed:', verificationResult.error);
			return error(401, {
				message: 'Unauthorized: Invalid webhook signature'
			});
		}

		// Step 3: Parse JSON payload
		try {
			event = JSON.parse(requestBody) as PatreonWebhookEvent;
		} catch (parseError) {
			console.error('[Patreon Webhook] Failed to parse JSON payload:', parseError);
			return error(400, {
				message: 'Bad Request: Invalid JSON payload'
			});
		}

		// Step 4: Extract email from payload
		const email = event.data?.attributes?.email;

		if (!email) {
			console.error('[Patreon Webhook] Missing email in payload:', {
				eventId: event.data?.id,
				type: event.data?.type
			});
			return error(400, {
				message: 'Bad Request: Email not found in payload'
			});
		}

		// Extract event type from request headers (Patreon sends this)
		// Fallback to detecting from payload structure if not in headers
		const eventType = request.headers.get('X-Patreon-Event') as PatreonEventType | null;

		// Step 5: Process event based on type
		let isActive: boolean;
		let eventName: string;

		if (eventType === 'members:pledge:create') {
			// New subscription - activate subscriber
			isActive = true;
			eventName = 'pledge:create';
			console.log('[Patreon Webhook] Processing new pledge:', { email });
		} else if (eventType === 'members:pledge:delete') {
			// Cancelled subscription - deactivate subscriber
			isActive = false;
			eventName = 'pledge:delete';
			console.log('[Patreon Webhook] Processing pledge cancellation:', { email });
		} else {
			// Unsupported event type - acknowledge but don't process
			console.log('[Patreon Webhook] Unsupported event type:', { eventType, email });
			return json({
				message: 'Event type not supported',
				eventType
			});
		}

		// Step 6: Update subscriber database
		try {
			const subscriber = await upsertSubscriber(email, isActive);

			console.log('[Patreon Webhook] Successfully processed event:', {
				event: eventName,
				email,
				isActive,
				subscriberId: subscriber.id
			});

			return json({
				success: true,
				message: `Successfully processed ${eventName}`,
				subscriber: {
					email: subscriber.email,
					isActive: subscriber.is_active
				}
			});
		} catch (dbError) {
			// Database operation failed - return 500 to trigger Patreon retry
			if (dbError instanceof SubscriberError) {
				console.error('[Patreon Webhook] Database error:', {
					event: eventName,
					email,
					error: dbError.message,
					code: dbError.code,
					details: dbError.details
				});
			} else {
				console.error('[Patreon Webhook] Unexpected database error:', dbError);
			}

			return error(500, {
				message: 'Internal Server Error: Failed to update subscriber'
			});
		}
	} catch (unexpectedError) {
		// Catch-all for any unexpected errors
		console.error('[Patreon Webhook] Unexpected error:', unexpectedError);
		return error(500, {
			message: 'Internal Server Error'
		});
	}
};
