
<template>
  <div class="data-analysis-container">
    <el-card class="filter-card">
      <template #header>
        <div class="card-header">
          <span>Filters</span>
        </div>
      </template>
      <el-form :model="filters" inline>
        <el-form-item label="Date Range">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="To"
            start-placeholder="Start date"
            end-placeholder="End date">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="Waste Type">
          <el-select v-model="filters.wasteTypeId" placeholder="Select type" clearable>
            <el-option v-for="item in wasteTypes" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Unit">
          <el-select v-model="filters.unitId" placeholder="Select unit" clearable>
             <el-option v-for="item in units" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAnalysisData">Apply</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="chart-card">
          <v-chart class="chart" :option="trendOptions" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
       <el-col :span="12">
        <el-card class="chart-card">
          <v-chart class="chart" :option="compositionOptions" autoresize />
        </el-card>
      </el-col>
       <el-col :span="12">
        <el-card class="chart-card">
          <v-chart class="chart" :option="unitPerformanceOptions" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import httpService from '../config/httpService';
import { ElMessage } from 'element-plus';

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

export default {
  name: 'DataAnalysis',
  components: {
    VChart,
  },
  setup() {
    const filters = reactive({
      dateRange: null,
      wasteTypeId: null,
      unitId: null,
    });

    const wasteTypes = ref([]);
    const units = ref([]);

    const trendOptions = ref({});
    const compositionOptions = ref({});
    const unitPerformanceOptions = ref({});

    const fetchFilterOptions = async () => {
      try {
        const [typesRes, unitsRes] = await Promise.all([
          httpService.get('/waste-types'),
          httpService.get('/units'),
        ]);
        wasteTypes.value = typesRes.data;
        units.value = unitsRes.data;
      } catch (error) {
        ElMessage.error('Failed to load filter options.');
      }
    };

    const fetchAnalysisData = async () => {
      try {
        const params = {
            startDate: filters.dateRange ? filters.dateRange[0] : null,
            endDate: filters.dateRange ? filters.dateRange[1] : null,
            wasteTypeId: filters.wasteTypeId,
            unitId: filters.unitId
        };

        const [trendsRes, compositionRes, unitPerfRes] = await Promise.all([
          httpService.get('/analysis/trends', { params }),
          httpService.get('/analysis/composition', { params }),
          httpService.get('/analysis/unit-performance', { params }),
        ]);

        updateTrendChart(trendsRes.data);
        updateCompositionChart(compositionRes.data);
        updateUnitPerformanceChart(unitPerfRes.data);

      } catch (error) {
        ElMessage.error('Failed to fetch analysis data.');
      }
    };
    
    const updateTrendChart = (data) => {
      trendOptions.value = {
        title: { text: 'Waste Generation Trends' },
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: data.map(item => item.date)
        },
        yAxis: { type: 'value' },
        series: [{
          data: data.map(item => item.totalQuantity),
          type: 'line'
        }]
      };
    };

    const updateCompositionChart = (data) => {
      compositionOptions.value = {
        title: { text: 'Waste Composition', left: 'center' },
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
    };
    
    const updateUnitPerformanceChart = (data) => {
      unitPerformanceOptions.value = {
        title: { text: 'Waste Generation by Unit' },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: {
          type: 'category',
          data: data.names,
          axisLabel: { interval: 0, rotate: 30 } 
        },
        yAxis: { type: 'value' },
        series: [{
          data: data.values,
          type: 'bar'
        }]
      };
    };

    onMounted(() => {
      fetchFilterOptions();
      fetchAnalysisData();
    });

    return {
      filters,
      wasteTypes,
      units,
      trendOptions,
      compositionOptions,
      unitPerformanceOptions,
      fetchAnalysisData,
    };
  },
};
</script>

<style scoped>
.data-analysis-container {
  padding: 20px;
}
.filter-card {
  margin-bottom: 20px;
}
.chart-card {
  margin-bottom: 20px;
}
.chart {
  height: 400px;
}
</style>
