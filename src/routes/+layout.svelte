<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Lenis from 'lenis';

	let { children } = $props();

	$effect(() => {
		if (typeof window === 'undefined') return;

		// Disable Lenis on mobile for better native scrolling
		const isMobile = window.matchMedia('(max-width: 768px), (hover: none)').matches;
		if (isMobile) return;

		const lenis = new Lenis({
			duration: 1.2,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			smoothWheel: true
		});

		function raf(time: number) {
			lenis.raf(time);
			requestAnimationFrame(raf);
		}

		requestAnimationFrame(raf);

		return () => lenis.destroy();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
