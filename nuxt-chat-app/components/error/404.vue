<template>
  <div class="error-404">
      <logo />
    <h1>Uh oh, like this page will disappear</h1>
    <p>Check the link first to see if it is correctly put or not.</p>
    <div>
        <nuxt-link to="/">Home</nuxt-link>
    </div>
     
  </div>
</template>
<script>

import Logo from '~/components/Logo.vue'

export default {
  name: 'error-404',
  props: {
    error: {
      type: Object,
      default: () => {},
    },
  },
  components: { Logo

  }
};
</script>
