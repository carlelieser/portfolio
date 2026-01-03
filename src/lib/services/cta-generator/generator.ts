import { webLLMService } from '../webllm/engine';
import { buildCTASystemPrompt, buildCTAUserPrompt } from '../webllm/prompts';
import { CTAResponseSchema, type CTAResponse } from '../webllm/schemas';
import { ctaCache } from './cache';

export interface RepoContext {
	name: string;
	description: string | null;
	language: string | null;
	topics: string[];
}

export const FALLBACK_CTA = 'View on GitHub';

interface GenerateCTAResult {
	cta: string;
	reasoning?: string;
	fromCache: boolean;
	generated: boolean;
}

interface StreamingOptions {
	onToken?: (partialCTA: string) => void;
}

/**
 * Attempts to extract the CTA value from a partial JSON string.
 * Handles incomplete JSON that's still being streamed.
 */
function extractPartialCTA(partial: string): string | null {
	// Look for "cta": "..." pattern
	const ctaMatch = partial.match(/"cta"\s*:\s*"([^"]*)/);
	if (ctaMatch && ctaMatch[1]) {
		return ctaMatch[1];
	}
	return null;
}

export async function generateCTA(
	repo: RepoContext,
	options?: StreamingOptions
): Promise<GenerateCTAResult> {
	// Check cache first
	const cached = ctaCache.get(repo.name, repo.description);
	if (cached) {
		return { cta: cached, fromCache: true, generated: false };
	}

	// Check if web-llm is supported
	if (!webLLMService.isSupported()) {
		return { cta: FALLBACK_CTA, fromCache: false, generated: false };
	}

	try {
		const engine = await webLLMService.initialize();

		const stream = await engine.chat.completions.create({
			messages: [
				{
					role: 'system',
					content: buildCTASystemPrompt()
				},
				{
					role: 'user',
					content: buildCTAUserPrompt(repo)
				}
			],
			max_tokens: 100,
			temperature: 0.7,
			response_format: {
				type: 'json_object',
				schema: JSON.stringify(CTAResponseSchema)
			},
			stream: true
		});

		let fullResponse = '';
		let lastExtractedCTA = '';

		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta?.content || '';
			fullResponse += delta;

			// Try to extract partial CTA for streaming UI updates
			if (options?.onToken) {
				const partialCTA = extractPartialCTA(fullResponse);
				if (partialCTA && partialCTA !== lastExtractedCTA) {
					lastExtractedCTA = partialCTA;
					options.onToken(partialCTA);
				}
			}
		}

		if (!fullResponse) {
			return { cta: FALLBACK_CTA, fromCache: false, generated: false };
		}

		// Parse the complete JSON response
		const parsed: CTAResponse = JSON.parse(fullResponse);
		const cta = parsed.cta?.trim() || FALLBACK_CTA;

		// Final callback with complete CTA
		if (options?.onToken && cta !== lastExtractedCTA) {
			options.onToken(cta);
		}

		// Cache the result
		ctaCache.set(repo.name, repo.description, cta);

		return {
			cta,
			reasoning: parsed.reasoning,
			fromCache: false,
			generated: true
		};
	} catch (error) {
		console.warn('CTA generation failed:', error);
		return { cta: FALLBACK_CTA, fromCache: false, generated: false };
	}
}

export async function generateCTAsBatch(repos: RepoContext[]): Promise<Map<string, string>> {
	const results = new Map<string, string>();

	// Process sequentially to avoid overwhelming the model
	for (const repo of repos) {
		const { cta } = await generateCTA(repo);
		results.set(repo.name, cta);
	}

	return results;
}
