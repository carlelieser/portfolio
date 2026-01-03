export interface RepoContext {
	name: string;
	description: string | null;
	language: string | null;
	topics: string[];
}

export function buildCTASystemPrompt(): string {
	return `You are an expert web developer who can generate short (4 words or less), punchy, engaging CTA button labels for a GitHub repository based on its name, description, language, and topics for people interested in my projects.`;
}

export function buildCTAUserPrompt(repo: RepoContext): string {
	const topicsStr = repo.topics.length > 0 ? `Topics: ${repo.topics.slice(0, 3).join(', ')}` : '';

	return `Generate a CTA button label for this GitHub repository:

Repository: ${repo.name}
Description: ${repo.description || 'No description'}
Language: ${repo.language || 'Unknown'}
${topicsStr}`.trim();
}

