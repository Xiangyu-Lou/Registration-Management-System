const OSS = require('ali-oss');

let _ossClient = null;

// 延迟初始化 OSS 客户端，避免环境变量缺失时导致启动崩溃
const getOssClient = () => {
  if (!_ossClient) {
    _ossClient = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET
    });
  }
  return _ossClient;
};

// 根据 object key 生成完整的 OSS URL（用于存储，不含签名）
const getOssUrl = (objectKey) => {
  const bucket = process.env.OSS_BUCKET;
  const region = process.env.OSS_REGION;
  return `https://${bucket}.${region}.aliyuncs.com/${objectKey}`;
};

// 生成签名 URL（私有 Bucket 访问用，默认 1 小时过期）
const getSignedUrl = (objectKey, expires = 3600) => {
  try {
    return getOssClient().signatureUrl(objectKey, { expires });
  } catch (err) {
    console.error('生成签名URL失败:', err.message);
    return null;
  }
};

// 将存储的 OSS URL 转换为签名 URL
// 支持完整 URL 或 object key
const toSignedUrl = (storedUrl, expires = 3600) => {
  if (!storedUrl) return storedUrl;

  // 从完整 URL 中提取 object key
  let objectKey = storedUrl;
  const ossUrlPattern = /https?:\/\/[^/]+\/(.+)/;
  const match = storedUrl.match(ossUrlPattern);
  if (match) {
    objectKey = match[1];
  }

  return getSignedUrl(objectKey, expires);
};

// 批量转换 JSON 格式的照片路径为签名 URL
const signPhotoUrls = (photoPathJson, expires = 3600) => {
  if (!photoPathJson) return photoPathJson;

  try {
    let paths = JSON.parse(photoPathJson);
    const signedPaths = paths.map(p => {
      // 只处理 OSS URL，跳过旧的本地路径
      if (p.startsWith('http')) {
        return toSignedUrl(p, expires);
      }
      return p;
    });
    return JSON.stringify(signedPaths);
  } catch (e) {
    return photoPathJson;
  }
};

module.exports = { getOssClient, getOssUrl, getSignedUrl, toSignedUrl, signPhotoUrls };
