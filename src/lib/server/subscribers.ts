/**
 * Subscriber Management Utilities
 *
 * This module provides high-level functions for managing Patreon subscribers
 * in the Supabase database. All functions use the service role client for
 * privileged database access.
 *
 * @module lib/server/subscribers
 */

import { supabaseServer } from './supabase';
import type { Subscriber } from '$lib/types/database';

/**
 * Error thrown when a subscriber operation fails
 */
export class SubscriberError extends Error {
	constructor(
		message: string,
		public readonly code?: string,
		public readonly details?: unknown
	) {
		super(message);
		this.name = 'SubscriberError';
	}
}

/**
 * Normalizes an email address for consistent storage
 * - Converts to lowercase
 * - Trims whitespace
 *
 * @param email - Email address to normalize
 * @returns Normalized email address
 */
function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

/**
 * Retrieves a subscriber by email address
 *
 * @param email - Email address to search for
 * @returns Subscriber record if found, null otherwise
 * @throws {SubscriberError} If database query fails
 *
 * @example
 * ```typescript
 * const subscriber = await getSubscriberByEmail('user@example.com');
 * if (subscriber?.is_active) {
 *   // Grant access to protected content
 * }
 * ```
 */
export async function getSubscriberByEmail(email: string): Promise<Subscriber | null> {
	const normalizedEmail = normalizeEmail(email);

	const { data, error } = await supabaseServer
		.from('subscribers')
		.select('*')
		.eq('email', normalizedEmail)
		.maybeSingle();

	if (error) {
		throw new SubscriberError(
			`Failed to retrieve subscriber: ${error.message}`,
			error.code,
			error.details
		);
	}

	return data;
}

/**
 * Creates or updates a subscriber record (UPSERT operation)
 *
 * This function is idempotent and safe to call multiple times with the same data.
 * Perfect for webhook handlers that may receive duplicate events.
 *
 * @param email - Subscriber email address
 * @param isActive - Whether the subscription is active
 * @returns The created or updated subscriber record
 * @throws {SubscriberError} If database operation fails
 *
 * @example
 * ```typescript
 * // Add new active subscriber
 * await upsertSubscriber('user@example.com', true);
 *
 * // Deactivate existing subscriber
 * await upsertSubscriber('user@example.com', false);
 * ```
 */
export async function upsertSubscriber(email: string, isActive: boolean): Promise<Subscriber> {
	const normalizedEmail = normalizeEmail(email);

	const { data, error } = await supabaseServer
		.from('subscribers')
		// @ts-expect-error - Supabase type inference issue with Insert type
		.upsert(
			{
				email: normalizedEmail,
				is_active: isActive
			},
			{
				onConflict: 'email'
			}
		)
		.select()
		.single();

	if (error) {
		throw new SubscriberError(
			`Failed to upsert subscriber: ${error.message}`,
			error.code,
			error.details
		);
	}

	if (!data) {
		throw new SubscriberError('Upsert operation returned no data');
	}

	return data as Subscriber;
}

/**
 * Deletes a subscriber by email address
 *
 * Note: This performs a hard delete. Consider using updateSubscriberStatus
 * to set is_active=false instead for soft deletion.
 *
 * @param email - Email address of subscriber to delete
 * @returns True if subscriber was deleted, false if not found
 * @throws {SubscriberError} If database operation fails
 *
 * @example
 * ```typescript
 * const deleted = await deleteSubscriber('user@example.com');
 * console.log(deleted ? 'Deleted' : 'Not found');
 * ```
 */
export async function deleteSubscriber(email: string): Promise<boolean> {
	const normalizedEmail = normalizeEmail(email);

	const { data, error } = await supabaseServer
		.from('subscribers')
		.delete()
		.eq('email', normalizedEmail)
		.select();

	if (error) {
		throw new SubscriberError(
			`Failed to delete subscriber: ${error.message}`,
			error.code,
			error.details
		);
	}

	return (data?.length ?? 0) > 0;
}

/**
 * Updates the active status of a subscriber
 *
 * @param email - Email address of subscriber to update
 * @param isActive - New active status
 * @returns Updated subscriber record if found, null otherwise
 * @throws {SubscriberError} If database operation fails
 *
 * @example
 * ```typescript
 * // Deactivate a subscription
 * await updateSubscriberStatus('user@example.com', false);
 *
 * // Reactivate a subscription
 * await updateSubscriberStatus('user@example.com', true);
 * ```
 */
export async function updateSubscriberStatus(
	email: string,
	isActive: boolean
): Promise<Subscriber | null> {
	const normalizedEmail = normalizeEmail(email);

	const { data, error } = await supabaseServer
		.from('subscribers')
		// @ts-expect-error - Supabase type inference issue with Update type
		.update({ is_active: isActive })
		.eq('email', normalizedEmail)
		.select()
		.maybeSingle();

	if (error) {
		throw new SubscriberError(
			`Failed to update subscriber status: ${error.message}`,
			error.code,
			error.details
		);
	}

	return data as Subscriber | null;
}

/**
 * Checks if an email address corresponds to an active subscriber
 *
 * This is a convenience function that combines getSubscriberByEmail
 * with an active status check.
 *
 * @param email - Email address to check
 * @returns True if subscriber exists and is active, false otherwise
 * @throws {SubscriberError} If database query fails
 *
 * @example
 * ```typescript
 * if (await isActiveSubscriber('user@example.com')) {
 *   // Grant access to protected content
 * } else {
 *   // Show paywall or redirect
 * }
 * ```
 */
export async function isActiveSubscriber(email: string): Promise<boolean> {
	const subscriber = await getSubscriberByEmail(email);
	return subscriber?.is_active ?? false;
}
