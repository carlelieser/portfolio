/**
 * Health Check Endpoint
 *
 * This endpoint provides deployment verification and system health monitoring.
 * It verifies that:
 * - The application is running and responding to requests
 * - Environment variables are properly configured
 * - Supabase connection is healthy and accessible
 * - All critical services are operational
 *
 * Usage:
 * - GET /api/health - Returns health status as JSON
 * - Useful for deployment verification, monitoring, and troubleshooting
 *
 * Response Format:
 * {
 *   "status": "healthy" | "unhealthy",
 *   "timestamp": ISO timestamp,
 *   "checks": {
 *     "environment": { "status": "pass" | "fail", "message": string },
 *     "supabase": { "status": "pass" | "fail", "message": string }
 *   }
 * }
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$lib/server/env';
import { createClient } from '@supabase/supabase-js';

interface HealthCheck {
	status: 'pass' | 'fail';
	message: string;
	details?: Record<string, unknown>;
}

interface HealthResponse {
	status: 'healthy' | 'unhealthy';
	timestamp: string;
	checks: {
		environment: HealthCheck;
		supabase: HealthCheck;
	};
}

/**
 * Checks environment variable configuration
 */
function checkEnvironment(): HealthCheck {
	try {
		// The env module validates on import, so if we get here, env vars are valid
		const hasRequiredVars =
			env.PUBLIC_SUPABASE_URL &&
			env.PUBLIC_SUPABASE_ANON_KEY &&
			env.SUPABASE_SERVICE_ROLE_KEY &&
			env.PATREON_WEBHOOK_SECRET;

		if (!hasRequiredVars) {
			return {
				status: 'fail',
				message: 'One or more required environment variables are missing'
			};
		}

		return {
			status: 'pass',
			message: 'All required environment variables are configured',
			details: {
				supabaseUrl: env.PUBLIC_SUPABASE_URL,
				variablesConfigured: [
					'PUBLIC_SUPABASE_URL',
					'PUBLIC_SUPABASE_ANON_KEY',
					'SUPABASE_SERVICE_ROLE_KEY',
					'PATREON_WEBHOOK_SECRET'
				]
			}
		};
	} catch (error) {
		return {
			status: 'fail',
			message: error instanceof Error ? error.message : 'Environment validation failed'
		};
	}
}

/**
 * Checks Supabase database connectivity
 */
async function checkSupabase(): Promise<HealthCheck> {
	try {
		// Create Supabase client with service role key for health checks
		const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		});

		// Attempt to query the subscribers table to verify database connectivity
		// We use count() to minimize data transfer while still verifying connection
		const { error, count } = await supabase
			.from('subscribers')
			.select('*', { count: 'exact', head: true });

		if (error) {
			return {
				status: 'fail',
				message: `Supabase connection failed: ${error.message}`,
				details: {
					errorCode: error.code,
					errorHint: error.hint
				}
			};
		}

		return {
			status: 'pass',
			message: 'Supabase connection healthy',
			details: {
				database: 'connected',
				subscribersTable: 'accessible',
				recordCount: count ?? 0
			}
		};
	} catch (error) {
		return {
			status: 'fail',
			message: error instanceof Error ? error.message : 'Supabase connection check failed'
		};
	}
}

/**
 * GET /api/health
 *
 * Returns the health status of the application and its dependencies.
 * This endpoint is useful for:
 * - Post-deployment verification
 * - Monitoring and alerting
 * - Debugging connectivity issues
 * - Load balancer health checks
 */
export const GET: RequestHandler = async () => {
	const timestamp = new Date().toISOString();

	// Run health checks
	const environmentCheck = checkEnvironment();
	const supabaseCheck = await checkSupabase();

	// Determine overall health status
	const allChecksPassed = environmentCheck.status === 'pass' && supabaseCheck.status === 'pass';

	const response: HealthResponse = {
		status: allChecksPassed ? 'healthy' : 'unhealthy',
		timestamp,
		checks: {
			environment: environmentCheck,
			supabase: supabaseCheck
		}
	};

	// Return 200 if healthy, 503 (Service Unavailable) if unhealthy
	const statusCode = allChecksPassed ? 200 : 503;

	return json(response, { status: statusCode });
};
