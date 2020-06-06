<template>
  <div class="error-500">
      <logo />
    <h1>Uh oh, like this page will disappear</h1>
    <p>Check the link first to see if it is correctly put or not.</p>
   <nuxt-link to="/">{{ $t('Home') }}</nuxt-link>
  </div>
</template>
<script>
import Logo from '~/components/Logo.vue'

export default {
    
  name: 'error-500',
  props: {
    error: {
      type: Object,
      default: () => {},
    },
  },
  components: {
      Logo
  }
};
</script>
