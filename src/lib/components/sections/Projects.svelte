<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { AnimatedButton } from '$lib/components/ui/lordicon';
	import { LORDICON_ICONS } from '$lib/config/lordicon';
	import * as Empty from '$lib/components/ui/empty';
	import GithubIcon from '@lucide/svelte/icons/github';
	import StarIcon from '@lucide/svelte/icons/star';
	import GitForkIcon from '@lucide/svelte/icons/git-fork';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import FeaturedProjects from './FeaturedProjects.svelte';

	interface GitHubRepo {
		name: string;
		description: string | null;
		html_url: string;
		stargazers_count: number;
		forks_count: number;
		language: string | null;
		topics: string[];
	}

	const GITHUB_USERNAME = 'carlelieser';

	let repos: GitHubRepo[] = [];
	let loading = true;
	let error: string | null = null;

	let hidden = ["nitshift-site"]

	async function fetchGitHubRepos() {
		try {
			const excludeRepos = hidden.map(repo => `+-repo:${GITHUB_USERNAME}/${repo}`).join('');
			const response = await fetch(
				`https://api.github.com/search/repositories?q=user:${GITHUB_USERNAME}+fork:false+-repo:${GITHUB_USERNAME}/portfolio${excludeRepos}&sort=updated&order=desc&per_page=3`,
				{
					headers: {
						Accept: 'application/vnd.github.v3+json'
					}
				}
			);

			if (!response.ok) {
				throw new Error('Failed to fetch repositories');
			}

			const data = await response.json();
			repos = (data.items as GitHubRepo[]).filter((repo) => !repo.name.includes('.github'));
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchGitHubRepos();
	});

	function getLanguageColor(language: string | null): string {
		const colors: Record<string, string> = {
			TypeScript: 'bg-blue-500',
			JavaScript: 'bg-yellow-400',
			Python: 'bg-green-500',
			Rust: 'bg-orange-500',
			Go: 'bg-cyan-500',
			C: 'bg-gray-500',
			'C++': 'bg-pink-500',
			Svelte: 'bg-orange-600',
			default: 'bg-primary'
		};
		return colors[language || 'default'] || colors.default;
	}
</script>

<section id="projects" class="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 border-b">
	<div class="max-w-6xl mx-auto">
		<div class="text-center mb-12">
			<p class="text-sm font-mono text-primary tracking-widest uppercase mb-3">Work</p>
			<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">Things I've Built</h2>
			<div class="flex justify-center mb-6">
				<div class="w-16 h-0.5 bg-primary/40 rounded-full"></div>
			</div>
			<p class="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
				From production SaaS apps to open source libraries used by thousands
			</p>
		</div>

		<!-- Featured Projects -->
		<FeaturedProjects />

		<!-- GitHub Repos Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#if loading}
				{#each Array(6) as _}
					<Card class="animate-pulse">
						<CardHeader>
							<div class="flex items-start justify-between">
								<div class="p-2 rounded-lg bg-muted mb-4 w-10 h-10"></div>
								<div class="flex items-center gap-3">
									<div class="h-4 w-8 bg-muted rounded"></div>
									<div class="h-4 w-8 bg-muted rounded"></div>
								</div>
							</div>
							<div class="h-6 w-3/4 bg-muted rounded mb-2"></div>
							<div class="space-y-2 min-h-[3rem]">
								<div class="h-4 w-full bg-muted rounded"></div>
								<div class="h-4 w-2/3 bg-muted rounded"></div>
							</div>
						</CardHeader>
						<CardContent class="flex-1">
							<div class="flex flex-wrap gap-2">
								<div class="h-5 w-20 bg-muted rounded-full"></div>
								<div class="h-5 w-14 bg-muted rounded-full"></div>
								<div class="h-5 w-16 bg-muted rounded-full"></div>
							</div>
						</CardContent>
						<CardFooter>
							<div class="h-10 w-32 bg-muted rounded-md ml-auto"></div>
						</CardFooter>
					</Card>
				{/each}
			{:else if error}
				<div class="col-span-full text-center py-8">
					<p class="text-muted-foreground">Unable to load repositories. Please try again later.</p>
				</div>
			{:else}
				{#each repos as repo}
					<Card class="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
						<CardHeader>
							<div class="flex items-start justify-between">
								<div class="p-2 rounded-lg bg-primary/10 text-primary mb-4">
									<GithubIcon class="w-6 h-6" />
								</div>
								<div class="flex items-center gap-3 text-xs font-mono text-muted-foreground">
									{#if repo.stargazers_count > 0}
										<span class="flex items-center gap-1">
											<StarIcon class="w-3.5 h-3.5" />
											{repo.stargazers_count}
										</span>
									{/if}
									{#if repo.forks_count > 0}
										<span class="flex items-center gap-1">
											<GitForkIcon class="w-3.5 h-3.5" />
											{repo.forks_count}
										</span>
									{/if}
								</div>
							</div>
							<CardTitle class="text-xl group-hover:text-primary transition-colors">
								<a href={repo.html_url} target="_blank" rel="noopener noreferrer" class="hover:underline">
									{repo.name}
								</a>
							</CardTitle>
							<CardDescription class="text-sm leading-relaxed min-h-[3rem]">
								{repo.description || 'No description available'}
							</CardDescription>
						</CardHeader>
						<CardContent class="flex-1">
							<div class="flex flex-wrap items-center gap-2">
								{#if repo.language}
									<Badge variant="outline" class="gap-1.5 bg-primary/10 text-primary border-transparent font-mono">
										<span class="w-2 h-2 rounded-full {getLanguageColor(repo.language)}"></span>
										{repo.language}
									</Badge>
								{/if}
								{#each repo.topics as topic}
									<Badge variant="muted" class="font-mono">{topic}</Badge>
								{/each}
							</div>
						</CardContent>
						<CardFooter>
							<AnimatedButton
								icon={LORDICON_ICONS.launch}
								fallbackIcon={ExternalLinkIcon}
								label="View"
								variant="outline"
								size="sm"
								iconSize={16}
								iconPosition="right"
								href={repo.html_url}
								target="_blank"
								rel="noopener noreferrer"
								class="ml-auto"
							/>
						</CardFooter>
					</Card>
				{/each}

				<!-- View More Card - fills grid whitespace -->
				<a
					href="https://github.com/carlelieser?tab=repositories"
					target="_blank"
					rel="noopener noreferrer"
					class="group"
				>
					<Empty.Root class="h-full rounded-xl border border-dashed border-border bg-muted/30 transition-all duration-300 hover:border-primary/50 hover:bg-muted/50">
						<Empty.Header>
							<Empty.Media variant="icon" >
								<GithubIcon class="size-8" />
							</Empty.Media>
							<Empty.Title >View More</Empty.Title>
							<Empty.Description>Explore all repositories</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<ArrowRightIcon class="size-5 text-muted-foreground transition-all" />
						</Empty.Content>
					</Empty.Root>
				</a>
			{/if}
		</div>
	</div>
</section>
