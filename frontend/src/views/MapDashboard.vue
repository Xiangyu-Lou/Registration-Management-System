<template>
  <div class="map-dashboard-container">
    <div id="container"></div>
    <div class="filter-panel">
      <h3>废物产生分布图</h3>
      <div class="stat-info">
        <p>已加载记录: {{ totalRecords }}</p>
        <p>有效坐标点: {{ validPoints }}</p>
      </div>
      
      <!-- 新增：显示模式切换 -->
      <div class="mode-switch" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
         <div style="display: flex; align-items: center; justify-content: space-between;">
             <span style="font-size: 14px; color: #333;">热力图模式</span>
             <el-switch v-model="isHeatmapMode" @change="toggleHeatmap" />
         </div>
      </div>

      <div class="legend" v-if="!isHeatmapMode">
         <div class="legend-item"><span class="dot normal"></span> 普通记录</div>
      </div>
       <div class="legend" v-else>
         <div class="legend-item">
             <span style="font-size: 12px; color: #666;">颜色越红表示产生量越大</span>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useStore } from 'vuex';
import http from '@/config/httpService';
import { ElMessage } from 'element-plus';

const store = useStore();
const map = shallowRef(null);
const totalRecords = ref(0);
const validPoints = ref(0);
const isHeatmapMode = ref(false); // 热力图模式开关
let cluster; // 点聚合实例
let heatmap; // 热力图实例
let heatmapData = []; // 热力图数据

// 请务必替换为您申请的 Key 和 安全密钥
const AMAP_SECURITY_CODE = '请替换为您的安全密钥';
const AMAP_KEY = '请替换为您的Key';

// 初始化地图
const initMap = () => {
  window._AMapSecurityConfig = {
    securityJsCode: AMAP_SECURITY_CODE,
  };

  AMapLoader.load({
    key: AMAP_KEY,
    version: "2.0",
    plugins: ['AMap.MarkerCluster', 'AMap.ToolBar', 'AMap.Scale', 'AMap.ControlBar', 'AMap.HeatMap'], 
  })
    .then((AMap) => {
      map.value = new AMap.Map("container", {
        viewMode: "3D", 
        zoom: 11,
        center: [116.397428, 39.90923], // 默认中心点（北京），加载数据后会自动调整
        resizeEnable: true,
      });
      
      // 添加控件
      map.value.addControl(new AMap.ToolBar());
      map.value.addControl(new AMap.Scale());
      map.value.addControl(new AMap.ControlBar());

      loadData(AMap);
    })
    .catch((e) => {
      console.error(e);
      ElMessage.error('地图加载失败，请检查网络或Key配置');
    });
};

// 加载数据并渲染
const loadData = async (AMap) => {
  try {
    const userRole = store.state.user.role_id;
    let url = '/waste-records/list';
    if (userRole === 3 || userRole === 5) { // 超级管理员
       url = '/waste-records/list'; 
    }
    
    const response = await http.get(url, { params: { page: 1, pageSize: 1000 } });
    
    let records = [];
    if (response.data && response.data.records) {
        records = response.data.records;
    } else if (Array.isArray(response.data)) {
        records = response.data;
    }

    totalRecords.value = records.length;

    // --- 统计逻辑 ---
    const locationStats = {};
    const currentYear = new Date().getFullYear();
    let maxQuantity = 0; // 用于热力图的max值

    records.forEach(record => {
      if (record.latitude && record.longitude) {
        const lat = parseFloat(record.latitude).toFixed(6);
        const lng = parseFloat(record.longitude).toFixed(6);
        const quantity = parseFloat(record.quantity) || 0;
        const key = `${lng},${lat}`;
        const recordDate = new Date(record.collection_start_time);
        
        // 统计逻辑
        if (!locationStats[key]) {
          locationStats[key] = {
            yearTotal: 0,
            count: 0
          };
        }
        if (recordDate.getFullYear() === currentYear) {
           locationStats[key].yearTotal += quantity;
           locationStats[key].count += 1;
        }

        // 查找最大值用于热力图归一化
        if (quantity > maxQuantity) {
            maxQuantity = quantity;
        }
      }
    });

    const markers = [];
    heatmapData = []; // 重置热力图数据

    records.forEach(record => {
      if (record.latitude && record.longitude) {
        const lng = parseFloat(record.longitude);
        const lat = parseFloat(record.latitude);
        const quantity = parseFloat(record.quantity) || 0;
        
        if (!isNaN(lng) && !isNaN(lat) && lng > 0 && lat > 0) {
          
          // 构建热力图数据点
          heatmapData.push({
              lng: lng,
              lat: lat,
              count: quantity
          });

          // 构建 Marker
          const marker = new AMap.Marker({
            position: [lng, lat],
            title: record.unit_name,
            extData: record
          });

          marker.on('click', (e) => {
             const data = e.target.getExtData();
             const key = `${parseFloat(data.longitude).toFixed(6)},${parseFloat(data.latitude).toFixed(6)}`;
             const stat = locationStats[key] || { yearTotal: 0 };
             const yearTotalStr = stat.yearTotal.toFixed(3); 
             
             const infoWindowContent = `
                <div class="info-window-content">
                   <h4>${data.unit_name}</h4>
                   <p><strong>废物类型:</strong> ${data.waste_type_name}</p>
                   <p><strong>本次数量:</strong> ${data.quantity} 吨</p>
                   <p><strong>时间:</strong> ${new Date(data.collection_start_time).toLocaleString()}</p>
                   <p style="color: #E65100; font-weight: bold; border-top: 1px dashed #eee; margin-top: 5px; padding-top: 5px;">
                     本地点${currentYear}年累计: ${yearTotalStr} 吨
                   </p>
                   <p><strong>位置:</strong> ${data.location || '无详细描述'}</p>
                   ${data.photo_path_after ? `<img src="${store.state.apiBaseUrl || ''}${data.photo_path_after}" style="width:100%;max-height:100px;object-fit:cover;margin-top:5px;border-radius:4px;">` : ''}
                </div>
             `;
             
             const infoWindow = new AMap.InfoWindow({
                 content: infoWindowContent,
                 offset: new AMap.Pixel(0, -30)
             });
             infoWindow.open(map.value, e.target.getPosition());
          });

          markers.push(marker);
        }
      }
    });

    validPoints.value = markers.length;

    // 初始化点聚合
    if (markers.length > 0) {
      if (cluster) {
        cluster.setMap(null);
      }
      cluster = new AMap.MarkerCluster(map.value, markers, {
          gridSize: 80,
      });
      
      // 默认显示点聚合，调整视野
      if (!isHeatmapMode.value) {
          map.value.setFitView(markers);
      }
    } else {
      ElMessage.info('当前没有包含地理位置信息的记录');
    }

    // 初始化热力图
    if (!heatmap) {
        heatmap = new AMap.HeatMap(map.value, {
            radius: 25,
            opacity: [0, 0.8],
            gradient: {
                0.5: 'blue',
                0.65: 'rgb(117,211,248)',
                0.7: 'rgb(0, 255, 0)',
                0.9: '#ffea00',
                1.0: 'red'
            }
        });
    }
    
    // 设置热力图数据
    // max值可以根据实际情况调整，这里取记录中的最大值，避免所有点都很红或者都不红
    // 为了显示效果，如果最大值过大，可以适当调整，或者取平均值的几倍
    const safeMax = maxQuantity > 0 ? maxQuantity : 10;
    
    heatmap.setDataSet({
        data: heatmapData,
        max: safeMax
    });
    
    // 初始根据开关状态决定显隐
    if (isHeatmapMode.value) {
        heatmap.show();
        if (cluster) cluster.setMap(null);
    } else {
        heatmap.hide();
        if (cluster) cluster.setMap(map.value);
    }

  } catch (error) {
    console.error('加载数据失败:', error);
    ElMessage.error('加载数据失败');
  }
};

// 切换热力图模式
const toggleHeatmap = (val) => {
    if (val) {
        // 开启热力图：隐藏聚合点，显示热力图
        if (cluster) cluster.setMap(null); 
        if (heatmap) heatmap.show();
    } else {
        // 关闭热力图：显示聚合点，隐藏热力图
        if (heatmap) heatmap.hide();
        if (cluster) cluster.setMap(map.value); 
    }
};

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (map.value) {
    map.value.destroy();
  }
});
</script>

<style scoped>
.map-dashboard-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 84px);
  overflow: hidden;
}

#container {
  width: 100%;
  height: 100%;
}

.filter-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 200px;
}

.filter-panel h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

.stat-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.legend {
    margin-top: 10px;
    border-top: 1px solid #eee;
    padding-top: 10px;
}

.legend-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #666;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 8px;
}

.dot.normal {
    background-color: #1976D2; 
}

:deep(.info-window-content) {
    font-size: 13px;
    width: 200px;
}
:deep(.info-window-content h4) {
    margin: 0 0 8px 0;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
}
:deep(.info-window-content p) {
    margin: 4px 0;
    color: #666;
}
</style>