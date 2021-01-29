<template>
  <div>
    <ul>
      <li v-for="color of colors" :key="color">
        <component
          :is="`icon-${color}`"
          :class="getClasses(color)"
          @click="$colorMode.preference = color"
        />
      </li>
    </ul>
    <p>
      <ColorScheme placeholder="..." tag="span">
        {{ ("Color mode:")}}
        <b>{{ $colorMode.preference }}</b>
        <span v-if="$colorMode.preference === 'system'">
          ( <b>{{ $colorMode.value }}</b> mode detected )
        </span>
      </ColorScheme>
    </p>
  </div>
</template>

<script>
import IconSystem from "@/assets/icons/system.svg?inline";
import IconLight from "@/assets/icons/light.svg?inline";
import IconDark from "@/assets/icons/dark.svg?inline";
import Vue from "vue";

export default Vue.extend({
  components: {
    IconSystem,
    IconLight,
    IconDark,
    
    
  },
  data() {
    return {
      colors: ["system", "light", "dark"],
    };
  },
  methods: {
    getClasses(color) {
      // Does not set classes on ssr preference is system (because we know them on client-side)
      if (this.$colorMode.unknown) {
        return {};
      }
      return {
        preferred: color === this.$colorMode.preference,
        selected: color === this.$colorMode.value,
      };
    },
  },
});
</script>

