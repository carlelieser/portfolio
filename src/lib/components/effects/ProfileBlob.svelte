<script lang="ts">
	/**
	 * ProfileBlob Component
	 *
	 * Displays a profile image inside a fluid, animated blob shape.
	 * Uses SVG path morphing for smooth organic motion.
	 *
	 * ACCESSIBILITY:
	 * - Respects `prefers-reduced-motion: reduce`
	 * - Image has proper alt text
	 * - Animation is purely decorative
	 */

	let {
		src,
		alt = 'Profile photo',
		size = 256
	}: {
		/** Image source URL */
		src: string;
		/** Alt text for accessibility */
		alt?: string;
		/** Size in pixels (width and height) */
		size?: number;
	} = $props();

	/** Animation time */
	let time = $state(0);
	let animationFrameId: number | null = null;
	let prefersReducedMotion = $state(false);

	/** Blob control points - 8 points around a circle */
	const pointCount = 8;
	const baseRadius = 45; // percentage of viewBox
	const variationMin = 3;
	const variationMax = 8;

	/** Generate random phases and speeds for each control point */
	function random(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

	const controlPoints = Array.from({ length: pointCount }, (_, i) => ({
		angle: (i / pointCount) * Math.PI * 2,
		phase1: random(0, Math.PI * 2),
		phase2: random(0, Math.PI * 2),
		phase3: random(0, Math.PI * 2),
		speed1: random(0.4, 0.8),
		speed2: random(0.6, 1.0),
		speed3: random(0.3, 0.5),
		amplitude1: random(variationMin, variationMax),
		amplitude2: random(variationMin * 0.5, variationMax * 0.5),
		amplitude3: random(variationMin * 0.3, variationMax * 0.3)
	}));

	/** Calculate blob path based on current time */
	function getBlobPath(t: number): string {
		const points: { x: number; y: number }[] = [];
		const center = 50;

		for (let i = 0; i < pointCount; i++) {
			const cp = controlPoints[i];
			// Combine multiple sine waves for organic motion
			const wave1 = Math.sin(t * cp.speed1 + cp.phase1) * cp.amplitude1;
			const wave2 = Math.sin(t * cp.speed2 + cp.phase2) * cp.amplitude2;
			const wave3 = Math.sin(t * cp.speed3 + cp.phase3) * cp.amplitude3;
			const radius = baseRadius + wave1 + wave2 + wave3;

			points.push({
				x: center + Math.cos(cp.angle) * radius,
				y: center + Math.sin(cp.angle) * radius
			});
		}

		// Create smooth curve through points using cubic bezier
		return createSmoothPath(points);
	}

	/** Create a smooth closed path through points using Catmull-Rom to Bezier conversion */
	function createSmoothPath(points: { x: number; y: number }[]): string {
		const n = points.length;
		if (n < 3) return '';

		let path = '';
		const tension = 0.3; // Controls curve smoothness

		for (let i = 0; i < n; i++) {
			const p0 = points[(i - 1 + n) % n];
			const p1 = points[i];
			const p2 = points[(i + 1) % n];
			const p3 = points[(i + 2) % n];

			if (i === 0) {
				path = `M ${p1.x} ${p1.y}`;
			}

			// Calculate control points
			const cp1x = p1.x + (p2.x - p0.x) * tension;
			const cp1y = p1.y + (p2.y - p0.y) * tension;
			const cp2x = p2.x - (p3.x - p1.x) * tension;
			const cp2y = p2.y - (p3.y - p1.y) * tension;

			path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
		}

		return path + ' Z';
	}

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

	/** Animation loop */
	$effect(() => {
		if (prefersReducedMotion) {
			time = 0;
			return;
		}

		if (typeof window === 'undefined') return;

		let lastTime = performance.now();

		const animate = (currentTime: number) => {
			const delta = (currentTime - lastTime) / 1000;
			lastTime = currentTime;
			time += delta;
			animationFrameId = requestAnimationFrame(animate);
		};

		animationFrameId = requestAnimationFrame(animate);

		return () => {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		};
	});

	/** Current blob path */
	const blobPath = $derived(getBlobPath(time));
</script>

<div
	class="relative"
	style:width="{size}px"
	style:height="{size}px"
>
	<svg
		viewBox="0 0 100 100"
		class="absolute inset-0 w-full h-full"
		role="img"
		aria-label={alt}
	>
		<defs>
			<!-- Blob clip path -->
			<clipPath id="blob-clip">
				<path d={blobPath} />
			</clipPath>

			<!-- Gradient overlay for depth -->
			<linearGradient id="blob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" style="stop-color: hsl(var(--primary)); stop-opacity: 0.15" />
				<stop offset="100%" style="stop-color: hsl(var(--primary)); stop-opacity: 0" />
			</linearGradient>

			<!-- Glow filter -->
			<filter id="blob-glow" x="-20%" y="-20%" width="140%" height="140%">
				<feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>

		<!-- Background blob with glow -->
		<path
			d={blobPath}
			fill="none"
			stroke="hsl(var(--primary) / 0.3)"
			stroke-width="0.5"
			filter="url(#blob-glow)"
		/>

		<!-- Image inside blob -->
		<image
			href={src}
			x="-5"
			y="-5"
			width="110"
			height="110"
			preserveAspectRatio="xMidYMid slice"
			clip-path="url(#blob-clip)"
		/>

		<!-- Gradient overlay on image -->
		<path
			d={blobPath}
			fill="url(#blob-gradient)"
		/>

		<!-- Outer stroke -->
		<path
			d={blobPath}
			fill="none"
			stroke="hsl(var(--primary) / 0.2)"
			stroke-width="0.8"
		/>
	</svg>
</div>
