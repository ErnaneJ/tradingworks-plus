import { defineConfig, type Plugin } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import webExtension from 'vite-plugin-web-extension';
import { fileURLToPath, URL } from 'node:url';
import { writeFile } from 'node:fs/promises';

const REPO = 'ErnaneJ/tradingworks-plus';
const CONTRIBUTORS_OUTPUT = fileURLToPath(new URL('./src/lib/generated/contributors.json', import.meta.url));

/**
 * Fetches the repo's contributors once per build and freezes them into a
 * static JSON file, so a shipped version only ever lists whoever had
 * contributed as of that build — no runtime API call, no drift after ship.
 */
function contributorsPlugin(): Plugin {
  return {
    name: 'tradingworks-plus:contributors',
    async buildStart() {
      try {
        const response = await fetch(`https://api.github.com/repos/${REPO}/contributors`);
        if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
        const data = (await response.json()) as { login: string; avatar_url: string; html_url: string }[];
        const contributors = data.map((entry) => ({ login: entry.login, avatarUrl: entry.avatar_url, htmlUrl: entry.html_url }));
        await writeFile(CONTRIBUTORS_OUTPUT, JSON.stringify(contributors, null, 2) + '\n');
      } catch (error) {
        this.warn(`Could not refresh contributors list, keeping existing src/lib/generated/contributors.json: ${error}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    contributorsPlugin(),
    svelte({ preprocess: vitePreprocess() }),
    webExtension({
      manifest: 'src/manifest.json',
      watchFilePaths: ['src/manifest.json'],
      additionalInputs: ['src/offscreen/index.html'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
