const redisClient = require('../config/redisClient');

const CACHE_PREFIX = '__express__';

// 缓存响应的中间件
const cache = (duration) => {
  return (req, res, next) => {
    const key = CACHE_PREFIX + (req.originalUrl || req.url);

    redisClient.get(key, (err, cachedData) => {
      if (err) {
        console.error('Redis 读取错误:', err);
        return next(); // Redis出错时，跳过缓存继续执行
      }

      if (cachedData) {
        // 如果在缓存中找到了数据，则直接返回
        try {
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send(cachedData);
        } catch (e) {
          res.status(500).send(e);
        }
      } else {
        // 如果缓存中没有数据，则重写res.send和res.json方法以在响应时缓存结果
        const originalSend = res.send;
        const originalJson = res.json;

        const cacheResponse = (body) => {
          // 只缓存成功的GET请求
          if (req.method === 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
            redisClient.setex(key, duration, body, (setErr) => {
              if (setErr) {
                console.error('Redis 缓存设置错误:', setErr);
              }
            });
          }
        };

        res.send = function (body) {
          cacheResponse(body);
          originalSend.apply(res, arguments);
        };

        res.json = function (body) {
          // res.json会调用res.send，所以我们只需要处理body即可
          const bodyString = JSON.stringify(body);
          cacheResponse(bodyString);
          originalJson.apply(res, arguments);
        };

        next();
      }
    });
  };
};

// 清除缓存的中间件
const clearCache = (prefix) => {
  return (req, res, next) => {
    const pattern = CACHE_PREFIX + prefix + '*';
    const stream = redisClient.scanStream({
      match: pattern,
    });
    
    const keysToDelete = [];
    stream.on('data', (keys) => {
        if (keys.length) {
            keys.forEach(key => keysToDelete.push(key));
        }
    });

    stream.on('end', () => {
        if (keysToDelete.length > 0) {
            redisClient.del(keysToDelete, (err, count) => {
                if (err) {
                    console.error('清除缓存错误:', err);
                } else {
                    console.log(`成功清除了 ${count} 个缓存:`, keysToDelete);
                }
            });
        }
        next();
    });

    stream.on('error', (err) => {
        console.error('扫描缓存键时出错:', err);
        next();
    });
  };
};

module.exports = { cache, clearCache };
