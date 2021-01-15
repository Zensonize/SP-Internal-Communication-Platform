import { static } from "express";

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
    "@nuxtjs/color-mode"
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    "bootstrap-vue/nuxt",
    // https://go.nuxtjs.dev/pwa
    "@nuxtjs/pwa",
    "@nuxtjs/svg",
    "@nuxtjs/axios",
    "@nuxtjs/proxy"
  ],

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
    },{
      src:"./static/icon.png",
      size:"152x152",
      type:"image/png"
    },{
      src:"./static/icon.png",
      size:"180x180",
      type:"image/png"
    },{
      src:"./static/icon.png",
      size:"192x192",
      type:"image/png"
    },{
      src:"./static/icon.png",
      size:"256x256",
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
  axios: {
    baseURL: "http://0.0.0.0:8000",
    proxy: true,
    Headers: {
      common: {
        Accept: "application/json, text/plain, */*"
      },
      get: {},
      post: {}
    }
  },
  publicRuntimeConfig: {
    axios: {
      browserBaseURL: process.env.BROWSER_BASE_URL
    }
  },

  privateRuntimeConfig: {
    axios: {
      baseURL: process.env.BASE_URL
    }
  }
};
