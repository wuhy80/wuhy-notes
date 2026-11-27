---
tags:
  - Vue
  - 前端开发
  - TypeScript
created: 2026-10-15
updated: 2026-10-15
status: 入口
---

# Vue 技术笔记

Vue 3、TypeScript、组件化架构、状态管理与前后端协同开发资料总览。

## 专题目录

- `基础与语法/`：开发环境搭建、响应式机制（ref/reactive）与 JSX 语法。
- `工程与类型/`：TypeScript 严格类型校验与 Pinia 状态树管理。
- `组件与通信/`：组件通信全景方案、Element Plus 组件库实战。
- `全栈协同/`：与 Go/Gin 后端集成、JWT 鉴权流水线与多服务代理。

---

## 快速入口

### 基础与核心特性

- [[技术笔记/Vue/搭建开发环境|搭建开发环境]] —— Vue 3 开发环境搭建与工程化脚手架配置
- [[技术笔记/Vue/响应式/基本概念|响应式基本概念]] —— ref、reactive、toRefs 与依赖追踪原理解析
- [[技术笔记/Vue/JSX/JSX简要|JSX 语法简要]] —— 在 Vue 3 中使用 JSX/TSX 渲染模板
- [[技术笔记/Vue/常见问题|常见问题排查]] —— 常见响应式失效与踩坑清单

### 类型系统与状态管理

- [[技术笔记/Vue/TypeScript/类型校验|TypeScript 类型校验]] —— Props、Emits、Ref 与自定义接口类型推导
- [[技术笔记/Vue/Pinia使用|Pinia 状态管理]] —— Store 定义、Getters、Actions 与状态持久化

### 组件通信与 UI 库

- [[技术笔记/Vue/组件通讯/Vue3 过10种组件通讯方式|Vue3 10+ 种组件通讯方式]] —— Props/Emits、Provide/Inject、mitt、v-model 全景对比
- [[技术笔记/Vue/Element-Plus组件/使用时间范围选择|Element-Plus 时间范围选择]] —— DatePicker 时间范围约束与格式化

### 前后端集成与鉴权安全

- [[技术笔记/Vue/后端集成/和Gin做集成|与 Gin 后端集成]] —— Axios 请求封装、拦截器与统一响应处理
- [[技术笔记/Vue/后端集成/如何访问多个后端|如何访问多个后端服务]] —— Vite 代理（proxy）配置与多微服务端点管理
- [[技术笔记/Vue/组件通讯/JWT详解|JWT 详解与应用]] —— Token 组成、无状态签名与安全存储
- [[技术笔记/Vue/权限管理/使用Gin和Vue实现Token|Gin 与 Vue Token 鉴权联动]] —— 路由守卫与前后端统一 Token 校验
