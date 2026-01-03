<script lang="ts">
	import {AnimatedButton} from '$lib/components/ui/lordicon';
	import {LORDICON_ICONS} from '$lib/config/lordicon';
	import {ChevronDown, VerifiedIcon} from 'lucide-svelte';
	import Hero3DBackground from '$lib/components/effects/Hero3DBackground.svelte';
</script>

<section
		id="hero"
		data-hero-section
		class="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-linear-to-b from-background via-background to-muted/20 perspective-distant"
>
	<Hero3DBackground shapeCount={6} opacity={1} blurAmount={"80px"} noiseOpacity={0.12}/>

	<div class="relative flex flex-col items-center z-10 max-w-4xl mx-auto text-center">
		<div class="flex flex-row items-center gap-2">
			<VerifiedIcon/>
			<p class="text-sm font-mono text-primary tracking-widest uppercase">Certified Tinkerer</p>
		</div>

		<h1
				class="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-foreground via-foreground to-foreground/60 pr-2"
		>
			Carlos Santos
		</h1>


		<div class="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
			<AnimatedButton
					icon={LORDICON_ICONS.mail}
					label="Get in Touch"
					size="lg"
					class="text-base px-8"
					iconSize={20}
					href="#contact"
			/>
			<AnimatedButton
					icon={LORDICON_ICONS.launch}
					label="View Projects"
					variant="secondary"
					size="lg"
					class="text-base px-8"
					iconSize={20}
					iconPosition="right"
					href="#projects"
			/>
		</div>

		<div class="mt-16 animate-bounce">
			<a
					href="#about"
					class="inline-block text-foreground/70 hover:text-foreground transition-colors"
			>
				<ChevronDown class="w-8 h-8"/>
				<span class="sr-only">Scroll to about section</span>
			</a>
		</div>
	</div>
</section>
