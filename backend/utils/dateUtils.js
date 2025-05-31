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
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
  
  // 格式化为 MySQL 可识别的格式 (YYYY-MM-DD HH:mm:ss)
  return formatDateTimeForMySQL(fortyEightHoursAgo);
};

// 格式化日期时间为 MySQL 格式
const formatDateTimeForMySQL = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 解析前端传来的日期和时间字符串，组合成 MySQL 格式
const parseCollectionTime = (collectionDate, collectionTime) => {
  if (!collectionDate || !collectionTime) return null;
  
  // 组合日期和时间
  const dateTimeString = `${collectionDate} ${collectionTime}:00`;
  
  // 验证格式是否正确
  const dateTime = new Date(dateTimeString);
  if (isNaN(dateTime.getTime())) {
    console.warn('无效的日期时间格式:', dateTimeString);
    return null;
  }
  
  return dateTimeString;
};

// 格式化时间字符串为前端显示格式
const formatTimeForDisplay = (timeString) => {
  if (!timeString) return { date: '', time: '' };
  
  // 如果是 YYYY-MM-DD HH:mm:ss 格式
  if (timeString.includes(' ')) {
    const [datePart, timePart] = timeString.split(' ');
    return {
      date: datePart,
      time: timePart.substring(0, 5) // 只取HH:mm部分
    };
  }
  
  // 如果只是日期格式
  return {
    date: timeString.substring(0, 10),
    time: ''
  };
};

module.exports = {
  formatDateForMySQL,
  getCurrentMySQLDateTime,
  get48HoursAgo,
  formatDateTimeForMySQL,
  parseCollectionTime,
  formatTimeForDisplay
}; 