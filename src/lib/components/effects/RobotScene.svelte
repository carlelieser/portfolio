<script lang="ts">
	/**
	 * RobotScene Component
	 * Tech-style robot head inspired by GitHub's robot aesthetic.
	 */

	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';

	let {
		pointerX = 0,
		pointerY = 0,
		prefersReducedMotion = false
	}: {
		pointerX?: number;
		pointerY?: number;
		prefersReducedMotion?: boolean;
	} = $props();

	// Tech robot colors
	const BODY_DARK = '#24292e'; // GitHub dark
	const BODY_LIGHT = '#586069'; // GitHub gray
	const VISOR = '#1a1a2e'; // Dark visor
	const EYE_GLOW = '#58a6ff'; // GitHub blue
	const ACCENT = '#8b949e'; // Light accent

	// State
	let currentLookX = $state(0);
	let currentLookY = $state(0);
	let idleTime = $state(0);

	// Refs
	let leftEyeRef: THREE.Mesh | undefined = $state(undefined);
	let rightEyeRef: THREE.Mesh | undefined = $state(undefined);
	let headRef: THREE.Group | undefined = $state(undefined);
	let antennaRef: THREE.Group | undefined = $state(undefined);

	// Animation
	useTask((delta) => {
		if (prefersReducedMotion) return;

		idleTime += delta;

		// Smooth eye tracking
		const targetX = pointerX * 0.06;
		const targetY = -pointerY * 0.04;
		currentLookX += (targetX - currentLookX) * 0.08;
		currentLookY += (targetY - currentLookY) * 0.08;

		// Move eye positions (simple translation for LED-style eyes)
		if (leftEyeRef) {
			leftEyeRef.position.x = -0.12 + currentLookX;
			leftEyeRef.position.y = 0.05 + currentLookY;
		}
		if (rightEyeRef) {
			rightEyeRef.position.x = 0.12 + currentLookX;
			rightEyeRef.position.y = 0.05 + currentLookY;
		}

		// Subtle head movement
		if (headRef) {
			headRef.rotation.y = pointerX * 0.08;
			headRef.rotation.x = -pointerY * 0.05 + Math.sin(idleTime * 1.0) * 0.01;
			headRef.position.y = Math.sin(idleTime * 1.2) * 0.01;
		}

		// Antenna pulse
		if (antennaRef) {
			antennaRef.rotation.z = Math.sin(idleTime * 1.5) * 0.05;
		}
	});
</script>

<!-- Lighting -->
<T.AmbientLight intensity={0.4} />
<T.DirectionalLight position={[3, 4, 5]} intensity={1.2} />
<T.DirectionalLight position={[-2, 1, 3]} intensity={0.4} color="#58a6ff" />
<T.PointLight position={[0, 0, 2]} intensity={0.3} color="#58a6ff" />

<!-- Camera -->
<T.PerspectiveCamera makeDefault position={[0, 0, 2.2]} fov={40} />

<!-- Head -->
<T.Group bind:ref={headRef}>
	<!-- Main head - rounded rectangle shape -->
	<T.Mesh>
		<T.BoxGeometry args={[0.7, 0.6, 0.5]} />
		<T.MeshStandardMaterial color={BODY_DARK} metalness={0.3} roughness={0.7} />
	</T.Mesh>

	<!-- Head roundness - corner spheres -->
	<T.Mesh position={[-0.28, 0.22, 0]}>
		<T.SphereGeometry args={[0.12, 16, 16]} />
		<T.MeshStandardMaterial color={BODY_DARK} metalness={0.3} roughness={0.7} />
	</T.Mesh>
	<T.Mesh position={[0.28, 0.22, 0]}>
		<T.SphereGeometry args={[0.12, 16, 16]} />
		<T.MeshStandardMaterial color={BODY_DARK} metalness={0.3} roughness={0.7} />
	</T.Mesh>
	<T.Mesh position={[-0.28, -0.22, 0]}>
		<T.SphereGeometry args={[0.12, 16, 16]} />
		<T.MeshStandardMaterial color={BODY_DARK} metalness={0.3} roughness={0.7} />
	</T.Mesh>
	<T.Mesh position={[0.28, -0.22, 0]}>
		<T.SphereGeometry args={[0.12, 16, 16]} />
		<T.MeshStandardMaterial color={BODY_DARK} metalness={0.3} roughness={0.7} />
	</T.Mesh>

	<!-- Face visor/screen area -->
	<T.Mesh position={[0, 0.02, 0.22]}>
		<T.BoxGeometry args={[0.55, 0.35, 0.08]} />
		<T.MeshStandardMaterial color={VISOR} metalness={0.1} roughness={0.3} />
	</T.Mesh>

	<!-- Visor rim -->
	<T.Mesh position={[0, 0.02, 0.24]}>
		<T.BoxGeometry args={[0.58, 0.38, 0.02]} />
		<T.MeshStandardMaterial color={BODY_LIGHT} metalness={0.5} roughness={0.4} />
	</T.Mesh>

	<!-- Left eye (glowing circle) -->
	<T.Mesh bind:ref={leftEyeRef} position={[-0.12, 0.05, 0.27]}>
		<T.CircleGeometry args={[0.07, 32]} />
		<T.MeshBasicMaterial color={EYE_GLOW} />
	</T.Mesh>
	<!-- Left eye glow ring -->
	<T.Mesh position={[-0.12, 0.05, 0.265]}>
		<T.RingGeometry args={[0.07, 0.085, 32]} />
		<T.MeshBasicMaterial color={EYE_GLOW} transparent opacity={0.4} />
	</T.Mesh>

	<!-- Right eye -->
	<T.Mesh bind:ref={rightEyeRef} position={[0.12, 0.05, 0.27]}>
		<T.CircleGeometry args={[0.07, 32]} />
		<T.MeshBasicMaterial color={EYE_GLOW} />
	</T.Mesh>
	<!-- Right eye glow ring -->
	<T.Mesh position={[0.12, 0.05, 0.265]}>
		<T.RingGeometry args={[0.07, 0.085, 32]} />
		<T.MeshBasicMaterial color={EYE_GLOW} transparent opacity={0.4} />
	</T.Mesh>

	<!-- Antenna -->
	<T.Group bind:ref={antennaRef} position={[0, 0.38, 0]}>
		<T.Mesh>
			<T.CylinderGeometry args={[0.02, 0.03, 0.12, 8]} />
			<T.MeshStandardMaterial color={BODY_LIGHT} metalness={0.6} roughness={0.3} />
		</T.Mesh>
		<T.Mesh position.y={0.1}>
			<T.SphereGeometry args={[0.035, 16, 16]} />
			<T.MeshStandardMaterial color={EYE_GLOW} emissive={EYE_GLOW} emissiveIntensity={0.5} />
		</T.Mesh>
	</T.Group>

	<!-- Ear panels -->
	<T.Mesh position={[-0.38, 0, 0]}>
		<T.BoxGeometry args={[0.06, 0.25, 0.15]} />
		<T.MeshStandardMaterial color={BODY_LIGHT} metalness={0.5} roughness={0.4} />
	</T.Mesh>
	<T.Mesh position={[0.38, 0, 0]}>
		<T.BoxGeometry args={[0.06, 0.25, 0.15]} />
		<T.MeshStandardMaterial color={BODY_LIGHT} metalness={0.5} roughness={0.4} />
	</T.Mesh>

	<!-- Chin detail -->
	<T.Mesh position={[0, -0.28, 0.15]}>
		<T.BoxGeometry args={[0.2, 0.04, 0.1]} />
		<T.MeshStandardMaterial color={BODY_LIGHT} metalness={0.5} roughness={0.4} />
	</T.Mesh>
</T.Group>
