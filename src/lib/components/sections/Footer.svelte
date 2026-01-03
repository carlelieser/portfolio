<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { socials } from '$lib/data/socials';
</script>

<footer class="py-8 px-4 sm:px-6 lg:px-8 bg-background border-t border-border/50">
	<div class="max-w-3xl mx-auto">
		<div class="flex flex-col items-center gap-4">
			<!-- Social Icons -->
			<div class="flex items-center gap-1">
				{#each socials as social}
					<Button
						variant="ghost"
						size="icon-sm"
						href={social.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={social.name}
						class="text-muted-foreground"
					>
						<svelte:component this={social.icon} class="size-4" />
					</Button>
				{/each}
			</div>

			<!-- Copyright -->
			<p class="text-xs text-muted-foreground font-mono">
				&copy; {new Date().getFullYear()} Carlos Santos
			</p>
		</div>
	</div>
</footer>
