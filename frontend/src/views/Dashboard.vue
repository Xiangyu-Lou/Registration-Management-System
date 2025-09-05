<template>
  <div class="dashboard-container">
    <h1>数据可视化仪表盘</h1>
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="chart-container">
          <h2>各单位废物数量对比</h2>
          <v-chart :option="wasteByUnitOptions" />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-container">
          <h2>不同废物类型的占比</h2>
          <v-chart :option="wasteByTypeOptions" />
        </div>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <div class="chart-container">
          <h2>废物产生趋势</h2>
          <v-chart :option="wasteTrendOptions" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';
import * as echarts from 'echarts';
import httpService from '../config/httpService';
import apiConfig from '../config/api';

export default {
  name: 'Dashboard',
  components: {
    VChart
  },
  setup() {
    const dashboardData = ref(null);

    const fetchDashboardData = async () => {
      try {
        const response = await httpService.get(apiConfig.endpoints.dashboard);
        dashboardData.value = response.data;
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
      }
    };

    onMounted(fetchDashboardData);

    const wasteByUnitOptions = computed(() => {
      if (!dashboardData.value) return {};
      return {
        tooltip: {},
        xAxis: {
          type: 'category',
          data: dashboardData.value.wasteByUnit.map(item => item.name)
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: dashboardData.value.wasteByUnit.map(item => item.total_weight),
            type: 'bar'
          }
        ]
      };
    });

    const wasteByTypeOptions = computed(() => {
      if (!dashboardData.value) return {};
      return {
        tooltip: {
          trigger: 'item'
        },
        series: [
          {
            type: 'pie',
            data: dashboardData.value.wasteByType.map(item => ({
              name: item.name,
              value: item.total_weight
            }))
          }
        ]
      };
    });

    const wasteTrendOptions = computed(() => {
      if (!dashboardData.value) return {};
      return {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: dashboardData.value.wasteTrend.map(item => item.date)
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: dashboardData.value.wasteTrend.map(item => item.total_weight),
            type: 'line'
          }
        ]
      };
    });

    return {
      wasteByUnitOptions,
      wasteByTypeOptions,
      wasteTrendOptions
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}
.chart-container {
  border: 1px solid #ebeef5;
  padding: 20px;
  margin-bottom: 20px;
}
.echarts {
  width: 100%;
  height: 400px;
}
</style>
