<template>
  <div class="map-dashboard-container">
    <div id="container"></div>
    <div class="filter-panel">
      <h3>废物产生分布图</h3>
      <div class="stat-info">
        <p>已加载记录: {{ totalRecords }}</p>
        <p>有效坐标点: {{ validPoints }}</p>
      </div>
      <div class="legend">
         <div class="legend-item"><span class="dot normal"></span> 普通记录</div>
         <!-- 可以根据需要添加更多图例，比如按废物类型区分颜色 -->
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
let cluster; // 点聚合实例

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
    plugins: ['AMap.MarkerCluster', 'AMap.ToolBar', 'AMap.Scale', 'AMap.ControlBar'], 
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
    // 复用现有的获取记录接口，根据用户角色获取数据
    // 注意：如果数据量非常大，建议后端提供专门的轻量级 GeoJSON 接口
    const userRole = store.state.user.role_id;
    let url = '/waste-records/list';
    if (userRole === 3 || userRole === 5) { // 超级管理员
       url = '/waste-records/list'; 
    }
    
    // 这里简单处理，直接获取第一页的大量数据或者修改后端支持获取全部
    // 为了演示，我们假设后端支持不传分页参数返回全部，或者我们可以循环获取
    // 暂时先获取第一页，实际项目中建议增加 'all=true' 参数
    const response = await http.get(url, { params: { page: 1, pageSize: 1000 } });
    
    let records = [];
    if (response.data && response.data.records) {
        records = response.data.records;
    } else if (Array.isArray(response.data)) {
        records = response.data;
    }

    totalRecords.value = records.length;

    const markers = [];
    const points = []; // 用于自适应显示范围

    records.forEach(record => {
      // 检查是否有有效的经纬度
      if (record.latitude && record.longitude) {
        const lng = parseFloat(record.longitude);
        const lat = parseFloat(record.latitude);
        
        // 简单的有效性检查
        if (!isNaN(lng) && !isNaN(lat) && lng > 0 && lat > 0) {
            
          const markerContent = `<div class="custom-marker"></div>`;
          
          // 创建 Marker (这里为了聚合，我们构建数据结构，或者直接创建 Marker 对象)
          // 使用 AMap.MarkerCluster 插件通常需要 Marker 对象数组
          
          const marker = new AMap.Marker({
            position: [lng, lat],
            title: record.unit_name,
            // content: markerContent, // 如果想自定义样式可以启用
            extData: record // 存储记录数据以便点击时使用
          });

          // 绑定点击事件，显示信息窗体
          marker.on('click', (e) => {
             const data = e.target.getExtData();
             const infoWindowContent = `
                <div class="info-window-content">
                   <h4>${data.unit_name}</h4>
                   <p><strong>废物类型:</strong> ${data.waste_type_name}</p>
                   <p><strong>数量:</strong> ${data.quantity} 吨</p>
                   <p><strong>时间:</strong> ${new Date(data.collection_start_time).toLocaleString()}</p>
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
          points.push([lng, lat]);
        }
      }
    });

    validPoints.value = markers.length;

    if (markers.length > 0) {
      // 使用点聚合插件
      if (cluster) {
        cluster.setMap(null);
      }
      cluster = new AMap.MarkerCluster(map.value, markers, {
          gridSize: 80, // 聚合计算网格像素大小
      });

      // 调整地图视野以包含所有点
      // 需要构建 Bounds 对象
      // 简单方法：如果是少量点，可以直接用 setFitView
      // 由于用了聚合插件，map.setFitView() 可能对聚合后的 marker 不生效，
      // 但我们可以对原始 markers 做 setFitView
      const overlayGroup = new AMap.OverlayGroup(markers);
      map.value.setFitView(markers);
    } else {
      ElMessage.info('当前没有包含地理位置信息的记录');
    }

  } catch (error) {
    console.error('加载数据失败:', error);
    ElMessage.error('加载数据失败');
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
  height: calc(100vh - 84px); /* 减去顶部导航栏高度，具体根据您的布局调整 */
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
    background-color: #1976D2; /* 高德默认Marker颜色近似 */
}

/* InfoWindow 样式在全局或通过 deep selector 调整，因为它是插入到 body 的 */
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