# AGENTS.md

## 项目概览
课文角色对话智能体 - 让小学生和语文课本中的角色进行互动对话的学习工具。

## 技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **LLM**: coze-coding-dev-sdk (doubao-seed-2-0-mini-260215)

## 目录结构
```
src/
├── app/
│   ├── api/chat/route.ts    # 聊天 API（SSE 流式输出）
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 主页面（角色选择 + 聊天）
│   └── globals.css           # 全局样式
├── components/
│   ├── chat-panel.tsx        # 聊天面板（流式消息渲染）
│   ├── character-selector.tsx # 角色选择器（侧边栏/标签）
│   └── ui/                   # shadcn/ui 组件
├── lib/
│   ├── characters.ts         # 角色数据与系统提示词
│   └── utils.ts              # 工具函数
└── hooks/                    # 自定义 Hooks
```

## 核心功能
1. **角色系统**: 支持多个课文角色（青头、红头、老莺），每个角色有独立的 system prompt
2. **流式对话**: 后端通过 SSE 协议流式输出，前端逐字渲染打字机效果
3. **响应式布局**: 桌面端侧边栏 + 聊天区，移动端顶部标签 + 聊天区

## 开发命令
- 开发: `pnpm dev`
- 构建: `pnpm build`
- 类型检查: `pnpm ts-check`
- Lint: `pnpm lint`

## 添加新角色
在 `src/lib/characters.ts` 中添加新的 Character 对象，包含 id、name、emoji、systemPrompt 等字段即可。
