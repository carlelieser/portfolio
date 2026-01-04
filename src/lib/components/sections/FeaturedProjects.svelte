<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Carousel from '$lib/components/ui/carousel';
	import { Badge } from '$lib/components/ui/badge';
	import { AnimatedButton } from '$lib/components/ui/lordicon';
	import { LORDICON_ICONS } from '$lib/config/lordicon';
	import featuredProjects from '$lib/data/featured.json';

	interface FeaturedProject {
		title: string;
		description: string;
		url: string;
		image: string;
		tags: string[];
	}

	const projects = featuredProjects as FeaturedProject[];
</script>

<div class="mb-12">
	<Carousel.Root
		opts={{
			align: 'start',
			loop: true
		}}
		class="w-full"
	>
		<Carousel.Content>
			{#each projects as project}
				<Carousel.Item>
					<div class="p-1">
						<Card.Root>
							<div class="grid md:grid-cols-2 gap-6 p-6 sm:p-8">
								<div class="flex flex-col gap-4">
									<h3 class="text-2xl md:text-4xl font-bold">{project.title}</h3>
									<p class="text-muted-foreground leading-relaxed">
										{project.description}
									</p>
									<AnimatedButton
											icon={LORDICON_ICONS.launch}
											class="mt-auto self-start"
											label="Check it out"
											variant="default"
											iconSize={18}
											iconPosition="right"
											href={project.url}
											target="_blank"
											rel="noopener noreferrer"
									/>
									<div class="flex flex-wrap gap-2">
										{#each project.tags as tag}
											<Badge variant="secondary" class="font-mono">{tag}</Badge>
										{/each}
									</div>
								</div>
								<div class="h-full overflow-hidden rounded-4xl flex items-center justify-center">
									<img
											src={project.image}
											alt={project.title}
											class="w-full rounded-4xl"
									/>
								</div>
							</div>
						</Card.Root>
					</div>
				</Carousel.Item>
			{/each}
		</Carousel.Content>
		{#if projects.length > 1}
			<Carousel.Previous class="left-2" />
			<Carousel.Next class="right-2" />
		{/if}
	</Carousel.Root>
</div>
