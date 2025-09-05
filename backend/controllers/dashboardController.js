const { db } = require('../config/database');

// 获取仪表盘数据
const getDashboardData = async (req, res, next) => {
  try {
    // 1. 各单位废物数量对比 (按单位分组，计算总重量)
    const wasteByUnit = await db('waste_records as wr')
      .join('units as u', 'wr.unit_id', 'u.id')
      .select('u.name')
      .sum('wr.weight as total_weight')
      .groupBy('u.name')
      .orderBy('total_weight', 'desc');

    // 2. 不同废物类型的占比 (按废物类型分组，计算总重量)
    const wasteByType = await db('waste_records as wr')
      .join('waste_types as wt', 'wr.waste_type_id', 'wt.id')
      .select('wt.name')
      .sum('wr.weight as total_weight')
      .groupBy('wt.name')
      .orderBy('total_weight', 'desc');

    // 3. 废物产生趋势 (按日期分组，计算每日总重量)
    const wasteTrend = await db('waste_records')
      .select(db.raw('DATE(created_at) as date'), db.raw('SUM(weight) as total_weight'))
      .groupBy('date')
      .orderBy('date', 'asc');

    res.json({
      wasteByUnit,
      wasteByType,
      wasteTrend
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData
};
