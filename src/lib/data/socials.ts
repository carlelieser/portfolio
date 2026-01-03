import GithubIcon from '@lucide/svelte/icons/github';
import LinkedinIcon from '@lucide/svelte/icons/linkedin';
import HeartIcon from '@lucide/svelte/icons/heart';
import type { Component } from 'svelte';

export interface Social {
	name: string;
	url: string;
	icon: Component;
}

export const socials: Social[] = [
	{ name: 'GitHub', url: 'https://github.com/carlelieser', icon: GithubIcon },
	{ name: 'LinkedIn', url: 'https://www.linkedin.com/in/carlos-santos-0574452a4', icon: LinkedinIcon },
	{ name: 'Patreon', url: 'https://patreon.com/carlelieserdev', icon: HeartIcon }
];