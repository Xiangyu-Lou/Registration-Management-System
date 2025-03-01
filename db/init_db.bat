@echo off
echo 正在初始化危险废物管理系统数据库...

set DB_PATH=%~dp0waste_management.db
set SQL_PATH=%~dp0init.sql

REM 如果数据库文件已存在，则删除它
if exist "%DB_PATH%" (
    echo 删除现有数据库文件...
    del "%DB_PATH%"
)

echo 创建新数据库...

REM 创建数据库并执行SQL脚本
sqlite3 "%DB_PATH%" < "%SQL_PATH%"

if errorlevel 1 (
    echo 数据库初始化失败！
    exit /b 1
) else (
    echo 数据库初始化成功！
    echo 数据库路径: %DB_PATH%
)
