const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-1 -1 16 16'%3E%3Cg fill='%2318160f'%3E%3Crect width='4' height='4' rx='1'/%3E%3Crect x='5' width='4' height='4' rx='1'/%3E%3Crect x='10' width='4' height='4' rx='1' fill='%23ff5233'/%3E%3Crect y='5' width='4' height='4' rx='1'/%3E%3Crect x='5' y='5' width='4' height='4' rx='1'/%3E%3Crect x='10' y='5' width='4' height='4' rx='1'/%3E%3Crect y='10' width='4' height='4' rx='1'/%3E%3Crect x='5' y='10' width='4' height='4' rx='1'/%3E%3Crect x='10' y='10' width='4' height='4' rx='1'/%3E%3C/g%3E%3C/svg%3E";

export default defineNuxtConfig({
  extends: ['../ui'],
  modules: ['@sentry/nuxt/module'],
  compatibilityDate: '2026-10-01',
  devServer: { port: 4100 },
  css: ['~/assets/css/motion.css'],
  runtimeConfig: {
    apiInternalUrl: '',
    public: {
      sentryDsn: '',
      sentryEnvironment: 'development',
      sentryRelease: '',
      // Nuxt's dev server doesn't proxy WebSocket upgrades, so in dev the feed connects to the API directly.
      wsUrl: process.env.NODE_ENV === 'development' ? 'ws://localhost:4200/api/ws' : '',
    },
  },
  nitro: {
    devProxy: {
      '/api': { target: 'http://localhost:4200/api', changeOrigin: true },
    },
  },
  sentry: {
    sourcemaps: { disable: true },
    telemetry: false,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'dodep.fun — открой клетку, остановись вовремя',
      meta: [
        { name: 'viewport', content: 'width=device-width,initial-scale=1,viewport-fit=cover' },
        { name: 'theme-color', content: '#efe9dd' },
      ],
      link: [{ rel: 'icon', href: FAVICON }],
    },
  },
});
