<template>
  <div class="container">
    <div>
      <logo />
      <h1 class="title">Hello-From-Home</h1>
      <h2 align="center" class="time">ขณะนี้เวลา <digital-clock :blink="true" :displaySeconds="true" class="digi-clock"/> </h2>
      <div class="links">
        <ColorModePicker />
        <nuxt-link to="prechat">Nuxt Chat</nuxt-link>
      </div>
    </div>
  </div>
</template>

<script>
import Logo from '~/components/Logo.vue';
import ColorModePicker from '@/components/ColorModePicker';
import DigitalClock from "vue-digital-clock";

export default {
  components: {
    Logo,ColorModePicker,DigitalClock,
  },
  head: {
    title: "Nuxt.JS",
  },

};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@200&family=Roboto:wght@300&display=swap');
@font-face {
    font-family: 'db_adman_xlight';
    src: url('~assets/fonts/db-adman-x-li-webfont.woff2') format('woff2'),
         url('~assets/fonts/db-adman-x-li-webfont.woff') format('woff'),
         url('~assets/fonts/db-adman-x.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;

}
  .links {
    padding-top: 15px;
  }
  .title {
    font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
      'Segoe UI', Roboto, 'Helvetica Neue', Arial,'DB Lim X','Kanit', sans-serif,'Sriracha', cursive,'db_adman_xlight';
    display: block;
    font-weight: 300;
    font-size: 100px;
    /* color: #35495e; */
    letter-spacing: 1px;
  }
  .container {
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 50px;
  }

  .subtitle {
    font-weight: 300;
    font-size: 36px;
    /* color: #526488; */
    word-spacing: 3px;
    padding-bottom: 15px;
  }
  .time,h2,.digi-clock{
    font-family: 'Kanit', sans-serif;
  }
 
/* Part of Index Vue */

  /* Part of Colormodepicker Vue */
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  ul li {
    display: inline-block;
    padding: 5px;
  }
  p {
    margin: 0;
    padding-top: 5px;
  }
  .feather {
    position: relative;
    top: 0px;
    cursor: pointer;
    padding: 7px;
    background-color: var(--bg-secondary);
    border: 2px solid var(--border-color);
    margin: 0;
    border-radius: 5px;
    transition: all 0.1s ease;
  }
  .feather:hover {
    top: -3px;
  }
  .feather.preferred {
    border-color: var(--color-primary);
    top: -3px;
  }
  .feather.selected {
    color: var(--color-primary);
  }
</style>

