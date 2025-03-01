const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://47.104.215.111:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://47.104.215.111:3000',
        changeOrigin: true
      }
    }
  }
})
