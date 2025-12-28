# Tabminal 项目文档

## 项目概述

Tabminal 是一个云原生、主动 AI 集成的 Web 终端应用，专为现代浏览器设计。它允许用户在桌面、平板和手机上无缝编码，提供智能、持久且丰富的终端体验。

### 核心特性

- **服务端会话持久化**：确保与 AI 代理的会话得以维护，允许随时恢复工作
- **快速稳定的连接管理**：跨平台和设备提供流畅、敏捷的体验，原生支持网络漫游
- **PWA 体验**：只需现代浏览器即可随时随地工作
- **主动 AI 集成**：终端成为工作上下文，可随时询问当前会话相关问题，命令失败时自动提供修复建议
- **云原生设计**：通过 Zero Trust 或 VPN 访问，为管理云服务器提供前所未有的便利
- **移动端优化**：专为 iPadOS 和 iOS 设计，支持 HHKB 虚拟键盘
- **内置编辑器**：集成 Monaco Editor（VS Code 核心），可直接在服务器上编辑文件
- **可视化文件管理器**：侧边栏文件树，便于导航

### 技术栈

**后端：**
- Node.js (>= 22)
- Koa.js（Web 框架）
- node-pty（终端模拟）
- WebSocket（实时通信）
- utilitas（AI 集成）

**前端：**
- 原生 JavaScript（无框架）
- xterm.js（终端渲染）
- Monaco Editor（代码编辑）
- Bootstrap CSS（样式）

**AI：**
- 通过 OpenRouter 集成现代 AI 模型
- 默认使用 Gemini 2.5 Flash（速度/性能平衡）
- 支持上下文感知聊天、自动修复、网络搜索

## 构建和运行

### 前置要求

- Node.js >= 22
- （可选）OpenRouter API Key（用于 AI 功能）
- （可选）Google API Key 和 Search Engine ID（CX）（用于网络搜索）

### 快速启动

```bash
# 直接使用 npx 运行（无需安装）
npx tabminal --openrouter-key "YOUR_API_KEY" --accept-terms

# 或克隆仓库后运行
git clone https://github.com/leask/tabminal.git
cd tabminal
npm install
npm start -- --openrouter-key "YOUR_API_KEY" --accept-terms
```

### 开发命令

```bash
# 启动服务器
npm start

# 启动并监视文件变化（热重载）
npm run dev

# 运行所有测试
npm test

# 运行测试监视模式
npm run test:watch

# 运行单个测试文件
node --test test/terminal-session.mjs

# 运行特定测试
node --test --test-name-pattern="replays buffered output"

# 构建资源（下载图标和复制字体）
npm run build

# 运行代码检查
npm run lint
```

### 配置选项

Tabminal 支持通过命令行参数、环境变量或 `config.json` 文件进行配置。

配置优先级：默认值 → ~/.tabminal/config.json → ./config.json → CLI 参数 → 环境变量

| 参数 | 环境变量 | 描述 | 默认值 |
|------|----------|------|--------|
| `-p`, `--port` | `PORT` | 服务器端口 | `9846` |
| `-h`, `--host` | `HOST` | 绑定地址 | `127.0.0.1` |
| `-a`, `--password` | `TABMINAL_PASSWORD` | 访问密码 | （随机生成） |
| `-k`, `--openrouter-key` | `TABMINAL_OPENROUTER_KEY` | AI 提供商 API Key | `null` |
| `-m`, `--model` | `TABMINAL_MODEL` | AI 模型 ID | `gemini-2.5-flash-preview-09-2025` |
| `-g`, `--google-key` | `TABMINAL_GOOGLE_KEY` | Google Search API Key | `null` |
| `-c`, `--google-cx` | `TABMINAL_GOOGLE_CX` | Google 搜索引擎 ID (CX) | `null` |
| `-d`, `--debug` | `TABMINAL_DEBUG` | 启用调试日志 | `false` |
| `-y`, `--accept-terms` | `TABMINAL_ACCEPT` | **必需**：接受安全风险（完整文件系统访问） | `false` |

### 安全警告

⚠️ **Tabminal 提供对底层文件系统的完整读/写访问权限**

- **不要**在没有适当保护（VPN 等）的情况下将其暴露到公共互联网
- `--accept-terms` 标志是必需的，以确认您了解这些风险

## 开发约定

### 代码风格

- **文件格式**：Node.js ES 模块（.mjs）
- **语言**：原生 JavaScript（不使用 TypeScript）
- **缩进**：4 空格
- **分号**：始终使用分号
- **行长度**：尽量保持在 120 字符以内
- **无尾随空格**
- **JSON 缩进**：2 空格

### 命名约定

- **类名**：PascalCase（`TerminalSession`, `SystemMonitor`）
- **函数/方法**：camelCase（`createSession`, `handleInput`）
- **常量**：UPPER_SNAKE_CASE（`DEFAULT_CONFIG`, `MAX_ATTEMPTS`, `WS_STATE_OPEN`）
- **私有方法**：前缀下划线（`_handleData`, `_broadcast`）
- **文件名**：工具类使用 kebab-case，类文件使用 PascalCase（`terminal-session.mjs`）

### 导入规范

- 始终为内置 Node.js 模块使用 `node:` 前缀：`import path from 'node:path'`
- 外部模块使用命名导入：`import { TerminalManager } from './terminal-manager.mjs'`
- 将所有导入放在文件顶部
- 组织导入顺序：内置模块 → 外部依赖 → 本地模块

### 类和对象

- 对有状态组件使用类（会话、管理器、监视器）
- 私有方法前缀下划线
- 构造函数初始化所有实例属性
- 适当时使用可选链和空值合并

### 错误处理

- 对异步操作使用 try-catch
- 使用 `console.error('[ModuleName]', error)` 记录错误
- 非关键错误（如清理、可选功能）不要导致崩溃
- 适当时检查特定错误代码（如 `e.code === 'ENOENT'`）
- 对于预期的边缘情况，静默失败并用 `/* ignore */` 注释是可接受的

### 异步/等待

- 优先使用 async/await 而非 Promise 链
- 适当处理拒绝
- 对文件操作使用 `fs/promises`

### 测试

- 使用 Node.js 内置测试运行器（`node:test`）
- 测试文件位于 `test/` 目录
- 模拟外部依赖（pty、WebSocket 等）
- 使用 `node:assert` 中的 `assert`
- 使用 `beforeEach`/`afterEach` 进行设置/清理

### 日志记录

- 在括号中使用模块名称前缀日志：`[Server]`, `[Manager]`, `[Auth]`
- 使用 `console.log` 记录信息，`console.warn` 记录警告，`console.error` 记录错误
- 仅当 `config.debug` 为 true 时记录调试日志

### WebSocket 协议

- 消息是带有 `type` 字段的 JSON 对象
- 消息类型包括：`output`, `input`, `resize`, `snapshot`, `meta`, `status`, `ping`, `pong`
- 广播到所有客户端，发送到特定客户端

### 文件组织

```
src/              # 服务器端代码（.mjs 模块）
├── server.mjs           # 主服务器文件
├── config.mjs           # 配置管理
├── auth.mjs             # 认证中间件
├── terminal-manager.mjs # 终端会话管理
├── terminal-session.mjs # 单个终端会话
├── system-monitor.mjs   # 系统监控
├── fs-routes.mjs        # 文件系统路由
└── persistence.mjs      # 会话持久化

public/           # 静态文件（提供给客户端）
├── index.html
├── app.js               # 前端应用
├── styles.css
└── icons/               # 图标资源

shell/            # Shell 集成脚本
test/             # 测试文件
scripts/          # 实用脚本
```

### 会话管理

- 会话持久化到 `~/.tabminal/sessions/`
- 每个会话有一个 `.json` 元数据文件和 `.log` 输出文件
- 管理器在最后一个会话关闭时自动创建会话
- 会话数据包括：id、title、cwd、env、editorState、executions

### 安全注意事项

- 使用 SHA256 哈希进行密码保护
- 30 次失败认证尝试后锁定服务
- **不要**在没有 VPN/代理的情况下暴露到公共互联网
- 对底层系统具有完整的文件系统访问权限

### 快捷键

- `Ctrl + Shift + T`：新建终端
- `Ctrl + Shift + W`：关闭终端
- `Ctrl + Shift + E`：切换编辑器面板
- `Ctrl + Up` / `Down`：聚焦编辑器 / 终端
- `Ctrl + Shift + [` / `]`：切换终端
- `Ctrl + Alt + [` / `]`：切换编辑器中的打开文件
- `Ctrl + Shift + ?`：显示快捷键帮助
- `Ctrl` / `Cmd` + `F`：在终端中查找

### 修改代码时

1. 运行测试：`npm test`
2. 运行代码检查：`npm run lint`
3. 如果添加新功能，添加相应的测试
4. 保持更改最小且专注
5. 遵循类似文件中的现有模式

## AI 功能

### 上下文感知聊天

在终端中输入 `#` 后跟问题，AI 将自动获取上下文（CWD、环境、最近历史）来准确解决问题。

### 自动修复

命令失败时，Tabminal 会自动分析退出代码和错误输出以建议修复方案。

### 网络搜索

启用 Google Search 集成，让 AI 从网络获取实时答案。

## 贡献指南

在提交更改之前，请确保：

1. 所有测试通过（`npm test`）
2. 代码检查通过（`npm run lint`）
3. 遵循现有的代码风格和约定
4. 为新功能添加测试
5. 更新相关文档

## 许可证

MIT License