/**
 * 高德地图位置获取工具
 * 支持手机端和电脑端位置获取
 */

// 高德地图配置
const AMAP_CONFIG = {
  // Web服务API密钥（用于HTTP请求）
  webServiceKey: '5bcc4e72239e7c2fbc5bf264a19abfc7',
  // JS API密钥（保留备用，如果将来需要使用JS SDK）
  jsApiKey: 'ce824eb86be2c05e696310234e310b20',
  jsApiToken: 'ab849a6b9b76caadab4f82a5fbe282e8',
  serviceHost: 'https://restapi.amap.com'
};

/**
 * 获取用户当前位置信息
 * @returns {Promise<Object>} 位置信息对象
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    // 检查浏览器是否支持地理定位
    if (!navigator.geolocation) {
      reject(new Error('当前浏览器不支持地理定位功能'));
      return;
    }

    // 定位选项
    const options = {
      enableHighAccuracy: true, // 启用高精度定位
      timeout: 10000, // 10秒超时
      maximumAge: 0 // 不使用缓存
    };

    // 获取GPS坐标
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('🔍 GPS原始坐标:', { latitude, longitude });
        
        try {
          // 将GPS坐标转换为高德坐标系，并获取地址信息
          const locationInfo = await convertGpsToAmap(latitude, longitude);
          console.log('✅ 转换后的位置信息:', locationInfo);
          
          resolve({
            success: true,
            longitude: locationInfo.longitude,
            latitude: locationInfo.latitude,
            address: locationInfo.address,
            district: locationInfo.district,
            city: locationInfo.city,
            province: locationInfo.province
          });
        } catch (error) {
          // 如果地址解析失败，至少要进行坐标转换
          console.warn('⚠️ 地址解析失败，尝试仅进行坐标转换:', error);
          
          try {
            // 尝试只进行坐标转换，不获取地址
            const convertUrl = `${AMAP_CONFIG.serviceHost}/v3/assistant/coordinate/convert`;
            const convertParams = new URLSearchParams({
              key: AMAP_CONFIG.webServiceKey,
              locations: `${longitude},${latitude}`,
              coordsys: 'gps' // GPS坐标系
            });

            console.log('🔄 备用坐标转换API URL:', `${convertUrl}?${convertParams}`);
            const convertResponse = await fetch(`${convertUrl}?${convertParams}`);
            const convertData = await convertResponse.json();
            console.log('🔄 备用坐标转换响应:', convertData);

            let amapLng = longitude;
            let amapLat = latitude;

            if (convertData.status === '1' && convertData.locations) {
              const [convertedLng, convertedLat] = convertData.locations.split(',');
              amapLng = parseFloat(convertedLng);
              amapLat = parseFloat(convertedLat);
              console.log('✅ 备用坐标转换成功:', { amapLng, amapLat });
            } else {
              console.warn('⚠️ 备用坐标转换也失败:', convertData);
            }

            const result = {
              success: true,
              longitude: amapLng,
              latitude: amapLat,
              address: '',
              district: '',
              city: '',
              province: ''
            };
            console.log('📍 最终返回（仅坐标）:', result);
            resolve(result);
          } catch (convertError) {
            // 如果坐标转换也失败，使用原始GPS坐标
            console.error('❌ 备用坐标转换失败:', convertError);
            const fallbackResult = {
              success: true,
              longitude: longitude,
              latitude: latitude,
              address: '',
              district: '',
              city: '',
              province: ''
            };
            console.log('📍 最终返回（原始GPS坐标）:', fallbackResult);
            resolve(fallbackResult);
          }
        }
      },
      (error) => {
        let errorMessage = '获取位置失败';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '用户拒绝了位置访问请求';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMessage = '获取位置超时，请检查网络连接';
            break;
          default:
            errorMessage = `位置获取失败：${error.message}`;
            break;
        }
        
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

/**
 * 将GPS坐标转换为高德坐标系并获取地址信息
 * @param {number} lat GPS纬度
 * @param {number} lng GPS经度
 * @returns {Promise<Object>} 转换后的位置信息
 */
const convertGpsToAmap = async (lat, lng) => {
  console.log('📍 开始坐标转换和地址解析...');
  console.log('输入坐标 (GPS):', { lat, lng });
  
  try {
    // 坐标转换：GPS -> 高德
    const convertUrl = `${AMAP_CONFIG.serviceHost}/v3/assistant/coordinate/convert`;
    const convertParams = new URLSearchParams({
      key: AMAP_CONFIG.webServiceKey,
      locations: `${lng},${lat}`,
      coordsys: 'gps' // GPS坐标系
    });

    console.log('🔄 坐标转换API URL:', `${convertUrl}?${convertParams}`);
    const convertResponse = await fetch(`${convertUrl}?${convertParams}`);
    const convertData = await convertResponse.json();
    console.log('🔄 坐标转换API响应:', convertData);

    let amapLng = lng;
    let amapLat = lat;

    if (convertData.status === '1' && convertData.locations) {
      const [convertedLng, convertedLat] = convertData.locations.split(',');
      amapLng = parseFloat(convertedLng);
      amapLat = parseFloat(convertedLat);
      console.log('✅ 坐标转换成功:', { amapLng, amapLat });
    } else {
      console.warn('⚠️ 坐标转换失败，使用原始坐标:', convertData);
    }

    // 逆地理编码获取地址信息
    const geocodeUrl = `${AMAP_CONFIG.serviceHost}/v3/geocode/regeo`;
    const geocodeParams = new URLSearchParams({
      key: AMAP_CONFIG.webServiceKey,
      location: `${amapLng},${amapLat}`,
      extensions: 'all'
    });

    console.log('🏠 逆地理编码API URL:', `${geocodeUrl}?${geocodeParams}`);
    const geocodeResponse = await fetch(`${geocodeUrl}?${geocodeParams}`);
    const geocodeData = await geocodeResponse.json();
    console.log('🏠 逆地理编码API响应:', geocodeData);

    let addressInfo = {
      longitude: amapLng,
      latitude: amapLat,
      address: '',
      district: '',
      city: '',
      province: ''
    };

    if (geocodeData.status === '1' && geocodeData.regeocode) {
      const regeocode = geocodeData.regeocode;
      const addressComponent = regeocode.addressComponent;
      console.log('📍 地址组件:', addressComponent);

      addressInfo = {
        longitude: amapLng,
        latitude: amapLat,
        address: regeocode.formatted_address || '',
        district: addressComponent.district || '',
        city: addressComponent.city || addressComponent.province || '',
        province: addressComponent.province || ''
      };
      console.log('✅ 地址解析成功:', addressInfo);
    } else {
      console.warn('⚠️ 地址解析失败，仅保存坐标:', geocodeData);
    }

    return addressInfo;
  } catch (error) {
    // 如果API调用失败，返回原始坐标
    console.error('❌ API调用失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack
    });
    return {
      longitude: lng,
      latitude: lat,
      address: '',
      district: '',
      city: '',
      province: ''
    };
  }
};

/**
 * 检查是否支持位置获取
 * @returns {boolean} 是否支持
 */
export const isLocationSupported = () => {
  return 'geolocation' in navigator;
};

/**
 * 检查是否为HTTPS或localhost环境
 * 现代浏览器在非安全环境下不允许获取位置
 * @returns {boolean} 是否为安全环境
 */
export const isSecureContext = () => {
  return window.isSecureContext || window.location.hostname === 'localhost';
};

/**
 * 格式化坐标显示
 * @param {number|string} longitude 经度
 * @param {number|string} latitude 纬度
 * @returns {string} 格式化的坐标字符串
 */
export const formatCoordinates = (longitude, latitude) => {
  if (!longitude || !latitude) {
    return '位置信息未获取';
  }
  
  // 确保转换为数字类型
  const lng = parseFloat(longitude);
  const lat = parseFloat(latitude);
  
  // 检查转换后是否为有效数字
  if (isNaN(lng) || isNaN(lat)) {
    return '坐标格式错误';
  }
  
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

/**
 * 格式化地址显示
 * @param {Object} locationInfo 位置信息对象
 * @returns {string} 格式化的地址字符串
 */
export const formatAddress = (locationInfo) => {
  if (!locationInfo) {
    return '地址信息未获取';
  }

  const { province, city, district, address } = locationInfo;
  
  if (address) {
    return address;
  }
  
  const parts = [province, city, district].filter(part => part && part.trim());
  return parts.length > 0 ? parts.join('') : '地址解析失败';
};
