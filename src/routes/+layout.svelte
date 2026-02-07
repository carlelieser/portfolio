<script lang="ts">
	import '../app.css';
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
	<link rel="icon" type="image/x-icon" href="/favicons/favicon.ico" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png" />
	<link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
	<link rel="manifest" href="/favicons/site.webmanifest" />
</svelte:head>

{@render children()}
