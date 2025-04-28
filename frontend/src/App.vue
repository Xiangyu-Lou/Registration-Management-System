<template>
  <div id="app">
    <app-header v-if="showHeader" />
    <router-view />
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
import { ElMessageBox } from 'element-plus';

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
    
    // 应用版本号，每次更新时要手动修改
    const APP_VERSION = '1.0.0';
    const VERSION_KEY = 'app_version';

    onMounted(() => {
      // 检查版本，确保用户使用最新版本
      const storedVersion = localStorage.getItem(VERSION_KEY);
      
      if (storedVersion && storedVersion !== APP_VERSION) {
        // 如果版本不匹配，提示用户刷新页面
        ElMessageBox.confirm(
          '应用有新的更新，需要刷新页面以获取最新功能。',
          '版本更新',
          {
            confirmButtonText: '立即刷新',
            cancelButtonText: '稍后再说',
            type: 'warning',
          }
        )
          .then(() => {
            // 清除缓存并强制刷新页面
            localStorage.setItem(VERSION_KEY, APP_VERSION);
            window.location.reload(true);
          })
          .catch(() => {
            // 用户选择稍后再说，仍然更新版本号
            localStorage.setItem(VERSION_KEY, APP_VERSION);
          });
      } else {
        // 保存当前版本号
        localStorage.setItem(VERSION_KEY, APP_VERSION);
      }
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
