<script lang="ts">
	import Hero from '$lib/components/sections/Hero.svelte';
	import About from '$lib/components/sections/About.svelte';
	import Projects from '$lib/components/sections/Projects.svelte';
	import Contact from '$lib/components/sections/Contact.svelte';
</script>

<svelte:head>
	<title>Carlos Santos | Software Developer & Tinkerer</title>
	<meta
		name="description"
		content="A home for my projects and a way to connect."
	/>
</svelte:head>

<main class="scroll-smooth">
	<Hero />
	<About />
	<Projects />
	<Contact />
</main>
