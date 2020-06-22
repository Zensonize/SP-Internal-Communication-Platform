<template>
  <nav
    class="top-navbar flex flex-row align-center p-2 fixed w-full"
    style="z-index: 9001;"
  >
    <!-- Logo Brand -->
    <div class="flex-grow">
      <router-link :to="{ name: 'index' }">
        <Logo />
      </router-link>
    </div>
    <!-- /Logo Brand -->

    <!-- Menu Button -->
    <button class="p-4" @click="toggle">
      <font-awesome-icon :icon="['fas', 'bars']" size="lg" />
    </button>
  </nav>
</template>
<script>
import Logo from '~/components/Logo.vue';
export default {
    components :{
        Logo,
    },
};
</script>