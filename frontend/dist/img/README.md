# 关于网站图标（Favicon）

## 当前图标

当前系统使用了一个简单的SVG图标作为浏览器标签页的图标（favicon）。这是一个临时的占位图标，您可以随时替换为您自己的图标。

## 如何替换图标

要替换当前的图标，您需要：

1. 准备您的图标文件，建议同时准备以下格式：
   - SVG格式（矢量图，可缩放）
   - ICO格式（用于不支持SVG的旧浏览器）
   - PNG格式（可选，用于更好的兼容性）

2. 将您的图标文件命名为以下名称并放置在 `frontend/public/` 目录下：
   - `favicon.svg`（主要图标）
   - `favicon.ico`（后备图标）

3. 如果您想使用不同的文件名或路径，请相应地修改 `frontend/public/index.html` 文件中的图标引用。

## 图标尺寸建议

- SVG：矢量格式，尺寸不限
- ICO：建议包含多个尺寸（16x16, 32x32, 48x48）
- PNG：建议至少准备 192x192 像素的版本

## 在线工具

您可以使用以下在线工具来创建或转换图标：

- [Favicon.io](https://favicon.io/) - 可以从文本、图像或表情符号创建图标
- [RealFaviconGenerator](https://realfavicongenerator.net/) - 生成各种设备的图标
- [Convertio](https://convertio.co/) - 转换各种图像格式

## 注意事项

更新图标后，您可能需要清除浏览器缓存才能看到新图标。 