/**
 * Patreon Webhook Testing Script
 *
 * This script allows you to test the Patreon webhook endpoint locally by sending
 * properly signed webhook payloads. It generates valid MD5 HMAC signatures and
 * sends POST requests to the local development server.
 *
 * Usage:
 *   1. Ensure your dev server is running (npm run dev)
 *   2. Set PATREON_WEBHOOK_SECRET in your .env file
 *   3. Run: npx tsx scripts/test-patreon-webhook.ts [create|delete] [email]
 *
 * Examples:
 *   npx tsx scripts/test-patreon-webhook.ts create patron@example.com
 *   npx tsx scripts/test-patreon-webhook.ts delete patron@example.com
 */

import { createHmac } from 'crypto';

// Configuration
const WEBHOOK_URL = 'http://localhost:5173/api/patreon/webhook';
const WEBHOOK_SECRET = process.env.PATREON_WEBHOOK_SECRET || 'test-secret-key';

// Mock Patreon webhook payloads
function createPledgePayload(email: string) {
	return {
		data: {
			type: 'member',
			id: '12345678-test-member-id',
			attributes: {
				email: email,
				full_name: 'Test Patron',
				patron_status: 'active_patron',
				last_charge_status: 'Paid',
				last_charge_date: new Date().toISOString(),
				currently_entitled_amount_cents: 500
			}
		},
		links: {
			self: 'https://www.patreon.com/api/oauth2/v2/members/12345678'
		}
	};
}

function deletePledgePayload(email: string) {
	return {
		data: {
			type: 'member',
			id: '12345678-test-member-id',
			attributes: {
				email: email,
				full_name: 'Test Patron',
				patron_status: 'former_patron',
				last_charge_status: 'Deleted'
			}
		},
		links: {
			self: 'https://www.patreon.com/api/oauth2/v2/members/12345678'
		}
	};
}

/**
 * Generate HMAC-MD5 signature for webhook payload
 * This matches Patreon's signature algorithm
 */
function generateSignature(body: string, secret: string): string {
	const hmac = createHmac('md5', secret);
	hmac.update(body);
	return hmac.digest('hex');
}

/**
 * Send webhook request to local endpoint
 */
async function sendWebhook(
	eventType: 'members:pledge:create' | 'members:pledge:delete',
	email: string
) {
	// Generate payload
	const payload =
		eventType === 'members:pledge:create' ? createPledgePayload(email) : deletePledgePayload(email);

	const body = JSON.stringify(payload);

	// Generate signature
	const signature = generateSignature(body, WEBHOOK_SECRET);

	console.log('\n===== Patreon Webhook Test =====');
	console.log('Event Type:', eventType);
	console.log('Email:', email);
	console.log('Signature:', signature);
	console.log('URL:', WEBHOOK_URL);
	console.log('================================\n');

	try {
		const response = await fetch(WEBHOOK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Patreon-Signature': signature,
				'X-Patreon-Event': eventType
			},
			body: body
		});

		const responseData = await response.text();

		console.log('Response Status:', response.status);
		console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
		console.log('Response Body:', responseData);

		if (response.ok) {
			console.log('\n✓ Webhook processed successfully!');
		} else {
			console.log('\n✗ Webhook processing failed!');
		}
	} catch (error) {
		console.error('\n✗ Error sending webhook:', error);
		console.error('\nMake sure your dev server is running (npm run dev)');
	}

	console.log('\n================================\n');
}

/**
 * Test invalid signature
 */
async function testInvalidSignature(email: string) {
	const payload = createPledgePayload(email);
	const body = JSON.stringify(payload);

	console.log('\n===== Testing Invalid Signature =====');
	console.log('Expected: 401 Unauthorized');
	console.log('=====================================\n');

	try {
		const response = await fetch(WEBHOOK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Patreon-Signature': 'invalid-signature-12345',
				'X-Patreon-Event': 'members:pledge:create'
			},
			body: body
		});

		const responseData = await response.text();

		console.log('Response Status:', response.status);
		console.log('Response Body:', responseData);

		if (response.status === 401) {
			console.log('\n✓ Invalid signature correctly rejected!');
		} else {
			console.log('\n✗ Expected 401 but got', response.status);
		}
	} catch (error) {
		console.error('\n✗ Error:', error);
	}

	console.log('\n=====================================\n');
}

/**
 * Test malformed payload
 */
async function testMalformedPayload() {
	const body = '{"invalid": "json structure"';
	const signature = generateSignature(body, WEBHOOK_SECRET);

	console.log('\n===== Testing Malformed Payload =====');
	console.log('Expected: 400 Bad Request');
	console.log('=====================================\n');

	try {
		const response = await fetch(WEBHOOK_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Patreon-Signature': signature,
				'X-Patreon-Event': 'members:pledge:create'
			},
			body: body
		});

		const responseData = await response.text();

		console.log('Response Status:', response.status);
		console.log('Response Body:', responseData);

		if (response.status === 400) {
			console.log('\n✓ Malformed payload correctly rejected!');
		} else {
			console.log('\n✗ Expected 400 but got', response.status);
		}
	} catch (error) {
		console.error('\n✗ Error:', error);
	}

	console.log('\n=====================================\n');
}

// Main execution
async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const email = args[1] || 'test@example.com';

	if (!command) {
		console.log('Usage: npx tsx scripts/test-patreon-webhook.ts [command] [email]');
		console.log('\nCommands:');
		console.log('  create <email>    - Test members:pledge:create event');
		console.log('  delete <email>    - Test members:pledge:delete event');
		console.log('  invalid           - Test invalid signature (should return 401)');
		console.log('  malformed         - Test malformed payload (should return 400)');
		console.log('  all <email>       - Run all tests');
		console.log('\nExamples:');
		console.log('  npx tsx scripts/test-patreon-webhook.ts create patron@example.com');
		console.log('  npx tsx scripts/test-patreon-webhook.ts delete patron@example.com');
		console.log('  npx tsx scripts/test-patreon-webhook.ts all patron@example.com');
		process.exit(1);
	}

	switch (command) {
		case 'create':
			await sendWebhook('members:pledge:create', email);
			break;

		case 'delete':
			await sendWebhook('members:pledge:delete', email);
			break;

		case 'invalid':
			await testInvalidSignature(email);
			break;

		case 'malformed':
			await testMalformedPayload();
			break;

		case 'all':
			console.log('Running all tests...\n');
			await sendWebhook('members:pledge:create', email);
			await new Promise((resolve) => setTimeout(resolve, 500));
			await sendWebhook('members:pledge:delete', email);
			await new Promise((resolve) => setTimeout(resolve, 500));
			await testInvalidSignature(email);
			await new Promise((resolve) => setTimeout(resolve, 500));
			await testMalformedPayload();
			break;

		default:
			console.error('Unknown command:', command);
			console.log('Run without arguments to see usage.');
			process.exit(1);
	}
}

main();
