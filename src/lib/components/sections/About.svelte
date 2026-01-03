<script lang="ts">
	import Robot3D from '$lib/components/effects/Robot3D.svelte';
</script>

<section id="about" class="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
	<div class="max-w-4xl mx-auto">
		<div class="text-center mb-12">
			<p class="text-sm font-mono text-primary tracking-widest uppercase mb-3">About</p>
			<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">👋 Hey, there!</h2>
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
					I'm a creator at heart. Software just happens to be my current medium—but really, I just like building things.
				</p>

				<p class="text-base sm:text-lg leading-relaxed text-muted-foreground">
					I treat code like art. Whether it's designing an elegant system architecture or crafting a UI that feels <em>right</em>, I care about the details. I work across the full stack—C, C++, C#, Python, TypeScript, Dart—and frameworks like .NET, Flutter, React, Svelte. But I'm just as comfortable in Photoshop or Illustrator as I am in a code editor.
				</p>

				<p class="text-base sm:text-lg leading-relaxed text-muted-foreground">
					I never could pick a lane—turns out that's a feature, not a bug.
				</p>
			</div>
		</div>
	</div>
</section>
