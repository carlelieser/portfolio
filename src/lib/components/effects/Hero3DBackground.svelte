<script lang="ts">
	/**
	 * Hero 3D Background Component
	 *
	 * Renders layered geometric shapes with CSS 3D transforms to create
	 * subtle depth behind hero content. Uses pure CSS for optimal performance.
	 *
	 * ACCESSIBILITY FEATURES:
	 * - Respects `prefers-reduced-motion: reduce` system setting
	 * - Disables scroll-based parallax when reduced motion is preferred
	 * - Maintains static 3D depth for visual design without motion
	 * - Marked with `aria-hidden="true"` and `role="presentation"` (decorative)
	 * - Does not interfere with keyboard navigation or screen readers
	 * - Meets WCAG 2.1 Level AA guidelines for motion (Success Criterion 2.3.3)
	 *
	 * KEYBOARD NAVIGATION:
	 * - Component is decorative, no focusable elements
	 * - Does not interfere with tab order or focus indicators
	 *
	 * SCREEN READER COMPATIBILITY:
	 * - Background shapes are hidden from assistive technology
	 * - Hero content remains fully accessible and readable
	 *
	 * @component
	 * @example
	 * ```svelte
	 * <Hero3DBackground />
	 * <Hero3DBackground colors={['primary', 'muted', 'accent']} opacity={0.15} />
	 * <Hero3DBackground blurAmount="8px" />
	 * ```
	 */

	import randomColor from 'randomcolor';

	let {
		shapeCount = 5,
		opacity = 0.2,
		blurAmount = undefined,
		noiseOpacity = 0.08
	}: {
		/** Number of shapes to generate (defaults to 5) */
		shapeCount?: number;
		/** Base opacity for all shapes (0-1, defaults to 0.2) */
		opacity?: number;
		/** Optional CSS blur filter value (e.g., "8px") for depth-of-field effect */
		blurAmount?: string | undefined;
		/** Noise overlay opacity (0-1, defaults to 0.08). Set to 0 to disable. */
		noiseOpacity?: number;
	} = $props();

	/** HSL color type for interpolation */
	type HSLColor = { h: number; s: number; l: number };

	/** Generate a random HSL color using randomcolor library */
	function generateRandomHSL(): HSLColor {
		const hslArray = randomColor({
			luminosity: 'light',
			format: 'hslArray'
		}) as unknown as [number, number, number];
		return { h: hslArray[0], s: hslArray[1], l: hslArray[2] };
	}

	/** Interpolate between two HSL colors */
	function lerpHSL(from: HSLColor, to: HSLColor, t: number): HSLColor {
		// Handle hue wrapping (shortest path around the color wheel)
		let hDiff = to.h - from.h;
		if (hDiff > 180) hDiff -= 360;
		if (hDiff < -180) hDiff += 360;

		return {
			h: (from.h + hDiff * t + 360) % 360,
			s: from.s + (to.s - from.s) * t,
			l: from.l + (to.l - from.l) * t
		};
	}

	/** Convert HSL to CSS string */
	function hslToString(color: HSLColor): string {
		return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
	}

	/** Color transition state for each shape */
	type ColorState = {
		current1: HSLColor;
		current2: HSLColor;
		target1: HSLColor;
		target2: HSLColor;
		angle: number;
		targetAngle: number;
		progress: number;
		duration: number;
	};

	/** Initialize color state for a shape */
	function createColorState(): ColorState {
		return {
			current1: generateRandomHSL(),
			current2: generateRandomHSL(),
			target1: generateRandomHSL(),
			target2: generateRandomHSL(),
			angle: Math.floor(Math.random() * 360),
			targetAngle: Math.floor(Math.random() * 360),
			progress: 0,
			duration: random(8, 15) // 8-15 seconds per transition
		};
	}

	/** Color states for all shapes (reactive) */
	let colorStates = $state<ColorState[]>(
		Array.from({ length: shapeCount }, () => createColorState())
	);

	/** Get interpolated gradient for a shape */
	function getGradient(state: ColorState): string {
		const t = easeInOutSine(state.progress);
		const color1 = lerpHSL(state.current1, state.target1, t);
		const color2 = lerpHSL(state.current2, state.target2, t);
		const angle = state.angle + (state.targetAngle - state.angle) * t;
		return `linear-gradient(${angle}deg, ${hslToString(color1)}, ${hslToString(color2)})`;
	}

	/** Easing function for smooth transitions */
	function easeInOutSine(t: number): number {
		return -(Math.cos(Math.PI * t) - 1) / 2;
	}


	/** Random number between min and max */
	function random(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

	/** Generate random shapes on mount */
	function generateShapes() {
		return Array.from({ length: shapeCount }, (_, i) => {
			// First shape is always centered (for mobile text contrast)
			const isHeroShape = i === 0;
			return {
			id: i,
			isHeroShape,
			// Size: 400-800px (hero shape is larger)
			size: Math.floor(isHeroShape ? random(500, 700) : random(400, 800)),
			// Position: hero shape centered, others spread across viewport
			top: isHeroShape ? '35%' : `${random(5, 70)}%`,
			left: isHeroShape ? '50%' : `${random(5, 85)}%`,
			// Depth: -250px to -50px (further = smaller movement)
			z: isHeroShape ? -100 : random(-250, -50),
			// Initial rotation
			rotX: random(-5, 5),
			rotY: random(-5, 5),
			// Parallax intensity based on depth (closer = more movement)
			parallaxMultiplier: random(0.3, 1.5),
			// Autonomous floating motion parameters
			float: {
				// Unique phase offset so shapes don't move in sync
				phaseX: random(0, Math.PI * 2),
				phaseY: random(0, Math.PI * 2),
				phaseZ: random(0, Math.PI * 2),
				phaseRotX: random(0, Math.PI * 2),
				phaseRotY: random(0, Math.PI * 2),
				// Faster speeds for more dynamic, bouncy motion
				speedX: random(0.6, 1.2),
				speedY: random(0.5, 1.0),
				speedZ: random(0.4, 0.8),
				speedRotX: random(0.7, 1.1),
				speedRotY: random(0.6, 1.0),
				// Larger amplitude for more visible bouncing
				amplitudeX: random(60, 120),
				amplitudeY: random(50, 100),
				amplitudeZ: random(50, 100),
				amplitudeRotX: random(6, 12),
				amplitudeRotY: random(6, 12)
			},
			// Blob morphing parameters (8 control points for border-radius)
			blob: {
				// Each corner has 2 values (horizontal/vertical radius)
				// 8 independent phases for organic morphing
				phases: Array.from({ length: 8 }, () => random(0, Math.PI * 2)),
				// Faster speeds for more fluid morphing
				speeds: Array.from({ length: 8 }, () => random(0.6, 1.2)),
				// Secondary wave for more organic feel
				phases2: Array.from({ length: 8 }, () => random(0, Math.PI * 2)),
				speeds2: Array.from({ length: 8 }, () => random(0.8, 1.4)),
				// Higher base radius values for rounder blobs (60-90%)
				baseRadii: Array.from({ length: 8 }, () => random(60, 90))
			}
		};
		});
	}

	/** Generated shapes - created once on component init */
	const shapes = generateShapes();

	/** Animation time for fluid motion */
	let time = $state(0);
	let animationFrameId: number | null = null;

	/**
	 * Accessibility: Motion Preference Detection
	 *
	 * Respects user's `prefers-reduced-motion` system setting to ensure
	 * an accessible experience for users with motion sensitivity.
	 *
	 * When `prefers-reduced-motion: reduce` is detected:
	 * - All scroll-based parallax animations are disabled
	 * - Static 3D depth (translateZ) is preserved for visual design
	 * - No motion occurs, preventing vestibular disorders triggers
	 *
	 * This implementation meets WCAG 2.1 Level AA guidelines:
	 * - Success Criterion 2.3.3: Animation from Interactions (Level AAA)
	 * - Respects user preferences and system settings
	 */
	let prefersReducedMotion = $state(false);
	let isMobile = $state(false);

	/**
	 * Pointer-based parallax state
	 *
	 * Tracks mouse/pointer position to create dynamic parallax effect where layers
	 * move at different speeds based on their depth (translateZ values).
	 */

	/**
	 * Raw mouse position (updates immediately on move)
	 */
	let rawMouseX = 0;
	let rawMouseY = 0;

	/**
	 * Smoothed mouse position (lerps slowly toward raw, creates nudge effect)
	 */
	let smoothMouseX = $state(0);
	let smoothMouseY = $state(0);



	/**
	 * Accessibility: Detect and track user's motion preference.
	 *
	 * Uses `matchMedia` to detect the `prefers-reduced-motion` media query.
	 * Listens for changes in case user toggles preference during session.
	 *
	 * Browser support: Chrome 74+, Firefox 63+, Safari 10.1+, Edge 79+
	 * (All modern browsers as of 2019)
	 */
	$effect(() => {
		// Check if matchMedia is supported (for SSR compatibility)
		if (typeof window === 'undefined' || !window.matchMedia) return;

		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const mobileQuery = window.matchMedia('(max-width: 768px), (hover: none)');

		// Set initial values
		prefersReducedMotion = motionQuery.matches;
		isMobile = mobileQuery.matches;

		// Listen for changes
		const handleMotionChange = (e: MediaQueryListEvent) => {
			prefersReducedMotion = e.matches;
		};
		const handleMobileChange = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
		};

		motionQuery.addEventListener('change', handleMotionChange);
		mobileQuery.addEventListener('change', handleMobileChange);

		// Cleanup
		return () => {
			motionQuery.removeEventListener('change', handleMotionChange);
			mobileQuery.removeEventListener('change', handleMobileChange);
		};
	});

	/**
	 * Track pointer/mouse position (raw values, smoothed in animation loop).
	 */
	$effect(() => {
		if (prefersReducedMotion) return;
		if (typeof window === 'undefined') return;

		const handlePointerMove = (e: PointerEvent | MouseEvent) => {
			// Normalize to -1 to 1 range (0 is center)
			rawMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
			rawMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
		};

		window.addEventListener('pointermove', handlePointerMove, { passive: true });
		window.addEventListener('mousemove', handlePointerMove, { passive: true });

		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('mousemove', handlePointerMove);
		};
	});

	/**
	 * Continuous animation loop for fluid floating motion.
	 * Each shape floats independently using sine waves with unique phases.
	 * Also smooths mouse input for gentle nudge effect.
	 */
	$effect(() => {
		if (prefersReducedMotion) {
			time = 0;
			smoothMouseX = 0;
			smoothMouseY = 0;
			return;
		}

		if (typeof window === 'undefined') return;

		let lastTime = performance.now();
		// Very slow lerp factor - mouse influence drifts slowly
		const lerpFactor = 0.02;

		const animate = (currentTime: number) => {
			const delta = (currentTime - lastTime) / 1000;
			lastTime = currentTime;

			// Increment time (controls floating animation)
			time += delta;

			// Slowly lerp smooth mouse toward raw mouse (creates drift, not tracking)
			smoothMouseX += (rawMouseX - smoothMouseX) * lerpFactor;
			smoothMouseY += (rawMouseY - smoothMouseY) * lerpFactor;

			// Update color transitions for each shape
			colorStates = colorStates.map((state) => {
				const newProgress = state.progress + delta / state.duration;

				if (newProgress >= 1) {
					// Transition complete - set new targets
					return {
						current1: state.target1,
						current2: state.target2,
						target1: generateRandomHSL(),
						target2: generateRandomHSL(),
						angle: state.targetAngle,
						targetAngle: Math.floor(Math.random() * 360),
						progress: 0,
						duration: random(8, 15)
					};
				}

				return { ...state, progress: newProgress };
			});

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
</script>

<!-- SVG Noise Filter -->
<svg class="hidden" aria-hidden="true">
	<filter id="noise">
		<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
		<feColorMatrix type="saturate" values="0" in="noise" result="mono" />
	</filter>
</svg>

<!--
	ACCESSIBILITY: Container is decorative and hidden from assistive technology

	Container fills parent with absolute positioning:
	- Prevents layout shifts
	- Doesn't interfere with pointer events (pointer-events-none)
	- Clips shapes to hero section bounds (overflow-hidden)
	- Lower z-index ensures content appears on top (z-index: 0)
	- preserve-3d maintains 3D context for child transforms

	Accessibility attributes:
	- role="presentation": Indicates purely decorative content
	- aria-hidden="true": Hides from screen readers (no semantic value)

	When prefers-reduced-motion is enabled:
	- scrollY remains 0, disabling parallax effect
	- Static 3D depth (translateZ) is maintained
	- No motion occurs, respecting user preference
-->
<div
	class="absolute inset-0 overflow-hidden pointer-events-none transform-3d"
	style:z-index="0"
	role="presentation"
	aria-hidden="true"
>
	<!-- Noise Overlay (disabled on mobile for performance) -->
	{#if noiseOpacity > 0 && !isMobile}
		<div
				class="absolute inset-0 pointer-events-none mix-blend-overlay"
				style:opacity={noiseOpacity}
				style:filter="url(#noise)"
				aria-hidden="true"
		></div>
	{/if}
	{#each shapes.slice(0, isMobile ? 3 : shapes.length) as shape (shape.id)}
		{@const floatX = isMobile ? 0 : Math.sin(time * shape.float.speedX + shape.float.phaseX) * shape.float.amplitudeX}
		{@const floatY = isMobile ? 0 : Math.sin(time * shape.float.speedY + shape.float.phaseY) * shape.float.amplitudeY}
		{@const floatZ = isMobile ? 0 : Math.sin(time * shape.float.speedZ + shape.float.phaseZ) * shape.float.amplitudeZ}
		{@const floatRotX = isMobile ? 0 : Math.sin(time * shape.float.speedRotX + shape.float.phaseRotX) * shape.float.amplitudeRotX}
		{@const floatRotY = isMobile ? 0 : Math.sin(time * shape.float.speedRotY + shape.float.phaseRotY) * shape.float.amplitudeRotY}
		{@const nudgeStrength = 15}
		{@const blobRadii = isMobile
			? shape.blob.baseRadii
			: shape.blob.phases.map((phase, idx) => {
				const wave1 = Math.sin(time * shape.blob.speeds[idx] + phase) * 18;
				const wave2 = Math.sin(time * shape.blob.speeds2[idx] + shape.blob.phases2[idx]) * 12;
				return Math.max(35, shape.blob.baseRadii[idx] + wave1 + wave2);
			})}
		{@const blobRadius = `${blobRadii[0]}% ${blobRadii[1]}% ${blobRadii[2]}% ${blobRadii[3]}% / ${blobRadii[4]}% ${blobRadii[5]}% ${blobRadii[6]}% ${blobRadii[7]}%`}
		{@const gradient = getGradient(colorStates[shape.id])}
		{@const mobileBlur = isMobile ? '40px' : blurAmount}
		{@const mobileSize = isMobile ? (shape.isHeroShape ? shape.size * 0.9 : shape.size * 0.7) : shape.size}
		<div
			class="absolute"
			class:will-change-transform={!isMobile}
			style:top={shape.top}
			style:left={shape.left}
			style:width="{mobileSize}px"
			style:height="{mobileSize}px"
			style:opacity={opacity}
			style:border-radius={blobRadius}
			style:background={gradient}
			style:transform={isMobile
				? shape.isHeroShape
					? `translate(-50%, -50%) translateZ(${shape.z}px)`
					: `translateZ(${shape.z}px)`
				: `translateX(${floatX + smoothMouseX * nudgeStrength}px)
				   translateY(${floatY + smoothMouseY * nudgeStrength}px)
				   translateZ(${shape.z + floatZ}px)
				   rotateX(${shape.rotX + floatRotX + smoothMouseY * -3}deg)
				   rotateY(${shape.rotY + floatRotY + smoothMouseX * 3}deg)`}
			style:backface-visibility="hidden"
			style:filter={mobileBlur ? `blur(${mobileBlur})` : undefined}
		></div>
	{/each}
</div>
