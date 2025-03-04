// 用于导出数据到CSV的工具函数

/**
 * 将数据导出为CSV文件
 * @param {Array} data - 要导出的数据数组
 * @param {String} fileName - 导出的文件名（不含后缀）
 * @param {Array} headers - 要导出的列标题和对应字段名
 */
export const exportToExcel = (data, fileName, headers) => {
  // 如果没有数据，直接返回
  if (!data || data.length === 0) {
    return;
  }

  // 处理文件名
  const safeFileName = fileName || '导出数据';
  const fileNameWithExtension = `${safeFileName}_${new Date().toISOString().slice(0, 10)}.csv`;

  // 准备CSV内容
  let csvContent = '\uFEFF'; // 添加BOM，确保Excel正确识别中文
  
  // 添加表头行
  const headerRow = headers.map(header => header.title).join(',');
  csvContent += headerRow + '\n';

  // 添加数据行
  data.forEach(item => {
    const row = headers.map(header => {
      let value = item[header.field];
      
      // 处理null和undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // 处理数字
      if (header.type === 'number') {
        // 对于数字类型，保留3位小数
        return typeof value === 'number' ? value.toFixed(3) : parseFloat(value).toFixed(3);
      }
      
      // 处理字符串，确保带逗号的字符串被引号包围
      value = String(value);
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
    
    csvContent += row + '\n';
  });

  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // 使用URL.createObjectURL创建下载URL
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileNameWithExtension);
  link.style.visibility = 'hidden';
  
  // 添加到文档并触发点击
  document.body.appendChild(link);
  link.click();
  
  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
