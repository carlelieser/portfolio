/**
 * Database TypeScript Types
 *
 * These types mirror the Supabase database schema for type-safe database operations.
 * Structure is compatible with Supabase CLI type generation for easy migration later.
 *
 * @see supabase/migrations/001_create_subscribers_table.sql for schema definition
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Subscriber record as stored in the database
 */
export interface Subscriber {
	id: string;
	email: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

/**
 * Database schema definition compatible with Supabase type generation
 */
export interface Database {
	public: {
		Tables: {
			subscribers: {
				/**
				 * Row type - represents data returned from SELECT queries
				 */
				Row: Subscriber;

				/**
				 * Insert type - represents data required for INSERT operations
				 * Auto-generated fields (id, timestamps) are optional
				 */
				Insert: {
					id?: string;
					email: string;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};

				/**
				 * Update type - represents data allowed for UPDATE operations
				 * All fields except id can be updated
				 */
				Update: {
					id?: string;
					email?: string;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};

				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
