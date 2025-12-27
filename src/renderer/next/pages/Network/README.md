# Network 页面实现文档

## 概述

Network 页面是 Whistle Client 的核心功能之一，用于实时监控和分析通过 Whistle 代理的所有 HTTP/HTTPS 请求。

## 功能特性

### 1. 请求列表 (Request Table)

- **实时显示**：自动捕获并展示所有网络请求
- **虚拟滚动**：支持海量请求的高性能渲染
- **表格列**：
  - Name：URL 文件名
  - Status：HTTP 状态码（带颜色标识）
  - Method：请求方法（GET, POST, PUT, DELETE 等）
  - Type：资源类型（document, script, stylesheet, xhr, image 等）
  - Size：响应大小
  - Time：请求总耗时
  - **Waterfall**：瀑布流时间线可视化 ⭐

### 2. 瀑布流可视化 (Waterfall)

瀑布流展示了每个请求的各个阶段耗时：

- **排队 (Queueing)**：浅灰色 - 请求在队列中等待的时间
- **DNS 查询 (DNS Lookup)**：黄色 - DNS 解析耗时
- **TCP 连接 (Initial Connection)**：橙色 - 建立 TCP 连接的时间
- **SSL 握手 (SSL/TLS)**：红色 - SSL/TLS 协商时间
- **发送请求 (Request Sent)**：蓝色 - 发送请求数据的时间
- **等待响应 (Waiting/TTFB)**：浅蓝色 - 等待服务器响应的时间
- **下载内容 (Content Download)**：绿色 - 下载响应内容的时间

### 3. 请求详情面板 (Request Details)

点击任意请求后，下方面板显示详细信息，包含 6 个标签页：

#### (1) Overview - 概览
显示请求的基本信息和时间统计：
- General：URL、方法、状态码、协议等
- Timing：各阶段详细耗时
- Size：请求和响应大小
- Time：开始和结束时间

#### (2) Headers - 请求/响应头
- Request Headers：请求头列表
- Response Headers：响应头列表

#### (3) Request - 请求体
使用 Monaco Editor 显示请求体内容，支持：
- 语法高亮（JSON、JavaScript、HTML、CSS、XML 等）
- 自适应深色/浅色主题
- 只读模式

#### (4) Response - 响应体 ⭐
使用 Monaco Editor 显示响应体内容，功能包括：
- **三种显示模式**：
  - 格式化：自动格式化 JSON 等内容
  - 原始：显示原始文本
  - 预览：HTML 预览、图片预览
- **工具按钮**：
  - 复制到剪贴板
  - 下载响应内容
  - 全屏显示
- 语法高亮支持
- 深色/浅色主题自动切换

#### (5) Rules - Whistle 规则
显示匹配的 Whistle 规则列表（如果有）

#### (6) Timeline - 时序图
可视化展示请求各阶段的耗时分布：
- 分阶段水平条形图
- 百分比和绝对时间显示
- 顺序时间轴

### 4. 工具栏 (Toolbar)

提供以下功能：

- **暂停/恢复**：暂停或恢复请求捕获
- **清空**：清空所有已捕获的请求
- **导出 HAR**：将请求数据导出为 HAR 格式文件
- **请求计数**：显示当前捕获的请求总数
- **搜索**：按 URL 搜索和过滤请求
- **方法过滤**：按 HTTP 方法过滤（GET, POST, PUT, DELETE 等）
- **类型过滤**：按资源类型过滤（document, script, xhr 等）

## 技术实现

### 文件结构

```
src/renderer/next/pages/Network/
├── index.tsx                          # 主页面组件
├── types.ts                           # TypeScript 类型定义
├── components/
│   ├── RequestTable.tsx               # 请求列表表格
│   ├── WaterfallCell.tsx              # 瀑布流单元格 ⭐
│   ├── Toolbar.tsx                    # 工具栏
│   └── RequestDetails/                # 请求详情面板
│       ├── index.tsx                  # 标签容器
│       ├── OverviewTab.tsx            # 概览标签
│       ├── HeadersTab.tsx             # Headers 标签
│       ├── RequestTab.tsx             # 请求体标签
│       ├── ResponseTab.tsx            # 响应体标签 ⭐
│       ├── RulesTab.tsx               # 规则标签
│       └── TimelineTab.tsx            # 时序图标签
├── hooks/
│   ├── useNetworkCapture.ts           # 网络捕获逻辑
│   └── useNetworkFilter.ts            # 过滤和搜索
└── utils/
    ├── formatters.ts                  # 格式化工具
    ├── exportHAR.ts                   # HAR 导出
    └── waterfallUtils.ts              # 瀑布流计算工具 ⭐
```

### 核心技术栈

- **React 19**：UI 框架
- **Ant Design 6**：UI 组件库
- **Monaco Editor**：代码编辑器，用于显示请求/响应体
- **TypeScript**：类型安全
- **虚拟滚动**：Ant Design Table 的 `virtual` 属性，支持大量数据
- **Splitter**：Ant Design 的可调整分割面板

### Monaco Editor 配置

Monaco Editor 已在 `src/renderer/next/index.tsx` 中配置：

```typescript
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });
```

语法高亮支持以下语言：
- JSON
- JavaScript
- HTML
- CSS
- XML
- TypeScript
- 纯文本

### 数据流

1. **useNetworkCapture Hook**：
   - 管理请求列表状态
   - 提供暂停/恢复、清空功能
   - 当前使用模拟数据生成器（可替换为真实 Whistle API）

2. **useNetworkFilter Hook**：
   - 根据搜索文本、方法、类型过滤请求
   - 返回过滤后的请求列表

3. **RequestTable 组件**：
   - 计算瀑布流的基准时间和最大时间
   - 渲染虚拟滚动表格
   - 处理行选择事件

4. **WaterfallCell 组件**：
   - 计算每个请求的瀑布流数据
   - 使用绝对定位渲染各阶段色块
   - Tooltip 显示详细时间信息

## 与 Whistle 后端集成

当前实现使用模拟数据。要集成真实的 Whistle 后端，需要修改 `useNetworkCapture.ts`：

### 方式 1：WebSocket（推荐）

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://local.whistlejs.com/cgi-bin/socket');
  
  ws.onmessage = (event) => {
    const request = JSON.parse(event.data);
    setRequests(prev => [...prev, transformRequest(request)]);
  };

  return () => ws.close();
}, []);
```

### 方式 2：HTTP 轮询

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetch('http://local.whistlejs.com/cgi-bin/sessions')
      .then(res => res.json())
      .then(data => {
        const transformed = data.map(transformRequest);
        setRequests(transformed);
      });
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

### 数据转换

需要将 Whistle 的请求数据转换为 `NetworkRequest` 类型：

```typescript
function transformRequest(whistleData: any): NetworkRequest {
  return {
    id: whistleData.id,
    url: whistleData.url,
    method: whistleData.method,
    statusCode: whistleData.statusCode,
    // ... 其他字段映射
    timing: {
      queueing: whistleData.timing.queueing || 0,
      dnsLookup: whistleData.timing.dns || 0,
      // ... 其他时间字段
      total: calculateTotal(whistleData.timing),
    },
  };
}
```

## HAR 格式导出

使用 `exportHAR` 工具将请求导出为标准的 HAR (HTTP Archive) 格式：

```typescript
import { downloadHAR } from './utils/exportHAR';

// 导出所有请求
downloadHAR(requests);

// 导出过滤后的请求
downloadHAR(filteredRequests);
```

HAR 文件可以导入到 Chrome DevTools、Fiddler 等工具中进行分析。

## 性能优化

1. **虚拟滚动**：Ant Design Table 的 `virtual` 属性，只渲染可见行
2. **useMemo**：缓存计算结果，避免重复计算
3. **useCallback**：缓存回调函数，避免不必要的重渲染
4. **绝对定位**：瀑布流使用绝对定位，避免布局重排

## 主题支持

自动检测系统主题：

```typescript
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

Monaco Editor 根据主题自动切换 `vs-dark` 或 `light` 主题。

## 待优化项

1. **真实数据集成**：替换模拟数据为真实 Whistle API
2. **WebSocket 重连**：添加断线重连机制
3. **请求详情缓存**：避免重复加载请求体内容
4. **瀑布流缩放**：支持用户自定义时间轴缩放
5. **导出选项**：支持导出为其他格式（如 cURL）
6. **性能监控**：添加性能指标统计
7. **错误处理**：完善错误提示和恢复机制

## 测试

目前使用模拟数据生成器进行演示：

- 每 2 秒自动生成一个新请求
- 随机状态码、方法、类型
- 随机时间分布

要测试真实场景，需要：
1. 启动 Whistle 服务
2. 配置代理
3. 访问网站触发请求
4. 在 Network 页面查看捕获的请求

## 常见问题

### Q: Monaco Editor 没有语法高亮？
A: 确保 Monaco Editor 已正确配置，参考 `src/renderer/next/index.tsx`。

### Q: 请求列表性能差？
A: 确保启用了虚拟滚动 (`virtual` 属性)，并使用 `useMemo` 缓存计算结果。

### Q: 瀑布流显示异常？
A: 检查 `timing` 数据是否正确，确保所有时间值都是非负数。

### Q: 如何调试？
A: 使用 Chrome DevTools 的 React DevTools 扩展，查看组件状态和 props。

## 参考资料

- [Whistle 官方文档 - Network](https://wproxy.org/docs/gui/network.html)
- [Chrome DevTools Network Panel](https://developer.chrome.com/docs/devtools/network/)
- [HAR 格式规范](http://www.softwareishard.com/blog/har-12-spec/)
- [Monaco Editor 文档](https://microsoft.github.io/monaco-editor/)
- [Ant Design Table](https://ant.design/components/table)
