- [x] 登录页面取消账号类型选择
- [ ] 数量（吨）点击后显示合计
- [x] 调整废物记录列表表头样式
- [x] 增加序号
- [x] 废物类型增加一般固废物
- [x] 增加备注栏
- [x] 员工移除删除按钮
- [x] 员工的查看权限只有7天
- [x] 汇报人改为填报人
- [x] 删除用户后记录还要存在
- [x] 用户管理页面ID显示删掉
- [x] 系统名改为固体废物管理系统
- [x] logo照片
- [ ] 域名：www.slytgfgl.com
- [x] 超级管理员用户查询页面改名：固体废物管理系统历史记录

ALTER TABLE waste_management.waste_records ADD COLUMN remarks TEXT;

INSERT INTO waste_management.waste_types VALUES ('一般固废物');

ALTER TABLE waste_records DROP COLUMN creator_name;

ALTER TABLE waste_management.users ADD COLUMN status TINYINT DEFAULT 1 COMMENT '账号状态：0-停用，1-正常';