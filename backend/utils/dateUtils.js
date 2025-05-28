// 日期格式化工具

// 将ISO格式转为MySQL格式
const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;
  
  // 处理ISO格式的日期时间字符串
  if (dateString.includes('T')) {
    return dateString.slice(0, 19).replace('T', ' ');
  }
  return dateString;
};

// 获取当前时间的MySQL格式
const getCurrentMySQLDateTime = () => {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
};

// 获取48小时前的时间
const get48HoursAgo = () => {
  const hours48Ago = new Date();
  hours48Ago.setHours(hours48Ago.getHours() - 48);
  return hours48Ago.toISOString().slice(0, 19).replace('T', ' ');
};

module.exports = {
  formatDateForMySQL,
  getCurrentMySQLDateTime,
  get48HoursAgo
}; 