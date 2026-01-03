interface CachedCTA {
	cta: string;
	timestamp: number;
	hash: string;
}

interface CTACacheData {
	version: number;
	entries: Record<string, CachedCTA>;
}

const CACHE_KEY = 'repo-cta-cache';
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashRepoData(name: string, description: string | null): string {
	const data = `${name}|${description || ''}`;
	let hash = 0;
	for (let i = 0; i < data.length; i++) {
		const char = data.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash.toString(36);
}

class CTACache {
	private cache: CTACacheData | null = null;

	private load(): CTACacheData {
		if (this.cache) return this.cache;

		try {
			const stored = localStorage.getItem(CACHE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as CTACacheData;
				if (parsed.version === CACHE_VERSION) {
					this.cache = parsed;
					return this.cache;
				}
			}
		} catch {
			// Ignore parsing errors
		}

		this.cache = { version: CACHE_VERSION, entries: {} };
		return this.cache;
	}

	private save(): void {
		if (!this.cache) return;
		try {
			localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
		} catch {
			// localStorage might be full or disabled
		}
	}

	get(name: string, description: string | null): string | null {
		if (typeof localStorage === 'undefined') return null;

		const cache = this.load();
		const hash = hashRepoData(name, description);
		const entry = cache.entries[name];

		if (!entry) return null;

		// Check if hash matches (repo data unchanged)
		if (entry.hash !== hash) return null;

		// Check if expired
		if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
			delete cache.entries[name];
			this.save();
			return null;
		}

		return entry.cta;
	}

	set(name: string, description: string | null, cta: string): void {
		if (typeof localStorage === 'undefined') return;

		const cache = this.load();
		const hash = hashRepoData(name, description);

		cache.entries[name] = {
			cta,
			timestamp: Date.now(),
			hash
		};

		this.save();
	}

	clear(): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.removeItem(CACHE_KEY);
		this.cache = null;
	}
}

export const ctaCache = new CTACache();
