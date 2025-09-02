const express = require('express');
const router = express.Router();
const { upload } = require('../config/upload');
const {
  createWasteRecord,
  getWasteRecordsByUnit,
  getAllWasteRecords,
  getWasteRecordsByUser,
  exportWasteRecordsByUser,
  getWasteRecordDetail,
  updateWasteRecord,
  deleteWasteRecord
} = require('../controllers/wasteRecordController');
const { authenticateToken, validateSupervisorUnitAccess, requireAdmin } = require('../middleware/auth');

// 对所有废物记录路由应用认证中间件
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Waste Records
 *   description: 废物记录管理
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WasteRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 记录ID
 *         unit_id:
 *           type: integer
 *           description: 单位ID
 *         unit_name:
 *           type: string
 *           description: 单位名称
 *         waste_type_id:
 *           type: integer
 *           description: 废物类型ID
 *         waste_type_name:
 *           type: string
 *           description: 废物类型名称
 *         location:
 *           type: string
 *           description: 收集地点
 *         collection_start_time:
 *           type: string
 *           format: date-time
 *           description: 收集开始时间
 *         photo_path_before:
 *           type: string
 *           description: 收集前照片路径 (多个路径用逗号分隔)
 *         photo_path_after:
 *           type: string
 *           description: 收集后照片路径 (多个路径用逗号分隔)
 *         quantity:
 *           type: number
 *           format: float
 *           description: 数量 (吨)
 *         creator_id:
 *           type: integer
 *           description: 创建者ID
 *         creator_name:
 *           type: string
 *           description: 创建者姓名
 *         remarks:
 *           type: string
 *           description: 备注
 *         process:
 *           type: string
 *           description: 产生工序
 *         is_supervised:
 *           type: integer
 *           description: 是否为监督数据 (1是, 0或null否)
 *         company_id:
 *           type: integer
 *           description: 公司ID
 *         company_name:
 *            type: string
 *            description: 公司名称
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *         longitude:
 *           type: number
 *           format: double
 *           description: 经度
 *         latitude:
 *           type: number
 *           format: double
 *           description: 纬度
 *         address:
 *           type: string
 *           description: 详细地址
 */

/**
 * @swagger
 * /waste-records:
 *   get:
 *     summary: 获取所有废物记录 (仅限管理员)
 *     tags: [Waste Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取废物记录列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WasteRecord'
 *       403:
 *         description: 权限不足
 */
router.get('/', requireAdmin, getAllWasteRecords);

/**
 * @swagger
 * /waste-records:
 *   post:
 *     summary: 创建一个新的废物记录
 *     tags: [Waste Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [unitId, wasteTypeId, location, process]
 *             properties:
 *               unitId:
 *                 type: integer
 *                 description: 单位ID
 *               wasteTypeId:
 *                 type: integer
 *                 description: 废物类型ID
 *               location:
 *                 type: string
 *                 description: 收集地点
 *               process:
 *                 type: string
 *                 description: 产生工序
 *               collectionDate:
 *                 type: string
 *                 format: date
 *                 description: 收集日期 (例如 '2023-10-27')
 *               collectionTime:
 *                 type: string
 *                 description: 收集时间 (例如 '14:30')
 *               quantity:
 *                 type: number
 *                 format: float
 *                 description: 数量 (吨)
 *               remarks:
 *                 type: string
 *                 description: 备注信息
 *               photo_before:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 收集前照片 (最多5张)
 *               photo_after:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 收集后照片 (最多5张)
 *               longitude:
 *                  type: number
 *                  format: double
 *               latitude:
 *                  type: number
 *                  format: double
 *               address:
 *                  type: string
 *     responses:
 *       201:
 *         description: 记录创建成功
 *       400:
 *         description: 请求参数错误
 */
router.post('/',
  validateSupervisorUnitAccess,
  upload.fields([
    { name: 'photo_before', maxCount: 5 },
    { name: 'photo_after', maxCount: 5 }
  ]),
  createWasteRecord
);

/**
 * @swagger
 * /waste-records/export/user/{userId}:
 *   get:
 *     summary: 导出指定用户的废物记录
 *     tags: [Waste Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *       - in: query
 *         name: exportType
 *         schema:
 *           type: string
 *           enum: [no_images, first_image, all_images]
 *         description: 导出类型
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *         description: 日期范围 (例如 '2023-10-01,2023-10-31')
 *     responses:
 *       200:
 *         description: 成功导出数据
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WasteRecord'
 *       404:
 *         description: 用户不存在
 */
router.get('/export/user/:userId', exportWasteRecordsByUser);

/**
 * @swagger
 * /waste-records/detail/{id}:
 *   get:
 *     summary: 获取单个废物记录的详细信息
 *     tags: [Waste Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 废物记录的ID
 *     responses:
 *       200:
 *         description: 成功获取记录详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WasteRecord'
 *       404:
 *         description: 记录不存在
 */
router.get('/detail/:id', getWasteRecordDetail);

/**
 * @swagger
 * /waste-records/user/{userId}:
 *   get:
 *     summary: 获取指定用户创建的废物记录 (分页)
 *     tags: [Waste Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取记录列表
 *       404:
 *         description: 用户不存在
 */
router.get('/user/:userId', getWasteRecordsByUser);

/**
 * @swagger
 * /waste-records/unit/{unitId}:
 *   get:
 *     summary: 获取特定单位的废物记录
 *     tags: [Waste Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 单位ID
 *     responses:
 *       200:
 *         description: 成功获取记录列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WasteRecord'
 */
router.get('/unit/:unitId', validateSupervisorUnitAccess, getWasteRecordsByUnit);

/**
 * @swagger
 * /waste-records/{id}:
 *   put:
 *     summary: 更新一个现有的废物记录
 *     tags: [Waste Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 要更新的废物记录ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               unitId:
 *                 type: integer
 *               wasteTypeId:
 *                 type: integer
 *               location:
 *                 type: string
 *               process:
 *                 type: string
 *               collectionDate:
 *                 type: string
 *                 format: date
 *               collectionTime:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 format: float
 *               remarks:
 *                 type: string
 *               photos_to_remove_before:
 *                 type: string
 *                 description: 要移除的收集前照片路径 (JSON数组字符串)
 *               photos_to_remove_after:
 *                 type: string
 *                 description: 要移除的收集后照片路径 (JSON数组字符串)
 *               photo_before:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 新增的收集前照片
 *               photo_after:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 新增的收集后照片
 *     responses:
 *       200:
 *         description: 记录更新成功
 *       404:
 *         description: 记录不存在
 */
router.put('/:id',
  upload.fields([
    { name: 'photo_before', maxCount: 5 },
    { name: 'photo_after', maxCount: 5 }
  ]),
  updateWasteRecord
);

/**
 * @swagger
 * /waste-records/{id}:
 *   delete:
 *     summary: 删除一个废物记录
 *     tags: [Waste Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 要删除的废物记录ID
 *     responses:
 *       200:
 *         description: 记录删除成功
 *       404:
 *         description: 记录不存在
 */
router.delete('/:id', deleteWasteRecord);

module.exports = router;
