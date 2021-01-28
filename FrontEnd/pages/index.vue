<template>
  <div class="container">
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
import Vue from "vue";
import ColorModePicker from "@/components/ColorModePicker.vue";
import DigitalClock from "vue-digital-clock";
import VueSidebarMenu from "vue-sidebar-menu";
import "vue-sidebar-menu/dist/vue-sidebar-menu.css";
Vue.use(VueSidebarMenu);
export default Vue.extend({
  name: "PrivaChat",
  components: {
    ColorModePicker,
    DigitalClock
  },
  data() {
    return {
      title: "PrivaChat"
    };
  },
  head() {
    return {
      title: this.title
    };
  }
});
</script>
