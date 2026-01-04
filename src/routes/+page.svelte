<script lang="ts">
	import Hero from '$lib/components/sections/Hero.svelte';
	import Projects from '$lib/components/sections/Projects.svelte';
	import Contact from '$lib/components/sections/Contact.svelte';
	import Patreon from '$lib/components/sections/Patreon.svelte';
	import Footer from '$lib/components/sections/Footer.svelte';
</script>

<svelte:head>
	<title>Carlos Santos | Full-Stack Software Engineer</title>
	<meta
		name="description"
		content="A home for my projects and a way to connect."
	/>
</svelte:head>

<main>
	<Hero />
	<Projects />
	<Contact />
	<Patreon />
</main>
<Footer />
