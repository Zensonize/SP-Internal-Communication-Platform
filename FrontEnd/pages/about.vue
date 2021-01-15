<template>
  <div>
    <h1 class="aboutsection">Our Team</h1>

    <div class="row">
      <div class="column">
        <Pok />
      </div>

      <div class="column">
        <Kok />
      </div>

      <div class="column">
        <Qew />
      </div>
    </div>
  </div>
</template>

<script>
import Pok from "@/components/about/Pok.vue";
import Kok from "@/components/about/Kok.vue";
import Qew from "@/components/about/Qew.vue";

export default {
  name: "About",
  components: { Pok, Kok, Qew },
  data() {
    return {
      title: "PrivaChat - About"
    };
  },
  head() {
    return {
      title: this.title,
      meta: [
        {
          hid: "description",
          name: "description",
          content: "My custom description"
        }
      ]
    };
  }
};
</script>

<style lang="scss">

.card-subtitle {
  margin-bottom: 6px;
  margin-top: -10px;
  font-size: 12px;
  font-style: italic;
  
}

.card-title {
  font-size: 24px;
  color: #000000;
  margin-top: -10px;
}
.card-header {
  font-size: 12px;
  color: #000000;
}
.card-text {
  font-size: 16px;
  color: #000000;
  margin-top: -5px;
}

h1 {
  text-align: center;
  color: var(--color);
  padding: 5px;
}

.row {
  padding-left: 35px;
  width: 99%;
}

html {
  box-sizing: border-box;
  align-content: center;
}

*,
*:before,
*:after {
  box-sizing: inherit;
}

.column {
  float: left;
  width: 33.3%;
  margin-bottom: 8px;
  padding: 0 2px;
}

.card {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  margin: 8px;
}

.container {
  padding: 0 2px;
}

.container::after,
.row::after {
  content: "";
  clear: both;
  display: table;
}

@media screen and (max-width: 650px) {
  .column {
    width: 100%;
    display: block;
  }
}
</style>
