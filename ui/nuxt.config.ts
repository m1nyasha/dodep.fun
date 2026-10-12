import { fileURLToPath } from 'node:url';

const css = (file: string) => fileURLToPath(new URL(`./app/assets/css/${file}`, import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  modules: ['@nuxt/fonts', '@vueuse/nuxt', '@nuxt/eslint'],
  css: [css('tokens.css'), css('base.css')],
  runtimeConfig: {
    apiInternalUrl: '',
  },
  fonts: {
    defaults: { subsets: ['latin', 'cyrillic'] },
    families: [
      { name: 'Golos Text', provider: 'google', weights: [400, 500, 600, 700], global: true },
      { name: 'JetBrains Mono', provider: 'google', weights: [500, 600, 700], global: true },
      { name: 'Unbounded', provider: 'google', weights: [500, 600, 700], global: true },
    ],
  },
  typescript: { strict: true },
});
