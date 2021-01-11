<template>
  <header>
    <h1>{{ mode }} Mode</h1>
    <Toggle :mode="mode" @toggle="$emit('toggle')" />
  </header>
</template>

<script>
import Toggle from '../components/Toggle'
export default {
  props: ['mode'],
  components: {
    Toggle
  }
}
</script>

<style>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 25px;
  height: 40px;
  transition: background 0.3s ease-in-out;
}
.dark header {
}
header h1 {
  font-size: 24px;
  text-transform: uppercase;
  font-weight: 500;
}
header nav {
  display: flex;
  height: 40px;
}
header nav .nav-link {
  display: flex;
  align-items: center;
  padding: 0px 15px;
}
header nav .nav-link:hover {
  background: #B0B0B0;
}
.dark header nav .nav-link:hover {
}
</style>