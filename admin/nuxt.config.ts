export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  extends: ['../ui'],
  ssr: false,
  devServer: { port: 4300 },
  app: {
    head: {
      title: 'dodep.fun — панель автора',
      htmlAttrs: { lang: 'ru' },
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
    },
  },
  runtimeConfig: { public: { siteUrl: 'http://localhost:4100' } },
  nitro: { devProxy: { '/api': { target: 'http://localhost:4200/api', changeOrigin: true } } },
  typescript: { strict: true },
});
