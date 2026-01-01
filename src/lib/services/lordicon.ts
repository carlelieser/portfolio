const LORDICON_API_BASE = 'https://api.lordicon.com/v1';

export interface LordIconVariant {
	family: string;
	style: string;
	count: number;
	premium: number;
	free: number;
}

export interface LordIconFile {
	type: 'preview' | 'svg' | 'json';
	url: string;
}

export interface LordIconItem {
	index: number;
	name: string;
	tags: string[];
	premium: boolean;
	files: LordIconFile[];
}

export interface LordIconSearchResult {
	page: number;
	per_page: number;
	total: number;
	icons: LordIconItem[];
}

export class LordIconService {
	private token: string;

	constructor(token: string) {
		this.token = token;
	}

	private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
		const response = await fetch(`${LORDICON_API_BASE}${endpoint}`, {
			...options,
			headers: {
				Authorization: `Bearer ${this.token}`,
				...options?.headers
			}
		});

		if (!response.ok) {
			throw new Error(`LordIcon API error: ${response.status} ${response.statusText}`);
		}

		return response.json();
	}

	async getVariants(): Promise<LordIconVariant[]> {
		return this.fetch<LordIconVariant[]>('/variants');
	}

	async searchIcons(params: {
		search?: string;
		family?: string;
		style?: string;
		premium?: boolean;
		page?: number;
		per_page?: number;
	}): Promise<LordIconSearchResult> {
		const searchParams = new URLSearchParams();

		if (params.search) searchParams.set('search', params.search);
		if (params.family) searchParams.set('family', params.family);
		if (params.style) searchParams.set('style', params.style);
		if (params.premium !== undefined) searchParams.set('premium', String(params.premium));
		if (params.page) searchParams.set('page', String(params.page));
		if (params.per_page) searchParams.set('per_page', String(params.per_page));

		const query = searchParams.toString();
		return this.fetch<LordIconSearchResult>(`/icons${query ? `?${query}` : ''}`);
	}

	async trackDownload(family: string, style: string, index: number): Promise<void> {
		await this.fetch('/download/track', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ family, style, index })
		});
	}

	getIconJsonUrl(family: string, style: string, index: number): string {
		return `https://cdn.lordicon.com/${family}/${style}/${index}.json`;
	}
}

export function createLordIconService(token: string): LordIconService {
	return new LordIconService(token);
}
