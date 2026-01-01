<script lang="ts">
	/**
	 * Robot3D Component
	 *
	 * A cute procedural 3D robot with eyes that follow the cursor.
	 * Built with Threlte (Three.js + Svelte).
	 *
	 * ACCESSIBILITY:
	 * - Respects `prefers-reduced-motion: reduce`
	 * - Decorative element with appropriate ARIA attributes
	 */

	import { Canvas } from '@threlte/core';
	import RobotScene from './RobotScene.svelte';

	let {
		size = 280
	}: {
		/** Size in pixels (width and height) */
		size?: number;
	} = $props();

	let containerRef: HTMLDivElement | null = $state(null);
	let pointerX = $state(0);
	let pointerY = $state(0);
	let prefersReducedMotion = $state(false);

	/** Detect reduced motion preference */
	$effect(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return;

		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mediaQuery.matches;

		const handleChange = (e: MediaQueryListEvent) => {
			prefersReducedMotion = e.matches;
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	});

	/** Global pointer tracking */
	$effect(() => {
		if (typeof window === 'undefined' || !containerRef) return;

		const handlePointerMove = (event: PointerEvent) => {
			if (prefersReducedMotion) return;

			const rect = containerRef!.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;

			// Calculate normalized position (-1 to 1)
			pointerX = Math.max(-1, Math.min(1, (event.clientX - centerX) / (window.innerWidth / 2)));
			pointerY = Math.max(-1, Math.min(1, (event.clientY - centerY) / (window.innerHeight / 2)));
		};

		window.addEventListener('pointermove', handlePointerMove);

		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
		};
	});
</script>

<div
	bind:this={containerRef}
	class="relative rounded-2xl overflow-hidden"
	style:width="{size}px"
	style:height="{size}px"
	role="img"
	aria-label="3D Robot Avatar"
>
	<Canvas>
		<RobotScene {pointerX} {pointerY} {prefersReducedMotion} />
	</Canvas>

	<!-- Decorative border -->
	<div class="absolute inset-0 rounded-2xl ring-1 ring-primary/20 pointer-events-none"></div>
</div>
