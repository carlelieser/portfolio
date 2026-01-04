<script lang="ts" module>
	import type { ButtonProps, ButtonSize, ButtonVariant } from '../button/button.svelte';
	import type { LordIconTrigger, LordIconStroke } from './lordicon.svelte';
	import type { Component } from 'svelte';

	export type AnimatedButtonProps = Omit<ButtonProps, 'children'> & {
		icon: string;
		iconPosition?: 'left' | 'right';
		iconSize?: number;
		iconTrigger?: LordIconTrigger;
		iconColors?: string;
		iconStroke?: LordIconStroke;
		iconSpeed?: number;
		iconCurrentColor?: boolean;
		fallbackIcon?: Component<{ class?: string }>;
		label?: string;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';
	import Button from '../button/button.svelte';
	import LordIcon from './lordicon.svelte';

	let {
		class: className,
		icon,
		iconPosition = 'left',
		iconSize = 24,
		iconTrigger = 'hover',
		iconColors,
		iconStroke,
		iconSpeed,
		iconCurrentColor = true,
		fallbackIcon,
		label,
		variant = 'default',
		size = 'default',
		...restProps
	}: AnimatedButtonProps = $props();

	let buttonRef: HTMLElement | null = $state(null);
	let buttonId = $state(`animated-btn-${Math.random().toString(36).slice(2, 9)}`);
</script>

<Button
	bind:ref={buttonRef}
	id={buttonId}
	{variant}
	{size}
	class={cn('group', className)}
	{...restProps}
>
	{#if iconPosition === 'left'}
		<LordIcon
			src={icon}
			trigger={iconTrigger}
			colors={iconColors}
			stroke={iconStroke}
			speed={iconSpeed}
			currentColor={iconCurrentColor}
			size={iconSize}
			target={`#${buttonId}`}
			{fallbackIcon}
		/>
	{/if}
	{#if label}
		<span>{label}</span>
	{/if}
	{#if iconPosition === 'right'}
		<LordIcon
			src={icon}
			trigger={iconTrigger}
			colors={iconColors}
			stroke={iconStroke}
			speed={iconSpeed}
			currentColor={iconCurrentColor}
			size={iconSize}
			target={`#${buttonId}`}
			{fallbackIcon}
		/>
	{/if}
</Button>
