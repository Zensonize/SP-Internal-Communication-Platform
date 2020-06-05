# nuxt-chat-app

> Vue.js, Nuxt.js, Node.js (Express), Vue-Socket.IO (Socket.IO), Vuetify.js

## Build Setup

``` bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

### Additional

If you want to change IP and port number goto nuxt.config.js and add this line

```javascript
module.exports = {
  mode: 'universal',
  /*
  ** Headers of the page
  */
server: { // add this
    port: 8000, // default: 3000
    host: '192.168.1.41' // default: localhost
  },
```