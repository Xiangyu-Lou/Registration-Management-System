const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '废物管理系统 API 文档',
      version: '1.0.0',
      description: '这是为废物管理系统后端提供的交互式API文档，基于Swagger。',
      contact: {
        name: '开发团队',
        // url: 'http://www.example.com', // 可选：项目主页
        // email: 'dev@example.com',    // 可选：联系邮箱
      },
    },
    servers: [
      {
        url: '/api',
        description: '开发服务器',
      },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT', // 小写jwt或大写JWT均可
            }
        }
    },
    security: [{
        bearerAuth: []
    }]
  },
  // 指定包含API定义的路由文件
  apis: ['./routes/*.js'], 
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { 
      explorer: true,
      // 可选：自定义UI
      // customCss: '.swagger-ui .topbar { display: none }',
      // customSiteTitle: "我的API文档"
  }));
  console.log('📚 Swagger API 文档已在 /api-docs 路径下可用');
};
