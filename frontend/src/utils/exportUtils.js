// 用于导出数据到CSV和Excel的工具函数
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { parsePhotoPath, generateTimestampedFileName, sanitizeFileName } from './commonUtils';
// import { saveAs } from 'file-saver';

// 检查XLSX库是否正确加载
console.log('XLSX库版本:', XLSX.version);
console.log('XLSX库可用方法:', Object.keys(XLSX).join(', '));

/**
 * 从服务器获取图片并作为ArrayBuffer返回
 * @param {String} imageUrl - 图片的URL地址
 * @param {String} baseUrl - 基础URL，默认为当前域名
 * @returns {Promise<ArrayBuffer>} 图片的ArrayBuffer数据
 */
const fetchImageAsBuffer = async (imageUrl, baseUrl = window.location.origin) => {
  console.log('获取图片:', imageUrl);
  
  if (!imageUrl) {
    console.error('图片URL为空');
    return null;
  }
  
  // 如果是相对路径，添加baseUrl
  const fullUrl = imageUrl.startsWith('/') 
    ? `${baseUrl}${imageUrl}` 
    : imageUrl;
  
  try {
    console.log('获取图片:', fullUrl);
    const response = await fetch(fullUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`获取图片失败: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('图片获取成功，大小:', arrayBuffer.byteLength, '字节');
    return arrayBuffer;
  } catch (error) {
    console.error('获取图片失败:', error);
    return null;
  }
};

/**
 * 导出数据到Excel（支持图片），使用ExcelJS库
 * @param {Array} data - 要导出的数据数组
 * @param {String} fileName - 导出的文件名（不含扩展名）
 * @param {Array} headers - 要导出的列标题和对应字段名
 * @param {String} baseUrl - 基础URL，用于构建完整的图片路径
 * @param {Function} onProgress - 进度回调函数，参数为(当前进度, 总数)
 */
export const exportToExcelWithImages = async (data, fileName, headers, baseUrl = window.location.origin, onProgress = null) => {
  console.log('=== exportToExcelWithImages 函数被调用 ===');
  console.log('数据条数:', data.length);
  
  if (!data || data.length === 0) {
    console.error('导出失败：没有数据');
    return false;
  }

  try {
    // 处理文件名
    const cleanFileName = sanitizeFileName(fileName);
    const fullFileName = generateTimestampedFileName(cleanFileName, 'xlsx');
    
    // 创建新工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '固体废物管理系统';
    workbook.lastModifiedBy = '固体废物管理系统';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // 添加工作表
    const worksheet = workbook.addWorksheet('固体废物记录');
    
    // 设置列
    const columns = headers.map(header => ({
      header: header.text,
      key: header.field,
      width: header.isImage ? 20 : 15
    }));
    worksheet.columns = columns;
    
    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // 添加数据行并处理图片
    console.log('开始处理数据行...');
    
    // 计算总处理项数（每行加一个基本数据项和可能的图片项）
    const totalItems = data.length * (1 + headers.filter(h => h.isImage).length);
    let currentItem = 0;
    
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      
      console.log(`处理第 ${rowIndex + 1}/${data.length} 条记录...`);
      
      // 首先添加行基本数据
      const rowData = {};
      headers.forEach(header => {
        if (!header.isImage) {
          rowData[header.field] = row[header.field] || '';
        }
      });
      
      // 添加行数据
      const excelRow = worksheet.addRow(rowData);
      
      // 设置行高
      excelRow.height = 80; // 设置足够的高度显示图片
      
      // 更新进度
      currentItem++;
      if (onProgress && typeof onProgress === 'function') {
        onProgress(currentItem, totalItems);
      }
      
      // 处理图片字段
      for (const header of headers) {
        if (header.isImage) {
          const fieldName = header.field;
          const imagePath = row[fieldName]; // 直接从导出数据中获取图片路径
          
          if (imagePath) {
            console.log(`记录 ${rowIndex + 1} 的 ${fieldName} 字段有图片路径: ${imagePath}`);
            
            // 获取图片
            try {
              const imageBuffer = await fetchImageAsBuffer(imagePath, baseUrl);
              
              if (imageBuffer) {
                // 找到这个字段在列中的位置
                const colIndex = headers.findIndex(h => h.field === fieldName) + 1;
                
                // 获取单元格位置
                const cellRef = worksheet.getCell(rowIndex + 2, colIndex).address;
                
                // 添加图片到工作表
                const imageId = workbook.addImage({
                  buffer: imageBuffer,
                  extension: imagePath.split('.').pop().toLowerCase()
                });
                
                // 将图片添加到单元格
                worksheet.addImage(imageId, {
                  tl: { col: colIndex - 1, row: rowIndex + 1 },
                  br: { col: colIndex, row: rowIndex + 1.9 },
                  editAs: 'oneCell'
                });
                
                console.log(`已添加图片到单元格 ${cellRef}`);
              } else {
                console.error(`获取图片失败: ${imagePath}`);
              }
            } catch (imageError) {
              console.error(`处理图片时出错:`, imageError);
            }
          } else {
            console.log(`记录 ${rowIndex + 1} 的 ${fieldName} 没有照片路径`);
          }
          
          // 更新进度
          currentItem++;
          if (onProgress && typeof onProgress === 'function') {
            onProgress(currentItem, totalItems);
          }
        }
      }
    }
    
    console.log('数据行处理完成，准备生成Excel文件...');
    
    // 生成Excel文件并下载
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFileName;
    link.click();
    
    // 清理
    window.URL.revokeObjectURL(url);
    
    console.log('Excel文件生成并下载成功');
    return true;
  } catch (error) {
    console.error('导出Excel文件失败:', error);
    return false;
  }
};

/**
 * 将数据导出为Excel文件(不包含图片)
 * @param {Array} data - 要导出的数据数组
 * @param {String} fileName - 导出的文件名（不含后缀）
 * @param {Array} headers - 要导出的列标题和对应字段名
 */
export const exportToExcel = async (data, fileName, headers) => {
  if (!data || data.length === 0) {
    console.error('导出失败：没有数据');
    return false;
  }

  // 处理文件名
  const cleanFileName = sanitizeFileName(fileName);
  const fullFileName = generateTimestampedFileName(cleanFileName, 'xlsx');
  
  console.log('导出函数被调用，数据条数:', data.length);
  
  try {
    console.log('使用ExcelJS导出Excel...');
    
    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '固体废物管理系统';
    workbook.lastModifiedBy = '固体废物管理系统';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // 添加工作表
    const worksheet = workbook.addWorksheet('固体废物记录');
    
    // 设置列
    const columns = headers.map(header => ({
      header: header.text,
      key: header.field,
      width: 15
    }));
    worksheet.columns = columns;
    
    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // 添加数据行
    data.forEach(row => {
      const rowData = {};
      headers.forEach(header => {
        rowData[header.field] = row[header.field] || '';
      });
      worksheet.addRow(rowData);
    });
    
    // 导出工作簿
    console.log('生成Excel数据...');
    const buffer = await workbook.xlsx.writeBuffer();
    
    // 创建Blob对象并下载
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fullFileName;
    console.log('下载链接创建成功，准备触发点击');
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
  const cleanFileName = sanitizeFileName(fileName);
  const csvFileName = generateTimestampedFileName(cleanFileName, 'csv');
  
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
 * 准备图片导出数据，为每个记录获取图片
 * @param {Array} records - 记录数组
 * @param {String} baseUrl - 基础URL
 * @returns {Object} 包含图片arrayBuffer的对象
 */
export const prepareImageExportData = async (records, baseUrl = window.location.origin) => {
  const imageData = {};
  
  try {
    console.log('准备图片数据，记录数:', records.length);
    console.log('基础URL:', baseUrl);
    
    // 处理每条记录的图片
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      imageData[index] = {
        beforeImage: null,
        afterImage: null
      };
      
      // 处理清理前照片
      if (record.photo_path_before) {
        const photoPaths = parsePhotoPath(record.photo_path_before);
        if (photoPaths.length > 0) {
          const firstPhotoPath = photoPaths[0];
          try {
            const imageBuffer = await fetchImageAsBuffer(firstPhotoPath, baseUrl);
            if (imageBuffer) {
              imageData[index].beforeImage = {
                buffer: imageBuffer,
                extension: firstPhotoPath.split('.').pop().toLowerCase(),
                path: firstPhotoPath
              };
              console.log(`记录 ${index} 清理前照片获取成功`);
            }
          } catch (error) {
            console.error(`获取清理前照片失败:`, error);
          }
        }
      }
      
      // 处理清理后照片
      if (record.photo_path_after) {
        const photoPaths = parsePhotoPath(record.photo_path_after);
        if (photoPaths.length > 0) {
          const firstPhotoPath = photoPaths[0];
          try {
            const imageBuffer = await fetchImageAsBuffer(firstPhotoPath, baseUrl);
            if (imageBuffer) {
              imageData[index].afterImage = {
                buffer: imageBuffer,
                extension: firstPhotoPath.split('.').pop().toLowerCase(),
                path: firstPhotoPath
              };
              console.log(`记录 ${index} 清理后照片获取成功`);
            }
          } catch (error) {
            console.error(`获取清理后照片失败:`, error);
          }
        }
      }
      
      console.log(`已处理 ${index + 1}/${records.length} 条记录`);
    }
    
    return imageData;
  } catch (error) {
    console.error('准备图片数据时出错:', error);
    return {};
  }
};
