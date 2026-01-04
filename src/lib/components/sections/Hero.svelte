<script lang="ts">
	import { AnimatedButton } from '$lib/components/ui/lordicon';
	import { LORDICON_ICONS } from '$lib/config/lordicon';
	import Hero3DBackground from '$lib/components/effects/Hero3DBackground.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
</script>

<section
	id="hero"
	data-hero-section
	class="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-linear-to-b from-background via-background to-muted/20 perspective-distant"
>
	<Hero3DBackground shapeCount={6} opacity={1} blurAmount="80px" noiseOpacity={0.12} />

	<div class="relative flex flex-col items-center z-10 max-w-3xl mx-auto text-center gap-4">
		<h1
			class="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tighter"
		>
			Hi, I'm <span class="text-background text-shadow-xl">Carlos.</span>
		</h1>

		<p class="text-base sm:text-lg leading-relaxed text-foreground/70">
			A Full-Stack Software Engineer
		</p>

		<div class="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
			<AnimatedButton
				icon={LORDICON_ICONS.mail}
				fallbackIcon={MailIcon}
				label="Get in Touch"
				size="lg"
				class="text-base px-8"
				iconSize={20}
				href="#contact"
			/>
			<AnimatedButton
				icon={LORDICON_ICONS.launch}
				fallbackIcon={ExternalLinkIcon}
				label="View Projects"
				variant="secondary"
				size="lg"
				class="text-base px-8"
				iconSize={20}
				iconPosition="right"
				href="#projects"
			/>
		</div>
	</div>
</section>
