<template>
  <div class="container">
    <!-- <sidebar-menu :menu="menu" /> -->
    <div>
      <Logo />
      <h1 class="title">
        PrivaChat based on Socket IO, NuxtTS
      </h1>
      <div class="links">
        <b-button
          href="/about"
          target="_blank"
          rel="noopener noreferrer"
          class="button--green"
          variant="outline-success"          
        >
          About
        </b-button>
        <b-button
          href="/info"
          target="_blank"
          rel="noopener noreferrer"
          class="button--grey"
          variant="outline-light" 
        >
          What is Privachat?
        </b-button>
      </div>

      <ColorModePicker />
      <p>ขณะนี้เวลา : <digital-clock :blink="true" :displaySeconds="true" /></p>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import ColorModePicker from "@/components/ColorModePicker.vue";
import VueI18n from 'vue-i18n'
import DigitalClock from 'vue-digital-clock'
import moment from '@/plugins/moment.js'
import VueSidebarMenu from 'vue-sidebar-menu'
import 'vue-sidebar-menu/dist/vue-sidebar-menu.css'
Vue.use(VueSidebarMenu)
export default Vue.extend({
  name: "PrivaChat",
  components:
  {
    ColorModePicker,
    DigitalClock,
  },
  data() {
            return {
              title: "PrivaChat"
            }
        },
        head(){
          return {
            title: this.title,
            meta: [
          // hid is used as unique identifier. Do not use `vmid` for it as it will not work
          {
            hid: 'description',
            name: 'description',
            content: 'My custom description'
          }
        ]
          }
        },


})
</script>

<style>

</style>


