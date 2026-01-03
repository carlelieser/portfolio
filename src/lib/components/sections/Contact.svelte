<script lang="ts">
	import { AnimatedButton } from '$lib/components/ui/lordicon';
	import { LORDICON_ICONS } from '$lib/config/lordicon';
	import { socials } from '$lib/data/socials';

	const email = 'hello@carlelieser.dev';
</script>

<section id="contact" class="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
	<div class="max-w-3xl mx-auto text-center">
		<div class="mb-12">
			<p class="text-sm font-mono text-primary tracking-widest uppercase mb-3">Contact</p>
			<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">Let's Work Together</h2>
			<div class="flex justify-center mb-6">
				<div class="w-16 h-0.5 bg-primary/40 rounded-full"></div>
			</div>
			<p class="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
				Have a project in mind? Let's get in touch.
			</p>
		</div>

		<!-- Email CTA -->
		<div class="mb-12">
			<AnimatedButton
				icon={LORDICON_ICONS.mail}
				label={email}
				size="lg"
				class="text-base px-8"
				iconSize={20}
				href="mailto:{email}"
			/>
		</div>

		<!-- Social Links -->
		<div class="space-y-4">
			<p class="text-sm font-mono text-muted-foreground uppercase tracking-wide">Or find me here</p>
			<div class="flex flex-wrap gap-3 justify-center items-center">
				{#each socials as social}
					<AnimatedButton
						icon={LORDICON_ICONS.launch}
						label={social.name}
						variant="outline"
						class="min-w-[120px]"
						iconSize={18}
						iconPosition="right"
						href={social.url}
						target="_blank"
						rel="noopener noreferrer"
					/>
				{/each}
			</div>
		</div>
	</div>
</section>
