const OSS = require('ali-oss');

let _ossClient = null;

// 延迟初始化 OSS 客户端，避免环境变量缺失时导致启动崩溃
const getOssClient = () => {
  if (!_ossClient) {
    _ossClient = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
      endpoint: process.env.OSS_ENDPOINT,
      secure: true
    });
  }
  return _ossClient;
};

// 根据 object key 生成完整的 OSS URL
const getOssUrl = (objectKey) => {
  const bucket = process.env.OSS_BUCKET;
  const endpoint = process.env.OSS_ENDPOINT.replace('https://', '');
  return `https://${bucket}.${endpoint}/${objectKey}`;
};

module.exports = { getOssClient, getOssUrl };
