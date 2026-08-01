// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
	site: 'https://docs.workora.dev',
	base: process.env.ASTRO_BASE,
	integrations: [sitemap()],
});
