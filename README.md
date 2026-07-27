# CLD-AI 因果回路图智能分析工具

面向个人使用的网页端因果回路图（CLD）绘制与 AI 分析工具。

## 技术栈

- Vite + Vue 3 + TypeScript
- LogicFlow (图形引擎)
- Tailwind CSS
- 硅基流动 API (AI)
- Cloudflare Pages + Pages Functions (部署)

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 部署

1. 在 Cloudflare Pages 中连接仓库
2. 配置环境变量 `SILICONFLOW_API_KEY`
3. 构建命令: `npm run build`
4. 输出目录: `dist`

## 功能

- 图形化拖拽创建节点和连线
- 标注因果极性 (+/-)
- AI 系统动力学分析
- 流式输出打字机效果
- JSON 数据导出
