<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground',
				secondary: 'bg-secondary text-secondary-foreground',
				destructive: 'bg-destructive text-destructive-foreground',
				outline: 'border border-input bg-background text-foreground',
				muted: 'bg-muted text-muted-foreground'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

	export type BadgeProps = WithElementRef<HTMLAttributes<HTMLSpanElement>> & {
		variant?: BadgeVariant;
	};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		ref = $bindable(null),
		children,
		...restProps
	}: BadgeProps = $props();
</script>

<span
	bind:this={ref}
	data-slot="badge"
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</span>
