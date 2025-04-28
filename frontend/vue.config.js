const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 使用绝对路径，确保路由正常工作
  publicPath: '/',
  // 开发服务器配置
  devServer: {
    port: 8080,
    historyApiFallback: true,
    // 配置WebSocket使用相对路径
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws'
    },
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
    },
    // 添加哈希值到文件名，强制浏览器重新加载资源
    output: {
      filename: 'js/[name].[contenthash:8].js',
      chunkFilename: 'js/[name].[contenthash:8].js'
    }
  },
  // 添加HTML配置，禁用长期缓存
  chainWebpack: config => {
    // 添加响应头，防止浏览器缓存HTML文件
    config.plugin('html').tap(args => {
      args[0].meta = {
        'Cache-Control': { 
          'http-equiv': 'Cache-Control',
          'content': 'no-cache, no-store, must-revalidate'
        },
        'Pragma': { 
          'http-equiv': 'Pragma',
          'content': 'no-cache' 
        },
        'Expires': { 
          'http-equiv': 'Expires',
          'content': '0'
        }
      };
      return args;
    });
  }
})
