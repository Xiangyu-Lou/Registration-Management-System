const Feedback = require('../models/Feedback');

// 创建问题反馈
const createFeedback = async (req, res) => {
  try {
    const { title, description, type, priority } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    // 验证必填字段
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        message: '标题和问题描述不能为空' 
      });
    }

    const feedbackData = {
      user_id: userId,
      company_id: companyId,
      title: title.trim(),
      description: description.trim(),
      type: type || 'bug',
      priority: priority || 'medium',
      images: null
    };

    const feedbackId = await Feedback.create(feedbackData);

    // console.log(`用户 ${userId} 提交了问题反馈 ${feedbackId}`, {
    //   userId,
    //   feedbackId,
    //   title: feedbackData.title,
    //   type: feedbackData.type
    // });

    res.json({
      success: true,
      message: '问题反馈提交成功',
      data: { id: feedbackId }
    });

  } catch (error) {
    console.error('创建问题反馈失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

// 获取用户的问题反馈列表
const getUserFeedbacks = async (req, res) => {
  try {
    const userId = req.user.id;
    const feedbacks = await Feedback.getByUserId(userId);

    res.json({
      success: true,
      data: feedbacks
    });

  } catch (error) {
    console.error('获取用户问题反馈失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

// 获取所有问题反馈（管理员专用）
const getAllFeedbacks = async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user.role_id !== 5 && req.user.role_id !== 3) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

    const { company_id, status, type } = req.query;
    const filters = {};

    // 如果是公司管理员，只能查看自己公司的反馈
    if (req.user.role_id === 3) {
      filters.company_id = req.user.company_id;
    } else if (company_id) {
      // 系统超级管理员可以指定公司
      filters.company_id = company_id;
    }

    if (status) filters.status = status;
    if (type) filters.type = type;

    const feedbacks = await Feedback.getAll(filters);

    res.json({
      success: true,
      data: feedbacks
    });

  } catch (error) {
    console.error('获取问题反馈列表失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

// 获取问题反馈详情
const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.getById(id);

    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: '问题反馈不存在' 
      });
    }

    // 权限检查：用户只能查看自己的反馈，管理员可以查看相应范围的反馈
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      if (feedback.user_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: '权限不足' 
        });
      }
    } else if (req.user.role_id === 3) {
      // 公司管理员只能查看自己公司的反馈
      if (feedback.company_id !== req.user.company_id) {
        return res.status(403).json({ 
          success: false, 
          message: '权限不足' 
        });
      }
    }
    // 系统超级管理员可以查看所有反馈

    res.json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('获取问题反馈详情失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

// 更新问题反馈状态（管理员专用）
const updateFeedbackStatus = async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user.role_id !== 5 && req.user.role_id !== 3) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

    const { id } = req.params;
    const { status, admin_reply } = req.body;

    // 验证状态值
    const validStatuses = ['pending', 'processing', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的状态值' 
      });
    }

    // 获取反馈信息以进行权限检查
    const feedback = await Feedback.getById(id);
    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: '问题反馈不存在' 
      });
    }

    // 公司管理员只能处理自己公司的反馈
    if (req.user.role_id === 3 && feedback.company_id !== req.user.company_id) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

    const success = await Feedback.updateStatus(id, status, req.user.id, admin_reply);

    if (success) {
      // console.log(`管理员 ${req.user.id} 更新了问题反馈 ${id} 的状态为 ${status}`, {
      //   adminId: req.user.id,
      //   feedbackId: id,
      //   newStatus: status
      // });

      res.json({
        success: true,
        message: '状态更新成功'
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: '状态更新失败' 
      });
    }

  } catch (error) {
    console.error('更新问题反馈状态失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

// 删除问题反馈
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取反馈信息以进行权限检查
    const feedback = await Feedback.getById(id);
    if (!feedback) {
      return res.status(404).json({ 
        success: false, 
        message: '问题反馈不存在' 
      });
    }

    // 权限检查：用户只能删除自己的反馈，管理员可以删除相应范围的反馈
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      if (feedback.user_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: '权限不足' 
        });
      }
    } else if (req.user.role_id === 3) {
      // 公司管理员只能删除自己公司的反馈
      if (feedback.company_id !== req.user.company_id) {
        return res.status(403).json({ 
          success: false, 
          message: '权限不足' 
        });
      }
    }
    // 系统超级管理员可以删除所有反馈

    // 不再需要删除图片文件，因为已移除图片功能

    const success = await Feedback.delete(id);

    if (success) {
      // console.log(`用户 ${req.user.id} 删除了问题反馈 ${id}`, {
      //   userId: req.user.id,
      //   feedbackId: id
      // });

      res.json({
        success: true,
        message: '删除成功'
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: '删除失败' 
      });
    }

  } catch (error) {
    console.error('删除问题反馈失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

// 获取统计数据（管理员专用）
const getFeedbackStats = async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user.role_id !== 5 && req.user.role_id !== 3) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

    let companyId = null;
    
    // 如果是公司管理员，只统计自己公司的数据
    if (req.user.role_id === 3) {
      companyId = req.user.company_id;
    } else if (req.query.company_id) {
      // 系统超级管理员可以指定公司
      companyId = req.query.company_id;
    }

    const stats = await Feedback.getStats(companyId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取问题反馈统计失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
};

module.exports = {
  createFeedback,
  getUserFeedbacks,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats
}; 