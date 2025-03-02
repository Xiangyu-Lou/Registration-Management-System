const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 使用绝对路径，确保路由正常工作
  publicPath: '/',
  // 开发服务器配置
  devServer: {
    port: 8080,
    historyApiFallback: true,
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
