<template>
  <v-app>
    <v-content>
      <v-container
        fluid
        style="height: 100%"
      >
        <!-- <h1>Page not found</h1> -->
        <component :is="errorPage" :error="error" />
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import error404 from '~/components/error/404.vue';
import error500 from '~/components/error/500.vue';
export default {
  name: 'nuxt-error',
  layout: 'default', // optional
  props: {
    error: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    errorPage() {
      if (this.error.statusCode === 404) {
        return error404;
      }      // catch everything else
      return error500;
        },
    },  
};
</script>

<style>
 .error-404,.error-500 {
    font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
  'Segoe UI', Roboto, 'Helvetica Neue', Arial,'DB Lim X','Kanit', sans-serif,'Sriracha', cursive,'db_adman_xlight';
    display: block;
    /* font-weight: 300; */
    font-size: 24px;
    letter-spacing: 1px;
    text-align: center; 
    padding: 0;
    margin: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    /* display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;  */
  }
</style>