<script lang="ts">
	import { onMount } from 'svelte';
	import { generateCTA, FALLBACK_CTA, type RepoContext } from '$lib/services/cta-generator';
	import { ctaCache } from '$lib/services/cta-generator';
	import { AnimatedButton } from '$lib/components/ui/lordicon';
	import { LORDICON_ICONS } from '$lib/config/lordicon';

	interface Props {
		repo: RepoContext;
		href: string;
		class?: string;
	}

	let { repo, href, class: className }: Props = $props();

	let ctaText = $state(FALLBACK_CTA);
	let isGenerating = $state(false);

	// Check cache synchronously on init (no flash for cached CTAs)
	const cachedCTA = ctaCache.get(repo.name, repo.description);
	if (cachedCTA) {
		ctaText = cachedCTA;
	}

	onMount(() => {
		// Only generate if not cached
		if (!cachedCTA) {
			generateCTAAsync();
		}
	});

	async function generateCTAAsync() {
		isGenerating = true;
		try {
			await generateCTA(repo, {
				onToken: (partialCTA) => {
					ctaText = partialCTA;
				}
			});
		} finally {
			isGenerating = false;
		}
	}
</script>

<AnimatedButton
	icon={LORDICON_ICONS.launch}
	label={ctaText}
	iconSize={14}
	iconPosition="right"
	variant="secondary"
	{href}
	target="_blank"
	rel="noopener noreferrer"
	class="py-4 {className}"
/>
