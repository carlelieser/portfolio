<script lang="ts">
	import Robot3D from '$lib/components/effects/Robot3D.svelte';
</script>

<section id="about" class="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
	<div class="max-w-4xl mx-auto">
		<div class="text-center mb-12">
			<p class="text-sm font-mono text-primary tracking-widest uppercase mb-3">About</p>
			<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">The Short Version</h2>
			<div class="mt-6 flex justify-center">
				<div class="w-16 h-0.5 bg-primary/40 rounded-full"></div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
			<div class="lg:col-span-1 flex justify-center">
				<Robot3D size={280} />
			</div>

			<div class="lg:col-span-2 space-y-5">
				<p class="text-xl sm:text-2xl font-medium leading-relaxed text-foreground">
					I'm a full-stack developer who's been shipping software for over a decade. Currently building <a href="https://app.virtuestrong.ai" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">VirtueStrong</a>, an AI-powered mental wellness app.
				</p>

				<p class="text-base sm:text-lg leading-relaxed text-muted-foreground">
					I've built everything from npm libraries to Electron apps to PlayStation Vita plugins. My open source work has been used by thousands of developers. I care about clean architecture, but I care more about shipping—code that never sees users isn't clean, it's pointless.
				</p>

				<p class="text-base sm:text-lg leading-relaxed text-muted-foreground">
					I work best with startups and SaaS teams who need someone to own a feature end-to-end. Stack agnostic—I'll use whatever gets the job done without over-engineering it.
				</p>

				<div class="pt-2">
					<p class="text-sm font-mono text-primary/80 bg-primary/5 inline-block px-3 py-1.5 rounded">
						Remote & async-friendly
					</p>
				</div>
			</div>
		</div>
	</div>
</section>
