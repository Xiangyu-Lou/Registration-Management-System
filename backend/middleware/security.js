const xss = require('xss');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// 创建DOMPurify实例
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * XSS防护中间件 - 清理用户输入
 */
const xssProtection = (req, res, next) => {
  try {
    // 递归清理对象中的字符串值
    const sanitizeObject = (obj) => {
      if (typeof obj === 'string') {
        // 使用DOMPurify进行深度清理
        const cleaned = DOMPurify.sanitize(obj, {
          ALLOWED_TAGS: [], // 不允许任何HTML标签
          ALLOWED_ATTR: []  // 不允许任何属性
        });
        // 再用xss库进行二次清理
        return xss(cleaned, {
          whiteList: {}, // 空白名单，不允许任何HTML
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script'],
          onIgnoreTagAttr: () => ''
        });
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }
      return obj;
    };

    // 清理请求体
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // 清理查询参数
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // 清理路径参数
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('XSS防护中间件错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '输入数据处理失败' 
    });
  }
};

/**
 * 输入长度限制中间件
 */
const inputLimits = (req, res, next) => {
  const MAX_STRING_LENGTH = 10000; // 最大字符串长度
  const MAX_OBJECT_DEPTH = 10; // 最大对象嵌套深度

  const checkLimits = (obj, depth = 0) => {
    if (depth > MAX_OBJECT_DEPTH) {
      throw new Error('数据结构过于复杂');
    }

    if (typeof obj === 'string' && obj.length > MAX_STRING_LENGTH) {
      throw new Error('输入内容过长');
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => checkLimits(item, depth + 1));
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => checkLimits(value, depth + 1));
    }
  };

  try {
    if (req.body) checkLimits(req.body);
    if (req.query) checkLimits(req.query);
    if (req.params) checkLimits(req.params);
    next();
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * SQL注入防护 - 检测可能的SQL注入模式
 */
const sqlInjectionProtection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|\||&)/,
    /(\b(OR|AND)\s+\w+\s*=\s*\w+)/i,
    /(WAITFOR\s+DELAY)/i,
    /(BENCHMARK\s*\()/i
  ];

  const checkForSqlInjection = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const scanObject = (obj) => {
    if (typeof obj === 'string') {
      return checkForSqlInjection(obj);
    } else if (Array.isArray(obj)) {
      return obj.some(scanObject);
    } else if (obj && typeof obj === 'object') {
      return Object.values(obj).some(scanObject);
    }
    return false;
  };

  try {
    let suspicious = false;
    
    if (req.body && scanObject(req.body)) suspicious = true;
    if (req.query && scanObject(req.query)) suspicious = true;
    if (req.params && scanObject(req.params)) suspicious = true;

    if (suspicious) {
      console.warn('检测到可疑的SQL注入尝试:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query
      });
      
      return res.status(400).json({ 
        success: false, 
        message: '输入包含不安全的内容' 
      });
    }

    next();
  } catch (error) {
    console.error('SQL注入防护错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '安全检查失败' 
    });
  }
};

module.exports = {
  xssProtection,
  inputLimits,
  sqlInjectionProtection
}; 