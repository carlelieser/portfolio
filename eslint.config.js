import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettier from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	{
		files: ['**/*.ts', '**/*.js'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module'
			},
			globals: {
				console: 'readonly',
				Buffer: 'readonly',
				URL: 'readonly',
				HTMLElement: 'readonly',
				HTMLDivElement: 'readonly',
				HTMLParagraphElement: 'readonly',
				NodeJS: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				process: 'readonly',
				fetch: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': ts
		},
		rules: {
			...ts.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tsParser
			},
			globals: {
				console: 'readonly',
				Buffer: 'readonly',
				URL: 'readonly',
				HTMLElement: 'readonly',
				HTMLDivElement: 'readonly',
				HTMLParagraphElement: 'readonly',
				NodeJS: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				process: 'readonly',
				fetch: 'readonly',
				window: 'readonly',
				document: 'readonly',
				IntersectionObserver: 'readonly',
				MediaQueryListEvent: 'readonly',
				requestAnimationFrame: 'readonly',
				cancelAnimationFrame: 'readonly'
			}
		},
		plugins: {
			svelte
		},
		rules: {
			...svelte.configs.recommended.rules
		}
	},
	prettier,
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'node_modules/']
	}
];
