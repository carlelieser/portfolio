<script lang="ts">
	import { AnimatedButton } from '$lib/components/ui/lordicon';
	import { LORDICON_ICONS } from '$lib/config/lordicon';

	const patreonUrl = 'https://patreon.com/carlelieserdev';
</script>

<section id="patreon" class="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-accent">
	<div class="max-w-3xl mx-auto text-center">
		<div class="mb-8">
			<p class="text-sm font-mono text-primary tracking-widest uppercase mb-3">Support</p>
			<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
				Buy Me a Coffee
			</h2>
			<div class="flex justify-center mb-6">
				<div class="w-16 h-0.5 bg-primary/40 rounded-full"></div>
			</div>
			<p class="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
				Like what you see? A coffee goes a long way in keeping me caffeinated and coding. No pressure, but hey, I won't say no!
			</p>
		</div>

		<AnimatedButton
			icon={LORDICON_ICONS.heart}
			label="Become a Patron"
			size="lg"
			class="text-base px-8"
			iconSize={20}
			iconPosition="right"
			href={patreonUrl}
			target="_blank"
			rel="noopener noreferrer"
		/>
	</div>
</section>
