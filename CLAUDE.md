# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Express 5 + TypeScript 的后端 API 服务，提供用户管理、RBAC 权限系统和 AI 聊天功能。数据存储在内存中（无数据库），适合作为演示或开发环境使用。

## 常用命令

```bash
# 开发模式（热重载）
npm run dev

# 生产构建
npm run build

# 运行构建产物
node dist/index.js
```

项目使用 pnpm 作为包管理器，Node.js 22 作为运行时。

## 代码架构

### 入口和中间件

- `src/index.ts` - 程序入口，导入所有功能模块
- `src/app.ts` - Express 配置、CORS、认证中间件、8080 端口

### 认证机制

- `src/auth.ts` - Session 管理，使用 Cookie + sessionMap 存储
- 免认证路由定义在 `app.ts` 的 `noAuthRoutes` 数组中
- Session 60 分钟无活动自动过期

### 用户和权限模块

- `src/user.ts` - 用户 CRUD，权限自动从角色计算
- `src/role.ts` - 角色管理，关联权限列表
- `src/permission.ts` - 权限管理，支持树形结构（parent 字段）

### AI 模块

- `src/ai/index.ts` - 微信公众号集成，文本润色功能
- `src/ai/nuxt-ai.ts` - 通用 AI 聊天接口（SSE 流式响应）

两者都使用阿里云通义千问 API。

### 工具模块

- `src/tree.ts` - `arrayToTree()` 扁平数组转树结构
- `src/date.ts` - 日期工具函数
- `src/util.ts` - 通用工具（响应包装、随机函数）

## 关键数据结构

用户通过 `roleList` 关联角色，权限通过角色的 `permissionList` 动态计算。权限支持树形结构，通过 `parent` 字段建立层级关系。

## API 响应格式

统一使用 `commonRes` / `commonErrorRes` 包装：
```typescript
{ code: 200, msg: 'success', data: any }
{ code: number, msg: 'error message' }
```

## 注意事项

- 所有数据存储在内存中，重启后数据重置
- AI 相关的 API Key 硬编码在源码中
- 项目无测试框架和 lint 工具
