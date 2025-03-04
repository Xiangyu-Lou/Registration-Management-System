// 用于导出数据到CSV和Excel的工具函数
import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

// 检查XLSX库是否正确加载
console.log('XLSX库版本:', XLSX.version);
console.log('XLSX库可用方法:', Object.keys(XLSX).join(', '));

/**
 * 将数据导出为Excel文件
 * @param {Array} data - 要导出的数据数组
 * @param {String} fileName - 导出的文件名（不含后缀）
 * @param {Array} headers - 要导出的列标题和对应字段名
 * @param {Object} imageData - 图片数据对象（可选）
 */
export const exportToExcel = (data, fileName, headers, imageData = null) => {
  if (!data || data.length === 0) {
    console.error('导出失败：没有数据');
    return false;
  }

  // 处理文件名
  fileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
  
  console.log('导出函数被调用，数据条数:', data.length);
  console.log('是否有图片数据:', imageData ? '是' : '否');
  if (imageData) {
    console.log('图片数据条数:', Object.keys(imageData).length);
  }
  
  // 强制使用XLSX导出Excel（不管是否有图片）
  try {
    console.log('尝试导出Excel...');
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    console.log('工作簿创建成功');
    
    // 准备数据
    let enhancedData = [];
    
    // 如果有图片数据，添加图片链接
    if (imageData && Object.keys(imageData).length > 0) {
      enhancedData = data.map((row, index) => {
        const newRow = {...row};
        
        // 检查是否有图片数据
        if (imageData[index]) {
          // 添加图片链接
          if (imageData[index][7] && imageData[index][7].url) {
            newRow['清理前照片'] = imageData[index][7].url;
          }
          if (imageData[index][8] && imageData[index][8].url) {
            newRow['清理后照片'] = imageData[index][8].url;
          }
        }
        
        return newRow;
      });
    } else {
      enhancedData = data;
    }
    
    console.log('数据准备完成，开始创建工作表');
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(enhancedData);
    
    console.log('工作表创建成功');
    
    // 设置列宽
    const colWidths = headers.map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '危险废物记录');
    console.log('工作表已添加到工作簿');
    
    // 导出Excel文件
    const excelFileName = `${fileName}_${timestamp}.xlsx`;
    console.log('准备导出Excel文件:', excelFileName);
    
    // 使用write方法导出
    console.log('使用XLSX.write方法导出...');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    console.log('Excel数据生成成功，大小:', wbout.length, '字节');
    
    // 创建Blob对象
    const blob = new Blob([wbout], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    console.log('Blob创建成功，大小:', blob.size, '字节');
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    console.log('URL创建成功:', url.substring(0, 30) + '...');
    
    const link = document.createElement('a');
    link.href = url;
    link.download = excelFileName;
    console.log('下载链接创建成功，准备触发点击');
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Excel导出成功');
    return true;
  } catch (error) {
    console.error('导出Excel失败，错误详情:', error);
    console.log('回退到CSV导出');
    // 如果Excel导出失败，回退到CSV导出
    exportToCSV(data, fileName, headers);
    return false;
  }
};

/**
 * 导出为CSV文件
 * @param {Array} data - 数据数组
 * @param {String} fileName - 文件名
 * @param {Array} headers - 表头配置
 */
export const exportToCSV = (data, fileName, headers) => {
  // 处理文件名
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
  const csvFileName = `${fileName}_${timestamp}.csv`;
  
  // 准备CSV内容
  let csvContent = '\uFEFF'; // 添加BOM以支持中文
  
  // 添加表头
  const headerRow = headers.map(h => `"${h.title}"`).join(',');
  csvContent += headerRow + '\r\n';
  
  // 添加数据行
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header.field];
      
      // 处理null和undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // 处理数字
      if (header.type === 'number' || typeof value === 'number') {
        return value;
      }
      
      // 处理字符串，特别是包含逗号、引号或换行符的字符串
      let cellValue = String(value);
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        cellValue = cellValue.replace(/"/g, '""'); // 将引号替换为两个引号
        cellValue = `"${cellValue}"`; // 用引号包裹整个值
      }
      
      return cellValue;
    }).join(',');
    
    csvContent += row + '\r\n';
  });
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', csvFileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('CSV导出成功');
};

/**
 * 将图片URL转换为Base64格式
 * @param {string} url 图片URL
 * @returns {Promise<string>} Base64格式的图片数据
 */
export const imageUrlToBase64 = async (url) => {
  console.log('开始转换图片到Base64:', url);
  
  // 确保URL有效
  if (!url || typeof url !== 'string') {
    console.error('无效的图片URL:', url);
    return null;
  }
  
  // 尝试方法1：使用fetch API
  try {
    console.log('尝试使用fetch API获取图片...');
    const response = await fetch(url, { 
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('图片获取成功，大小:', blob.size, '字节, 类型:', blob.type);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('图片转换为Base64成功，长度:', reader.result.length);
        resolve(reader.result);
      };
      reader.onerror = (e) => {
        console.error('FileReader错误:', e);
        reject(e);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('使用fetch API获取图片失败:', error);
    
    // 尝试方法2：使用Image对象
    try {
      console.log('尝试使用Image对象获取图片...');
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // 允许跨域
      
      // 等待图片加载
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => {
          console.error('图片加载错误:', e);
          reject(e);
        };
        img.src = url;
      });
      
      console.log('图片加载成功，尺寸:', img.width, 'x', img.height);
      
      // 创建canvas并绘制图片
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // 转换为base64
      const base64 = canvas.toDataURL('image/jpeg');
      console.log('图片转换为Base64成功，长度:', base64.length);
      return base64;
    } catch (error2) {
      console.error('使用Image对象获取图片也失败:', error2);
      return null;
    }
  }
};

/**
 * 准备带图片的导出数据
 * @param {Array} records 记录数据
 * @param {string} baseUrl 基础URL
 * @returns {Promise<Object>} 包含导出数据和图片数据的对象
 */
export const prepareImageExportData = async (records, baseUrl) => {
  console.log('准备图片导出数据，记录数:', records.length);
  console.log('使用的基础URL:', baseUrl);
  
  // 调试：打印第一条记录的所有字段
  if (records.length > 0) {
    console.log('第一条记录的所有字段:');
    const firstRecord = records[0];
    Object.keys(firstRecord).forEach(key => {
      console.log(`${key}: ${typeof firstRecord[key] === 'object' ? JSON.stringify(firstRecord[key]) : firstRecord[key]}`);
    });
  }
  
  const imageData = {};
  let processedCount = 0;
  let successCount = 0;
  
  // 解析照片路径的函数
  const parsePhotoPath = (path) => {
    if (!path) return [];
    
    try {
      // 尝试解析为JSON
      if (path.startsWith('[') && path.endsWith(']')) {
        return JSON.parse(path);
      }
      // 如果不是JSON格式，则将其作为单个路径返回
      return [path];
    } catch (error) {
      console.error('解析照片路径失败:', error);
      // 如果解析失败，将其作为单个路径返回
      return [path];
    }
  };
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    console.log(`处理记录 ${i+1}/${records.length}, ID: ${record.id}`);
    
    // 初始化该记录的图片数据
    imageData[i] = {};
    
    // 处理清理前照片
    if (record.photo_path_before) {
      const beforePhotoPaths = parsePhotoPath(record.photo_path_before);
      console.log(`记录 ${i+1} 清理前照片路径:`, beforePhotoPaths);
      
      if (beforePhotoPaths.length > 0) {
        const beforePhotoUrl = `${baseUrl}${beforePhotoPaths[0]}`;
        console.log(`记录 ${i+1} 清理前照片URL:`, beforePhotoUrl);
        
        try {
          const beforePhotoBase64 = await imageUrlToBase64(beforePhotoUrl);
          if (beforePhotoBase64) {
            imageData[i][7] = {
              url: beforePhotoUrl,
              base64: beforePhotoBase64
            };
            console.log(`记录 ${i+1} 清理前照片转换成功`);
            successCount++;
          } else {
            console.warn(`记录 ${i+1} 清理前照片转换失败`);
            // 仍然保留URL
            imageData[i][7] = {
              url: beforePhotoUrl
            };
          }
        } catch (error) {
          console.error(`记录 ${i+1} 清理前照片处理错误:`, error);
          // 仍然保留URL
          imageData[i][7] = {
            url: beforePhotoUrl
          };
        }
      }
    } else {
      console.log(`记录 ${i+1} 没有清理前照片`);
    }
    
    // 处理清理后照片
    if (record.photo_path_after) {
      const afterPhotoPaths = parsePhotoPath(record.photo_path_after);
      console.log(`记录 ${i+1} 清理后照片路径:`, afterPhotoPaths);
      
      if (afterPhotoPaths.length > 0) {
        const afterPhotoUrl = `${baseUrl}${afterPhotoPaths[0]}`;
        console.log(`记录 ${i+1} 清理后照片URL:`, afterPhotoUrl);
        
        try {
          const afterPhotoBase64 = await imageUrlToBase64(afterPhotoUrl);
          if (afterPhotoBase64) {
            imageData[i][8] = {
              url: afterPhotoUrl,
              base64: afterPhotoBase64
            };
            console.log(`记录 ${i+1} 清理后照片转换成功`);
            successCount++;
          } else {
            console.warn(`记录 ${i+1} 清理后照片转换失败`);
            // 仍然保留URL
            imageData[i][8] = {
              url: afterPhotoUrl
            };
          }
        } catch (error) {
          console.error(`记录 ${i+1} 清理后照片处理错误:`, error);
          // 仍然保留URL
          imageData[i][8] = {
            url: afterPhotoUrl
          };
        }
      }
    } else {
      console.log(`记录 ${i+1} 没有清理后照片`);
    }
    
    // 添加单位名称
    if (record.unit_name) {
      imageData[i].unit_name = record.unit_name;
    }
    
    processedCount++;
  }
  
  console.log(`图片数据准备完成，处理记录: ${processedCount}/${records.length}, 成功转换图片: ${successCount}`);
  return imageData;
};
