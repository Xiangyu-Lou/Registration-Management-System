// 用于导出数据到CSV和Excel的工具函数
import * as XLSX from 'xlsx';
import Table2Excel from 'js-table2excel';
// import { saveAs } from 'file-saver';

// 检查XLSX库是否正确加载
console.log('XLSX库版本:', XLSX.version);
console.log('XLSX库可用方法:', Object.keys(XLSX).join(', '));

// 解析照片路径
const parsePhotoPath = (path) => {
  console.log('解析照片路径:', path);
  
  if (!path) {
    console.log('照片路径为空');
    return [];
  }
  
  // 如果path已经是数组，直接返回
  if (Array.isArray(path)) {
    console.log('照片路径已经是数组:', path);
    return path;
  }
  
  try {
    // 尝试解析为JSON
    if (typeof path === 'string' && path.startsWith('[') && path.endsWith(']')) {
      console.log('尝试将照片路径解析为JSON');
      const parsed = JSON.parse(path);
      console.log('JSON解析结果:', parsed);
      
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        console.error('JSON解析结果不是数组:', parsed);
        return [path]; // 如果解析结果不是数组，则将原始路径作为单个元素返回
      }
    }
    
    // 如果不是JSON格式，则将其作为单个路径返回
    console.log('照片路径不是JSON格式，作为单个路径返回');
    return [path];
  } catch (error) {
    console.error('解析照片路径失败:', error);
    console.error('错误详情:', error.message);
    // 如果解析失败，则将原始路径作为单个元素返回
    return [path];
  }
};

// 将图片URL转换为Base64
const imageUrlToBase64 = (url) => {
  console.log('开始转换图片URL到Base64:', url);
  
  // 检查URL是否有效
  if (!url || typeof url !== 'string') {
    console.error('无效的图片URL:', url);
    return Promise.reject(new Error('Invalid image URL'));
  }
  
  // 检查URL是否为相对路径，如果是，添加origin
  let fullUrl = url;
  if (url.startsWith('/')) {
    fullUrl = window.location.origin + url;
    console.log('转换为完整URL:', fullUrl);
  }
  
  // 添加时间戳参数，避免缓存问题
  const timestamp = new Date().getTime();
  fullUrl = fullUrl.includes('?') 
    ? `${fullUrl}&_t=${timestamp}` 
    : `${fullUrl}?_t=${timestamp}`;
  console.log('添加时间戳后的URL:', fullUrl);
  
  return new Promise((resolve, reject) => {
    // 尝试直接使用fetch API获取图片，可以更好地处理跨域问题
    console.log('使用fetch API获取图片:', fullUrl);
    
    fetch(fullUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        console.log('图片获取成功，大小:', blob.size, '字节');
        console.log('图片类型:', blob.type);
        
        const reader = new FileReader();
        reader.onload = () => {
          const base64data = reader.result;
          console.log('图片转换为Base64成功，长度:', base64data.length);
          resolve(base64data);
        };
        reader.onerror = (error) => {
          console.error('图片转换为Base64失败:', error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('获取图片失败，尝试使用Image对象:', error);
        
        // 如果fetch失败，回退到使用Image对象
        const img = new Image();
        img.crossOrigin = 'anonymous'; // 尝试解决跨域问题
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            console.log('图片尺寸:', img.width, 'x', img.height);
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // 尝试不同的格式
            let base64data;
            try {
              base64data = canvas.toDataURL('image/jpeg', 0.8);
              console.log('JPEG格式转换成功');
            } catch (jpegError) {
              console.error('JPEG格式转换失败，尝试PNG:', jpegError);
              try {
                base64data = canvas.toDataURL('image/png');
                console.log('PNG格式转换成功');
              } catch (pngError) {
                console.error('PNG格式也转换失败:', pngError);
                throw pngError;
              }
            }
            
            console.log('图片转换为Base64成功，长度:', base64data.length);
            resolve(base64data);
          } catch (canvasError) {
            console.error('Canvas处理图片失败:', canvasError);
            reject(canvasError);
          }
        };
        
        img.onerror = (imgError) => {
          console.error('图片加载失败:', imgError);
          console.error('URL:', fullUrl);
          reject(new Error(`Failed to load image: ${imgError}`));
        };
        
        // 设置超时
        const timeout = setTimeout(() => {
          console.error('图片加载超时');
          img.src = ''; // 取消加载
          reject(new Error('Image loading timeout'));
        }, 10000); // 10秒超时
        
        img.onload = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            console.log('图片尺寸:', img.width, 'x', img.height);
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // 尝试不同的格式
            let base64data;
            try {
              base64data = canvas.toDataURL('image/jpeg', 0.8);
              console.log('JPEG格式转换成功');
            } catch (jpegError) {
              console.error('JPEG格式转换失败，尝试PNG:', jpegError);
              try {
                base64data = canvas.toDataURL('image/png');
                console.log('PNG格式转换成功');
              } catch (pngError) {
                console.error('PNG格式也转换失败:', pngError);
                throw pngError;
              }
            }
            
            console.log('图片转换为Base64成功，长度:', base64data.length);
            resolve(base64data);
          } catch (canvasError) {
            console.error('Canvas处理图片失败:', canvasError);
            reject(canvasError);
          }
        };
        
        // 设置图片源
        img.src = fullUrl;
      });
  });
};

/**
 * 使用js-table2excel将数据导出为Excel文件，包含图片
 * @param {Array} data - 要导出的数据数组
 * @param {String} fileName - 导出的文件名（不含后缀）
 * @param {Array} headers - 要导出的列标题和对应字段名
 */
export const exportToExcelWithImages = async (data, fileName, headers) => {
  console.log('=== exportToExcelWithImages 函数被调用 ===');
  console.log('数据条数:', data.length);
  
  if (!data || data.length === 0) {
    console.error('导出失败：没有数据');
    return false;
  }

  try {
    console.log('使用js-table2excel导出Excel，开始处理图片...');
    console.log('数据条数:', data.length);
    console.log('第一条数据示例:', JSON.stringify(data[0]).substring(0, 200) + '...');
    
    // 处理文件名
    fileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
    const fullFileName = `${fileName}_${timestamp}`;
    console.log('导出文件名:', fullFileName);
    
    // 预处理图片，确保所有图片都加载完成
    const processedData = [];
    
    // 逐行处理数据
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      console.log(`处理第 ${rowIndex + 1}/${data.length} 条记录...`);
      const row = data[rowIndex];
      const record = row['__original'] || {};
      console.log(`记录ID: ${record.id || 'unknown'}`);
      
      // 处理清理前照片
      let beforePhotoData = null;
      if (record.photo_path_before) {
        console.log(`记录 ${rowIndex} 清理前照片路径:`, record.photo_path_before);
        const photoPaths = parsePhotoPath(record.photo_path_before);
        console.log(`解析后的照片路径:`, photoPaths);
        
        if (photoPaths && photoPaths.length > 0) {
          const firstPath = photoPaths[0];
          console.log(`选择第一张照片:`, firstPath);
          
          // 检查路径格式
          if (typeof firstPath === 'string') {
            // 构建完整URL
            let imageUrl = firstPath;
            
            // 如果是相对路径，添加origin
            if (firstPath.startsWith('/')) {
              imageUrl = window.location.origin + firstPath;
            }
            
            console.log(`记录 ${rowIndex} 清理前照片完整URL:`, imageUrl);
            
            try {
              console.log(`开始转换清理前照片...`);
              beforePhotoData = await imageUrlToBase64(imageUrl);
              console.log(`记录 ${rowIndex} 清理前照片已转换为Base64，长度:`, beforePhotoData ? beforePhotoData.length : 0);
            } catch (error) {
              console.error(`记录 ${rowIndex} 清理前照片转换失败:`, error);
              console.error('错误详情:', error.message);
            }
          } else {
            console.error(`记录 ${rowIndex} 清理前照片路径格式错误:`, firstPath);
          }
        } else {
          console.log(`记录 ${rowIndex} 没有有效的清理前照片路径`);
        }
      } else {
        console.log(`记录 ${rowIndex} 没有清理前照片`);
      }
      
      // 处理清理后照片
      let afterPhotoData = null;
      if (record.photo_path_after) {
        console.log(`记录 ${rowIndex} 清理后照片路径:`, record.photo_path_after);
        const photoPaths = parsePhotoPath(record.photo_path_after); 
        console.log(`解析后的照片路径:`, photoPaths);
        
        if (photoPaths && photoPaths.length > 0) {
          const firstPath = photoPaths[0];
          console.log(`选择第一张照片:`, firstPath);
          
          // 检查路径格式
          if (typeof firstPath === 'string') {
            // 构建完整URL
            let imageUrl = firstPath;
            
            // 如果是相对路径，添加origin
            if (firstPath.startsWith('/')) {
              imageUrl = window.location.origin + firstPath;
            }
            
            console.log(`记录 ${rowIndex} 清理后照片完整URL:`, imageUrl);
            
            try {
              console.log(`开始转换清理后照片...`);
              afterPhotoData = await imageUrlToBase64(imageUrl);
              console.log(`记录 ${rowIndex} 清理后照片已转换为Base64，长度:`, afterPhotoData ? afterPhotoData.length : 0);
            } catch (error) {
              console.error(`记录 ${rowIndex} 清理后照片转换失败:`, error);
              console.error('错误详情:', error.message);
            }
          } else {
            console.error(`记录 ${rowIndex} 清理后照片路径格式错误:`, firstPath);
          }
        } else {
          console.log(`记录 ${rowIndex} 没有有效的清理后照片路径`);
        }
      } else {
        console.log(`记录 ${rowIndex} 没有清理后照片`);
      }
      
      // 保存处理后的数据
      processedData.push({
        ...row,
        __beforePhotoData: beforePhotoData,
        __afterPhotoData: afterPhotoData
      });
      console.log(`记录 ${rowIndex} 处理完成`);
    }
    
    console.log('所有图片处理完成，开始创建Excel...');
    console.log('处理后的数据条数:', processedData.length);
    
    // 检查是否有任何图片数据
    let hasImageData = false;
    for (const row of processedData) {
      if (row.__beforePhotoData || row.__afterPhotoData) {
        hasImageData = true;
        console.log('找到图片数据，将使用图片导出模式');
        break;
      }
    }
    
    if (!hasImageData) {
      console.warn('没有找到任何有效的图片数据，但仍将尝试使用图片导出模式');
    }
    
    // 创建一个临时表格元素
    const table = document.createElement('table');
    table.style.display = 'none';
    document.body.appendChild(table);
    console.log('创建临时表格元素');
    
    // 创建表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header.text;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    console.log('表头创建完成');
    
    // 创建表体
    const tbody = document.createElement('tbody');
    
    // 添加数据行
    processedData.forEach((row, index) => {
      console.log(`创建第 ${index + 1}/${processedData.length} 行...`);
      const tr = document.createElement('tr');
      
      headers.forEach(header => {
        const td = document.createElement('td');
        
        // 处理清理前照片列
        if (header.field === '清理前照片') {
          if (row.__beforePhotoData) {
            console.log(`添加第 ${index + 1} 行清理前照片，Base64长度:`, row.__beforePhotoData.length);
            // 使用Base64数据创建图片
            const img = document.createElement('img');
            img.src = row.__beforePhotoData;
            img.style.width = '100px';
            img.style.height = '100px';
            img.alt = '清理前照片';
            
            // 确保图片已加载
            if (!img.complete) {
              console.log('图片尚未加载完成，添加onload事件');
              img.onload = () => {
                console.log(`第 ${index + 1} 行清理前照片加载完成`);
              };
              img.onerror = (error) => {
                console.error(`第 ${index + 1} 行清理前照片加载失败:`, error);
                td.textContent = '图片加载失败';
              };
            }
            
            td.appendChild(img);
            console.log(`第 ${index + 1} 行清理前照片添加成功`);
          } else {
            td.textContent = '无图片';
            console.log(`第 ${index + 1} 行没有清理前照片`);
          }
        }
        // 处理清理后照片列 
        else if (header.field === '清理后照片') {
          if (row.__afterPhotoData) {
            console.log(`添加第 ${index + 1} 行清理后照片，Base64长度:`, row.__afterPhotoData.length);
            // 使用Base64数据创建图片
            const img = document.createElement('img');
            img.src = row.__afterPhotoData;
            img.style.width = '100px';
            img.style.height = '100px';
            img.alt = '清理后照片';
            
            // 确保图片已加载
            if (!img.complete) {
              console.log('图片尚未加载完成，添加onload事件');
              img.onload = () => {
                console.log(`第 ${index + 1} 行清理后照片加载完成`);
              };
              img.onerror = (error) => {
                console.error(`第 ${index + 1} 行清理后照片加载失败:`, error);
                td.textContent = '图片加载失败';
              };
            }
            
            td.appendChild(img);
            console.log(`第 ${index + 1} 行清理后照片添加成功`);
          } else {
            td.textContent = '无图片';
            console.log(`第 ${index + 1} 行没有清理后照片`);
          }
        }
        else {
          // 普通文本列
          td.textContent = row[header.field] || '';
        }
        
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
      console.log(`第 ${index + 1} 行创建完成`);
    });
    
    table.appendChild(tbody);
    console.log('表格创建完成');
    
    // 检查表格内容
    console.log('表格行数:', table.rows.length);
    console.log('表格列数:', table.rows[0] ? table.rows[0].cells.length : 0);
    
    // 使用js-table2excel导出
    console.log('开始使用js-table2excel导出...');
    const table2excel = new Table2Excel();
    console.log('Table2Excel实例创建成功');

    // 确保所有图片都已加载完成
    console.log('检查表格中的图片...');
    const imgElements = table.querySelectorAll('img');
    console.log(`表格中共有 ${imgElements.length} 张图片`);

    // 如果没有图片，直接导出
    if (imgElements.length === 0) {
      console.log('表格中没有图片，直接导出');
      try {
        console.log('调用export方法...');
        table2excel.export(table, fullFileName);
        console.log('export方法调用成功');
        
        // 导出完成后移除临时表格
        document.body.removeChild(table);
        console.log('临时表格已移除');
        
        return true;
      } catch (exportError) {
        console.error('export方法调用失败:', exportError);
        
        // 导出完成后移除临时表格
        document.body.removeChild(table);
        console.log('临时表格已移除');
        
        throw exportError;
      }
    } else {
      // 等待所有图片加载完成
      console.log('等待所有图片加载完成后再导出');
      
      // 创建一个Promise数组，每个Promise对应一个图片的加载
      const imgPromises = Array.from(imgElements).map((img, imgIndex) => {
        return new Promise((resolve) => {
          if (img.complete) {
            console.log(`图片 ${imgIndex + 1} 已加载完成`);
            resolve();
          } else {
            console.log(`等待图片 ${imgIndex + 1} 加载...`);
            img.onload = () => {
              console.log(`图片 ${imgIndex + 1} 加载完成`);
              resolve();
            };
            img.onerror = () => {
              console.error(`图片 ${imgIndex + 1} 加载失败`);
              resolve(); // 即使失败也继续导出
            };
            
            // 添加超时处理
            setTimeout(() => {
              if (!img.complete) {
                console.error(`图片 ${imgIndex + 1} 加载超时`);
                resolve(); // 超时也继续导出
              }
            }, 5000); // 5秒超时
          }
        });
      });
      
      // 等待所有图片加载完成或超时
      try {
        await Promise.all(imgPromises);
        console.log('所有图片加载完成或超时，开始导出');
        
        try {
          console.log('调用export方法...');
          table2excel.export(table, fullFileName);
          console.log('export方法调用成功');
          
          // 导出完成后移除临时表格
          document.body.removeChild(table);
          console.log('临时表格已移除');
          
          return true;
        } catch (exportError) {
          console.error('export方法调用失败:', exportError);
          
          // 导出完成后移除临时表格
          document.body.removeChild(table);
          console.log('临时表格已移除');
          
          throw exportError;
        }
      } catch (imgLoadError) {
        console.error('等待图片加载过程中发生错误:', imgLoadError);
        
        try {
          console.log('尝试强制导出...');
          table2excel.export(table, fullFileName);
          console.log('强制导出成功');
          
          // 导出完成后移除临时表格
          document.body.removeChild(table);
          console.log('临时表格已移除');
          
          return true;
        } catch (forceExportError) {
          console.error('强制导出失败:', forceExportError);
          
          // 导出完成后移除临时表格
          document.body.removeChild(table);
          console.log('临时表格已移除');
          
          throw forceExportError;
        }
      }
    }
  } catch (error) {
    console.error('使用js-table2excel导出Excel失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 尝试使用XLSX导出（不包含图片）
    console.log('尝试使用XLSX导出（不包含图片）...');
    try {
      // 不要调用exportToExcel，直接在这里实现导出逻辑
      console.log('创建工作簿...');
      const wb = XLSX.utils.book_new();
      
      // 准备数据
      const exportRows = data.map(row => {
        const exportRow = {};
        headers.forEach(header => {
          exportRow[header.text] = row[header.field] || '';
        });
        return exportRow;
      });
      
      console.log('创建工作表...');
      const ws = XLSX.utils.json_to_sheet(exportRows);
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      
      // 处理文件名
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
      const fullFileName = `${fileName}_${timestamp}`;
      
      // 导出
      console.log('导出Excel文件...');
      const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // 创建Blob
      const blob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fullFileName}.xlsx`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      console.log('XLSX导出成功（不包含图片）');
      return true;
    } catch (xlsxError) {
      console.error('XLSX导出失败:', xlsxError);
      
      // 最后尝试CSV导出
      console.log('尝试CSV导出...');
      return exportToCSV(data, fileName, headers);
    }
  }
};

/**
 * 将数据导出为Excel文件
 * @param {Array} data - 要导出的数据数组
 * @param {String} fileName - 导出的文件名（不含后缀）
 * @param {Array} headers - 要导出的列标题和对应字段名
 */
export const exportToExcel = (data, fileName, headers) => {
  if (!data || data.length === 0) {
    console.error('导出失败：没有数据');
    return false;
  }

  // 处理文件名
  fileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
  
  console.log('导出函数被调用，数据条数:', data.length);
  
  // 使用XLSX导出Excel
  try {
    console.log('尝试导出Excel...');
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    console.log('工作簿创建成功');
    
    // 准备数据
    const exportRows = data.map(row => {
      const exportRow = {};
      headers.forEach(header => {
        exportRow[header.text] = row[header.field] || '';
      });
      return exportRow;
    });
    
    console.log('数据准备完成，开始创建工作表');
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportRows);
    
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
 * 准备图片数据用于导出
 * @param {Array} records - 记录数据
 * @param {String} baseUrl - 基础URL
 * @returns {Object} 图片数据对象
 */
export const prepareImageExportData = async (records, baseUrl) => {
  const imageData = {};
  
  try {
    console.log('准备图片数据，记录数:', records.length);
    console.log('基础URL:', baseUrl);
    
    // 处理每条记录的图片
    records.forEach((record, index) => {
      imageData[index] = {
        beforeImages: [],
        afterImages: []
      };
      
      // 处理清理前照片
      if (record.photo_path_before) {
        console.log(`记录 ${index} 清理前照片路径:`, record.photo_path_before);
        
        let beforePaths = [];
        try {
          // 尝试解析JSON
          if (typeof record.photo_path_before === 'string' && record.photo_path_before.startsWith('[')) {
            beforePaths = JSON.parse(record.photo_path_before);
            console.log(`记录 ${index} 解析后的清理前照片路径:`, beforePaths);
          } else {
            beforePaths = [record.photo_path_before];
          }
        } catch (e) {
          console.error('解析清理前照片路径失败:', e);
          beforePaths = [record.photo_path_before];
        }
        
        // 添加完整URL
        imageData[index].beforeImages = beforePaths.map(path => {
          // 确保路径是字符串
          const pathStr = String(path);
          // 如果路径已经是完整URL，则直接返回
          if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
            return pathStr;
          }
          // 否则拼接基础URL
          return `${baseUrl}${pathStr}`;
        });
        
        console.log(`记录 ${index} 完整的清理前照片URL:`, imageData[index].beforeImages);
      }
      
      // 处理清理后照片
      if (record.photo_path_after) {
        console.log(`记录 ${index} 清理后照片路径:`, record.photo_path_after);
        
        let afterPaths = [];
        try {
          // 尝试解析JSON
          if (typeof record.photo_path_after === 'string' && record.photo_path_after.startsWith('[')) {
            afterPaths = JSON.parse(record.photo_path_after);
            console.log(`记录 ${index} 解析后的清理后照片路径:`, afterPaths);
          } else {
            afterPaths = [record.photo_path_after];
          }
        } catch (e) {
          console.error('解析清理后照片路径失败:', e);
          afterPaths = [record.photo_path_after];
        }
        
        // 添加完整URL
        imageData[index].afterImages = afterPaths.map(path => {
          // 确保路径是字符串
          const pathStr = String(path);
          // 如果路径已经是完整URL，则直接返回
          if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
            return pathStr;
          }
          // 否则拼接基础URL
          return `${baseUrl}${pathStr}`;
        });
        
        console.log(`记录 ${index} 完整的清理后照片URL:`, imageData[index].afterImages);
      }
    });
    
    console.log('图片数据准备完成，总记录数:', Object.keys(imageData).length);
    return imageData;
  } catch (error) {
    console.error('准备图片数据失败:', error);
    return {};
  }
};
