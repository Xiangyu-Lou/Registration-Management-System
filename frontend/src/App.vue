<template>
  <div id="app">
    <app-header v-if="showHeader" />
    <router-view />
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';

export default {
  components: {
    AppHeader
  },
  setup() {
    const route = useRoute();
    
    // 仅在非登录页面显示
    const showHeader = computed(() => {
      return route.path !== '/login';
    });
    
    return {
      showHeader
    };
  }
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
}

#app {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
