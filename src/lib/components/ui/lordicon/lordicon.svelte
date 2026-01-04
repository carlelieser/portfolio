<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Component } from 'svelte';

	export type LordIconTrigger =
		| 'hover'
		| 'click'
		| 'loop'
		| 'loop-on-hover'
		| 'in'
		| 'morph'
		| 'boomerang'
		| 'sequence';

	export type LordIconStroke = 'light' | 'regular' | 'bold';

	export type LordIconProps = HTMLAttributes<HTMLElement> & {
		src: string;
		trigger?: LordIconTrigger;
		colors?: string;
		stroke?: LordIconStroke;
		speed?: number;
		animationState?: string;
		target?: string;
		loading?: 'lazy' | 'interaction' | 'delay';
		size?: number;
		currentColor?: boolean;
		fallbackIcon?: Component<{ class?: string }>;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let {
		class: className,
		src,
		trigger = 'hover',
		colors,
		stroke,
		speed,
		animationState,
		target,
		loading,
		size = 24,
		currentColor = false,
		fallbackIcon,
		...restProps
	}: LordIconProps = $props();

	let initialized = $state(false);
	let iconLoaded = $state(false);

	onMount(async () => {
		if (browser && !customElements.get('lord-icon')) {
			const { defineElement } = await import('@lordicon/element');
			defineElement();
		}
		initialized = true;
	});

	function handleIconReady() {
		iconLoaded = true;
	}

	const iconStyle = $derived(`width: ${size}px; height: ${size}px;`);
	const showFallback = $derived(!iconLoaded && fallbackIcon);
</script>

{#if initialized}
	<lord-icon
		{src}
		{trigger}
		colors={colors || undefined}
		stroke={stroke || undefined}
		speed={speed || undefined}
		state={animationState || undefined}
		target={target || undefined}
		loading={loading || undefined}
		style={iconStyle}
		class={cn(currentColor && 'current-color', showFallback && 'opacity-0 absolute', className)}
		onready={handleIconReady}
		{...restProps}
	></lord-icon>
	{#if showFallback}
		<svelte:component this={fallbackIcon} class="shrink-0" style={iconStyle} />
	{/if}
{:else if fallbackIcon}
	<svelte:component this={fallbackIcon} class="shrink-0" style={iconStyle} />
{:else}
	<div style={iconStyle} class={cn('animate-pulse bg-muted rounded', className)}></div>
{/if}
