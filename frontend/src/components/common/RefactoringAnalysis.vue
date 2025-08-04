<template>
  <div class="refactoring-analysis">
    <div class="header">
      <h1>前端组件重构成果分析</h1>
      <p class="subtitle">通过数据可视化展示重构带来的改进效果</p>
    </div>

    <!-- 概览卡片 -->
    <div class="overview-cards">
      <div class="card">
        <div class="card-icon success">
          <el-icon><document /></el-icon>
        </div>
        <div class="card-content">
          <h3>{{ totalCodeReduction }}%</h3>
          <p>代码总体减少</p>
        </div>
      </div>
      <div class="card">
        <div class="card-icon primary">
          <el-icon><timer /></el-icon>
        </div>
        <div class="card-content">
          <h3>{{ devTimeReduction }}%</h3>
          <p>开发时间节省</p>
        </div>
      </div>
      <div class="card">
        <div class="card-icon warning">
          <el-icon><tools /></el-icon>
        </div>
        <div class="card-content">
          <h3>{{ maintenanceImprovement }}%</h3>
          <p>维护性提升</p>
        </div>
      </div>
      <div class="card">
        <div class="card-icon info">
          <el-icon><connection /></el-icon>
        </div>
        <div class="card-content">
          <h3>{{ reusabilityScore }}%</h3>
          <p>组件复用率</p>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 代码行数对比 -->
      <div class="chart-section">
        <h2>代码行数对比</h2>
        <div class="chart-wrapper">
          <canvas ref="codeComparisonChart" width="400" height="300"></canvas>
        </div>
      </div>

      <!-- 组件复杂度分析 -->
      <div class="chart-section">
        <h2>组件复杂度分析</h2>
        <div class="chart-wrapper">
          <canvas ref="complexityChart" width="400" height="300"></canvas>
        </div>
      </div>

      <!-- 开发效率提升 -->
      <div class="chart-section">
        <h2>开发效率提升</h2>
        <div class="chart-wrapper">
          <canvas ref="efficiencyChart" width="400" height="300"></canvas>
        </div>
      </div>

      <!-- 重构收益雷达图 -->
      <div class="chart-section full-width">
        <h2>重构收益雷达图</h2>
        <div class="chart-wrapper">
          <canvas ref="radarChart" width="600" height="400"></canvas>
        </div>
      </div>
    </div>

    <!-- 详细对比表格 -->
    <div class="comparison-table">
      <h2>详细对比数据</h2>
      <el-table :data="comparisonData" border stripe>
        <el-table-column prop="component" label="组件类型" width="150" />
        <el-table-column prop="beforeLines" label="重构前(行)" width="120" align="center" />
        <el-table-column prop="afterLines" label="重构后(行)" width="120" align="center" />
        <el-table-column prop="reduction" label="减少量" width="100" align="center">
          <template #default="scope">
            <span class="reduction-text">{{ scope.row.reduction }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeComplexity" label="重构前复杂度" width="140" align="center" />
        <el-table-column prop="afterComplexity" label="重构后复杂度" width="140" align="center" />
        <el-table-column prop="reusability" label="复用性" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getReusabilityType(scope.row.reusability)">
              {{ scope.row.reusability }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maintainability" label="可维护性" width="120" align="center">
          <template #default="scope">
            <el-progress 
              :percentage="scope.row.maintainability" 
              :status="getProgressStatus(scope.row.maintainability)"
              :show-text="false"
            />
            <span style="margin-left: 10px;">{{ scope.row.maintainability }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 投资回报分析 -->
    <div class="roi-analysis">
      <h2>投资回报分析 (ROI)</h2>
      <div class="roi-cards">
        <div class="roi-card">
          <h3>一次性投入</h3>
          <div class="roi-value negative">{{ refactoringCost }}工时</div>
          <p>重构开发时间</p>
        </div>
        <div class="roi-card">
          <h3>月度节省</h3>
          <div class="roi-value positive">{{ monthlySavings }}工时</div>
          <p>开发效率提升</p>
        </div>
        <div class="roi-card">
          <h3>回收周期</h3>
          <div class="roi-value info">{{ paybackPeriod }}个月</div>
          <p>成本回收时间</p>
        </div>
        <div class="roi-card">
          <h3>年度ROI</h3>
          <div class="roi-value success">{{ annualROI }}%</div>
          <p>年投资回报率</p>
        </div>
      </div>
    </div>

    <!-- 质量指标 -->
    <div class="quality-metrics">
      <h2>代码质量指标</h2>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-icon">📊</div>
          <h4>圈复杂度</h4>
          <div class="metric-comparison">
            <span class="before">平均 {{ beforeCyclomaticComplexity }}</span>
            <span class="arrow">→</span>
            <span class="after">平均 {{ afterCyclomaticComplexity }}</span>
          </div>
          <div class="improvement">降低 {{ ((beforeCyclomaticComplexity - afterCyclomaticComplexity) / beforeCyclomaticComplexity * 100).toFixed(1) }}%</div>
        </div>

        <div class="metric-item">
          <div class="metric-icon">🔧</div>
          <h4>可维护性指数</h4>
          <div class="metric-comparison">
            <span class="before">{{ beforeMaintainabilityIndex }}</span>
            <span class="arrow">→</span>
            <span class="after">{{ afterMaintainabilityIndex }}</span>
          </div>
          <div class="improvement">提升 {{ ((afterMaintainabilityIndex - beforeMaintainabilityIndex) / beforeMaintainabilityIndex * 100).toFixed(1) }}%</div>
        </div>

        <div class="metric-item">
          <div class="metric-icon">🎯</div>
          <h4>代码重复率</h4>
          <div class="metric-comparison">
            <span class="before">{{ beforeDuplicationRate }}%</span>
            <span class="arrow">→</span>
            <span class="after">{{ afterDuplicationRate }}%</span>
          </div>
          <div class="improvement">降低 {{ (beforeDuplicationRate - afterDuplicationRate).toFixed(1) }}个百分点</div>
        </div>

        <div class="metric-item">
          <div class="metric-icon">📦</div>
          <h4>模块耦合度</h4>
          <div class="metric-comparison">
            <span class="before">{{ beforeCouplingLevel }}</span>
            <span class="arrow">→</span>
            <span class="after">{{ afterCouplingLevel }}</span>
          </div>
          <div class="improvement">{{ couplingImprovement }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { Document, Timer, Tools, Connection } from '@element-plus/icons-vue';

export default {
  name: 'RefactoringAnalysis',
  components: {
    Document,
    Timer,
    Tools,
    Connection
  },
  setup() {
    // 图表引用
    const codeComparisonChart = ref(null);
    const complexityChart = ref(null);
    const efficiencyChart = ref(null);
    const radarChart = ref(null);

    // 基础数据
    const refactoringData = {
      components: [
        { name: '数据表格', beforeLines: 80, afterLines: 10, beforeComplexity: 8, afterComplexity: 3 },
        { name: '表单对话框', beforeLines: 150, afterLines: 30, beforeComplexity: 12, afterComplexity: 4 },
        { name: '筛选组件', beforeLines: 60, afterLines: 15, beforeComplexity: 6, afterComplexity: 2 },
        { name: '图片预览', beforeLines: 45, afterLines: 8, beforeComplexity: 5, afterComplexity: 2 }
      ]
    };

    // 计算指标
    const totalCodeReduction = computed(() => {
      const totalBefore = refactoringData.components.reduce((sum, comp) => sum + comp.beforeLines, 0);
      const totalAfter = refactoringData.components.reduce((sum, comp) => sum + comp.afterLines, 0);
      return Math.round((totalBefore - totalAfter) / totalBefore * 100);
    });

    const devTimeReduction = ref(65);
    const maintenanceImprovement = ref(80);
    const reusabilityScore = ref(90);

    // 对比数据
    const comparisonData = computed(() => {
      return refactoringData.components.map(comp => ({
        component: comp.name,
        beforeLines: comp.beforeLines,
        afterLines: comp.afterLines,
        reduction: Math.round((comp.beforeLines - comp.afterLines) / comp.beforeLines * 100),
        beforeComplexity: `高 (${comp.beforeComplexity})`,
        afterComplexity: `低 (${comp.afterComplexity})`,
        reusability: comp.afterLines < 20 ? '优秀' : '良好',
        maintainability: Math.min(95, 60 + (comp.beforeLines - comp.afterLines) / comp.beforeLines * 40)
      }));
    });

    // ROI 数据
    const refactoringCost = ref(40);
    const monthlySavings = ref(20);
    const paybackPeriod = computed(() => Math.ceil(refactoringCost.value / monthlySavings.value));
    const annualROI = computed(() => Math.round((monthlySavings.value * 12 - refactoringCost.value) / refactoringCost.value * 100));

    // 质量指标
    const beforeCyclomaticComplexity = ref(7.8);
    const afterCyclomaticComplexity = ref(2.9);
    const beforeMaintainabilityIndex = ref(58);
    const afterMaintainabilityIndex = ref(85);
    const beforeDuplicationRate = ref(23.5);
    const afterDuplicationRate = ref(8.2);
    const beforeCouplingLevel = ref('高');
    const afterCouplingLevel = ref('低');
    const couplingImprovement = ref('显著改善');

    // 工具函数
    const getReusabilityType = (reusability) => {
      if (reusability === '优秀') return 'success';
      if (reusability === '良好') return 'warning';
      return 'info';
    };

    const getProgressStatus = (percentage) => {
      if (percentage >= 80) return 'success';
      if (percentage >= 60) return '';
      return 'warning';
    };

    // 创建图表的函数
    const createCodeComparisonChart = () => {
      const ctx = codeComparisonChart.value.getContext('2d');
      const components = refactoringData.components.map(c => c.name);
      const beforeData = refactoringData.components.map(c => c.beforeLines);
      const afterData = refactoringData.components.map(c => c.afterLines);

      // 简单的柱状图绘制
      ctx.clearRect(0, 0, 400, 300);
      
      const barWidth = 40;
      const spacing = 20;
      const maxValue = Math.max(...beforeData);
      const scale = 200 / maxValue;

      components.forEach((component, index) => {
        const x = 50 + index * (barWidth * 2 + spacing);
        const beforeHeight = beforeData[index] * scale;
        const afterHeight = afterData[index] * scale;

        // 绘制重构前的柱子（红色）
        ctx.fillStyle = '#f56565';
        ctx.fillRect(x, 250 - beforeHeight, barWidth, beforeHeight);

        // 绘制重构后的柱子（绿色）
        ctx.fillStyle = '#38a169';
        ctx.fillRect(x + barWidth + 5, 250 - afterHeight, barWidth, afterHeight);

        // 绘制标签
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(component, x + barWidth, 270);
        
        // 绘制数值
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.fillText(beforeData[index], x + barWidth/2, 245 - beforeHeight);
        ctx.fillText(afterData[index], x + barWidth + 5 + barWidth/2, 245 - afterHeight);
      });

      // 绘制图例
      ctx.fillStyle = '#f56565';
      ctx.fillRect(50, 20, 15, 15);
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('重构前', 70, 32);

      ctx.fillStyle = '#38a169';
      ctx.fillRect(150, 20, 15, 15);
      ctx.fillStyle = '#000';
      ctx.fillText('重构后', 170, 32);
    };

    const createComplexityChart = () => {
      const ctx = complexityChart.value.getContext('2d');
      const components = refactoringData.components.map(c => c.name);
      const beforeComplexity = refactoringData.components.map(c => c.beforeComplexity);
      const afterComplexity = refactoringData.components.map(c => c.afterComplexity);

      ctx.clearRect(0, 0, 400, 300);

      const barWidth = 30;
      const spacing = 25;
      const maxValue = Math.max(...beforeComplexity);
      const scale = 180 / maxValue;

      components.forEach((component, index) => {
        const x = 40 + index * (barWidth * 2 + spacing);
        const beforeHeight = beforeComplexity[index] * scale;
        const afterHeight = afterComplexity[index] * scale;

        // 绘制复杂度柱子
        ctx.fillStyle = '#e53e3e';
        ctx.fillRect(x, 230 - beforeHeight, barWidth, beforeHeight);

        ctx.fillStyle = '#3182ce';
        ctx.fillRect(x + barWidth + 5, 230 - afterHeight, barWidth, afterHeight);

        // 标签
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(component, x + barWidth, 250);
      });

      // 图例
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(40, 20, 12, 12);
      ctx.fillStyle = '#000';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('重构前复杂度', 55, 30);

      ctx.fillStyle = '#3182ce';
      ctx.fillRect(160, 20, 12, 12);
      ctx.fillText('重构后复杂度', 175, 30);
    };

    const createEfficiencyChart = () => {
      const ctx = efficiencyChart.value.getContext('2d');
      
      ctx.clearRect(0, 0, 400, 300);

      // 绘制折线图显示效率提升
      const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
      const efficiency = [100, 165, 180, 190, 195, 200]; // 效率指数

      const xStep = 300 / (months.length - 1);
      const yScale = 150 / 100; // 最大值200

      ctx.strokeStyle = '#38a169';
      ctx.lineWidth = 3;
      ctx.beginPath();

      months.forEach((month, index) => {
        const x = 50 + index * xStep;
        const y = 200 - (efficiency[index] - 100) * yScale;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // 绘制数据点
        ctx.fillStyle = '#38a169';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // 绘制标签
        ctx.fillStyle = '#000';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(month, x, 280);
        ctx.fillText(efficiency[index] + '%', x, y - 10);
      });

      ctx.stroke();

      // 标题
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('开发效率提升趋势', 200, 25);
    };

    const createRadarChart = () => {
      const ctx = radarChart.value.getContext('2d');
      const centerX = 300;
      const centerY = 200;
      const radius = 120;

      ctx.clearRect(0, 0, 600, 400);

      const metrics = [
        { name: '代码减少', before: 30, after: 85 },
        { name: '复用性', before: 20, after: 90 },
        { name: '可维护性', before: 40, after: 85 },
        { name: '开发效率', before: 50, after: 80 },
        { name: '代码质量', before: 35, after: 88 },
        { name: '一致性', before: 25, after: 92 }
      ];

      const angleStep = (2 * Math.PI) / metrics.length;

      // 绘制背景网格
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // 绘制轴线
      metrics.forEach((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      // 绘制重构前数据（红色）
      ctx.strokeStyle = '#e53e3e';
      ctx.fillStyle = 'rgba(229, 62, 62, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      metrics.forEach((metric, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const value = (metric.before / 100) * radius;
        const x = centerX + Math.cos(angle) * value;
        const y = centerY + Math.sin(angle) * value;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 绘制重构后数据（绿色）
      ctx.strokeStyle = '#38a169';
      ctx.fillStyle = 'rgba(56, 161, 105, 0.2)';
      ctx.beginPath();
      metrics.forEach((metric, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const value = (metric.after / 100) * radius;
        const x = centerX + Math.cos(angle) * value;
        const y = centerY + Math.sin(angle) * value;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 绘制标签
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      metrics.forEach((metric, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius + 30);
        const y = centerY + Math.sin(angle) * (radius + 30);

        ctx.fillText(metric.name, x, y);
      });

      // 图例
      ctx.fillStyle = '#e53e3e';
      ctx.fillRect(50, 50, 15, 15);
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('重构前', 70, 62);

      ctx.fillStyle = '#38a169';
      ctx.fillRect(50, 75, 15, 15);
      ctx.fillText('重构后', 70, 87);
    };

    onMounted(() => {
      // 延迟创建图表，确保DOM已渲染
      setTimeout(() => {
        createCodeComparisonChart();
        createComplexityChart();
        createEfficiencyChart();
        createRadarChart();
      }, 100);
    });

    return {
      codeComparisonChart,
      complexityChart,
      efficiencyChart,
      radarChart,
      totalCodeReduction,
      devTimeReduction,
      maintenanceImprovement,
      reusabilityScore,
      comparisonData,
      refactoringCost,
      monthlySavings,
      paybackPeriod,
      annualROI,
      beforeCyclomaticComplexity,
      afterCyclomaticComplexity,
      beforeMaintainabilityIndex,
      afterMaintainabilityIndex,
      beforeDuplicationRate,
      afterDuplicationRate,
      beforeCouplingLevel,
      afterCouplingLevel,
      couplingImprovement,
      getReusabilityType,
      getProgressStatus
    };
  }
};
</script>

<style scoped>
.refactoring-analysis {
  padding: 20px;
  background-color: #f7fafc;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 32px;
  color: #2d3748;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  color: #718096;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-icon.success { background-color: #c6f6d5; color: #38a169; }
.card-icon.primary { background-color: #bee3f8; color: #3182ce; }
.card-icon.warning { background-color: #faf089; color: #d69e2e; }
.card-icon.info { background-color: #e6fffa; color: #319795; }

.card-content h3 {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  color: #2d3748;
}

.card-content p {
  margin: 5px 0 0 0;
  color: #718096;
  font-size: 14px;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chart-section.full-width {
  grid-column: 1 / -1;
}

.chart-section h2 {
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 18px;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
}

.comparison-table {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.comparison-table h2 {
  margin: 0 0 20px 0;
  color: #2d3748;
}

.reduction-text {
  color: #38a169;
  font-weight: bold;
}

.roi-analysis {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.roi-analysis h2 {
  margin: 0 0 20px 0;
  color: #2d3748;
}

.roi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.roi-card {
  text-align: center;
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
}

.roi-card h3 {
  margin: 0 0 10px 0;
  color: #4a5568;
  font-size: 14px;
}

.roi-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.roi-value.negative { color: #e53e3e; }
.roi-value.positive { color: #38a169; }
.roi-value.info { color: #3182ce; }
.roi-value.success { color: #38a169; }

.roi-card p {
  margin: 0;
  color: #718096;
  font-size: 12px;
}

.quality-metrics {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.quality-metrics h2 {
  margin: 0 0 20px 0;
  color: #2d3748;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.metric-item {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
}

.metric-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.metric-item h4 {
  margin: 0 0 15px 0;
  color: #2d3748;
}

.metric-comparison {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
}

.before {
  color: #e53e3e;
  font-weight: bold;
}

.after {
  color: #38a169;
  font-weight: bold;
}

.arrow {
  color: #718096;
}

.improvement {
  color: #38a169;
  font-size: 14px;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .roi-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .roi-cards {
    grid-template-columns: 1fr;
  }
}
</style> 