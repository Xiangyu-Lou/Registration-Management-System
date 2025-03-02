const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 将打包后的资源指向相对路径
  publicPath: './',
  // 开发服务器配置
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  // 生产环境配置
  configureWebpack: {
    // 优化生产环境体积
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    }
  }
})
