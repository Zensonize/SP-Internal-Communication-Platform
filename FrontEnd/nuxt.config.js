export default {
  target: 'static',
  server: {
    port: 8000,
    host: "0.0.0.0"
  },
  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: "MaChat",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" }
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/privachat.ico" }]
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: ["@/assets/main.css"],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    "@nuxt/typescript-build",
    "@nuxtjs/color-mode",
    "nuxt-compress"
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    "bootstrap-vue/nuxt",
    // https://go.nuxtjs.dev/pwa
    "@nuxtjs/pwa",
    "@nuxtjs/svg",
    "@nuxtjs/proxy",
    'nuxt-lazy-load',
    [
      'nuxt-netlify-http2-server-push',
      {
        // Specify relative path to the dist directory and its content type
        resources: [
          { path: '**/*.js', as: 'script' },
          { path: '**/*.jpg', as: 'image' },
          { path: '**/*.png', as: 'image' },
          { path: '**/*.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
          { path: '**/*.woff', as: 'font', type: 'font/woff', crossorigin: 'anonymous' },
          { path: '**/*.ttf', as: 'font', type: 'font/ttf', crossorigin: 'anonymous' },
        ]
      }
    ]
  ],
  "nuxt-compress": {
    gzip: {
      cache: true
    },
    brotli: {
      threshold: 10240
    }
  },
  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {},
  colorMode: {
    preference: "system", // default value of $colorMode.preference
    fallback: "light", // fallback value if not system preference found
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    classSuffix: "-mode",
    storageKey: "nuxt-color-mode"
  },
  pwa: {
    icons:[{
      src:"./static/icon.png",
      size:"144x144",
      type:"image/png"
    },{
      src:"./static/icon.png",
      size:"128x128",
      type:"image/png"
    }
  ],
    meta: {},
    workbox: {
      // Offline
      offline: true,
      offlineStrategy: "NetworkFirst",
      offlinePage: null,
      offlineAssets: [],
      // Precache
      preCaching: [],
      cacheOptions: {
        cacheId: undefined,
        directoryIndex: "/",
        revision: undefined
      },
      cachingExtensions: [],
      cleanupOutdatedCaches: true
    }
  },
  manifest: {
    name: "PrivaChat Application",
    short_name: "PrivaChat",
    lang: "en",
    display: "standalone"
  },
  
  render:{
    http2: {
      push: true, pushAssets: null
    }
  },
};
