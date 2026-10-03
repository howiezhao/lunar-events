# 农历周期活动

![Static Badge](https://img.shields.io/badge/TypeScript-5.5.3-blue) ![Static Badge](https://img.shields.io/badge/React-18.3.1-blue) ![Static Badge](https://img.shields.io/badge/Vite-8.3.1-blue) ![GitHub deployments](https://img.shields.io/github/deployments/howiezhao/lunar-events/github-pages)

基于天文算法精确推算农历日期，创建农历年度重复活动并导出 ICS 文件。

在线使用：https://howiezhao.github.io/lunar-events

## 功能特性

- **精确的农历日历** — 使用 Jean Meeus《天文算法》中的新月公式，精度 ±2 分钟，无需预置数据表
- **完整的农历显示** — 天干地支年名、初一/十五高亮、今日标记、闰月支持
- **农历周期活动** — 为任意农历日期生成 2000–2060 年间对应的每一个公历日期
- **ICS 文件导出** — 下载后直接导入 Google 日历、Apple 日历、Outlook
- **响应式设计** — 完美适配电脑、平板、手机等不同屏幕尺寸

## 快速开始

使用以下命令在本地运行：

```bash
cd lunar-events
npm install
npm run dev
```

打开 http://localhost:5173 即可使用。

## 构建部署

项目基于 GitHub Actions 自动部署到 GitHub Pages，也可以使用以下命令手动构建部署：

```bash
npm run build   # 输出到 dist/
npm run preview # 预览构建结果
```

## 参与贡献

欢迎提交任何 PR 和 Issue。

## 开源协议

本仓库采用 [Apache-2.0 许可证](LICENSE)。
