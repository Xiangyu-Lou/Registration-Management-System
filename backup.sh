#!/bin/bash

# 配置备份目录
BACKUP_DIR="/home/ecs-user/backups"
mkdir -p "$BACKUP_DIR"

# 时间戳
DATE=$(date +"%Y-%m-%d")

# MySQL 备份配置
DB_NAME="waste_management"
DB_USER="Xiangyu"
DB_PASSWORD="990924"

# 需要备份的文件夹
SOURCE_DIR="/home/ecs-user/Registration-Management-System/uploads"
TAR_FILE="$BACKUP_DIR/files_backup_$DATE.tar.gz"

# 备份 MySQL 数据库
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# 备份指定文件夹
tar -czf "$TAR_FILE" "$SOURCE_DIR"

# 清理 7 天前的旧备份
find "$BACKUP_DIR" -type f -name "*.gz" -mtime +3 -exec rm -f {} \;
# 记录日志
echo "Backup completed on $DATE" >> "$BACKUP_DIR/backup.log"

