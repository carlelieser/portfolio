<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { AnimatedButton } from '$lib/components/ui/lordicon';
	import { LORDICON_ICONS } from '$lib/config/lordicon';
	import Hero3DBackground from '$lib/components/effects/Hero3DBackground.svelte';
	import MailIcon from '@lucide/svelte/icons/mail';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import Typed from 'typed.js';

	let typedEl: HTMLElement;
	let typed: Typed;

	const taglines = [
		'a Full Stack Magician.',
		'a Pixel Pusher.',
		'a Senior Bug Factory.',
		'a Code Monkey.',
		'Sir Fix-a-Lot.',
		'Lord of the Strings',
		'the Codefather.'
	];

	onMount(() => {
		typed = new Typed(typedEl, {
			strings: taglines,
			typeSpeed: 50,
			backSpeed: 30,
			backDelay: 2000,
			loop: true,
			shuffle: true,
			smartBackspace: true
		});
	});

	onDestroy(() => typed?.destroy());
</script>

<section id="hero" data-hero-section class="relative min-h-screen p-0 md:p-4 lg:p-12 bg-muted/30">
	<div
		class="relative min-h-screen overflow-hidden size-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 rounded-4xl"
	>
		<Hero3DBackground shapeCount={6} opacity={1} blurAmount="80px" noiseOpacity={0.12} />

		<div class="relative flex flex-col items-center z-10 max-w-3xl mx-auto text-center gap-4">
			<h1 class="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tighter">
				Hi, I'm <span class="text-background text-shadow-xl">Carlos</span>,<br />
				<span bind:this={typedEl} class="text-background text-shadow-2xl"></span>
			</h1>

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
	</div>
</section>
