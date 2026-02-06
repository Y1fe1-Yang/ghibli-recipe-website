# 🍱 吉卜力风格食谱网站 | Ghibli-Style Recipe Website

一个由AI驱动的智能食谱网站，为每个烹饪步骤生成吉卜力风格的漫画插图。通过对话式AI界面发现和生成美味食谱。

An AI-powered recipe website that generates Studio Ghibli-style comic illustrations for each cooking step. Discover and generate delicious recipes through a conversational AI interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![AI](https://img.shields.io/badge/AI-Claude%20%26%20Gemini-purple.svg)

## ✨ 特性 | Features

### 🎨 核心功能
- **对话式AI推荐** - 告诉AI你想吃什么，获得智能食谱推荐
- **吉卜力风格插图** - 每个烹饪步骤都配有手绘水彩风格的漫画插图
- **AI实时生成** - 使用Claude Sonnet 4生成食谱内容，Gemini 3 Pro生成图片
- **智能队列系统** - 用户请求优先级高于批量生成，防止过载
- **丰富的数据库** - 62+道精选菜谱，涵盖中式、西式、日式料理

### 🚀 技术亮点
- **双队列优先级系统** - 用户请求立即处理，批量任务后台运行
- **超时保护** - 6分钟总超时 + 60秒单图超时，防止API延迟导致失败
- **智能缓存** - 已生成的食谱立即返回，避免重复生成
- **错误恢复** - 进程级错误处理，确保服务器稳定运行
- **步骤限制** - 最多8步，平衡详细度与生成时间

## 🚀 快速开始 | Quick Start

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- AI Gateway API密钥

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/Y1fe1-Yang/ghibli-recipe-website.git
cd ghibli-recipe-website
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 设置AI Gateway API密钥
export AI_GATEWAY_API_KEY="your_api_key_here"
```

4. **启动服务器**
```bash
# 方式1: 使用启动脚本
./start.sh

# 方式2: 直接运行
node server/index-v2.js
```

5. **访问网站**
```
打开浏览器访问: http://localhost:3000
```

## 📸 效果展示 | Screenshots

### 主界面 - 对话式交互
```
用户: "我想吃点辣的"
AI: 为您推荐以下辣味美食...
    🌶️ 麻婆豆腐 - 经典川菜，麻辣鲜香
    🥔 酸辣土豆丝 - 爽脆开胃
    🍜 油泼辣子面 - 陕西风味
```

### 食谱详情 - 分步图解
每道菜包含：
- 🎭 精美的主菜插图
- 📝 详细的食材清单
- 🎨 每一步的吉卜力风格漫画图
- 💡 烹饪小贴士

## 🛠️ 技术栈 | Tech Stack

### 前端
- HTML5 + CSS3
- Vanilla JavaScript
- 响应式设计

### 后端
- Node.js v18+
- Express.js
- JSON文件存储

### AI服务
- **文本生成**: Claude Sonnet 4 (Anthropic)
- **图片生成**: Google Gemini 3 Pro Image
- **API网关**: AI Gateway Integration

### 架构特点
- RESTful API设计
- 队列管理系统
- 优先级调度
- 异步处理
- 错误边界

## 🎯 项目结构 | Project Structure

```
ghibli-recipe-website/
├── server/
│   ├── index.js              # 主服务器 (旧版，已弃用)
│   ├── index-v2.js           # 主服务器 (当前使用，带队列系统)
│   ├── index-old.js          # 原始版本备份
│   └── queue-manager.js      # 队列管理模块
├── public/
│   └── index.html            # 前端界面
├── data/
│   ├── recipes.json          # 食谱数据库 (62+ recipes)
│   └── users.json            # 用户数据
├── scripts/
│   └── seed-recipes.js       # 数据初始化脚本
├── *.sh                      # 批量生成脚本
├── BUG_FIX_REPORT.md        # 问题修复报告
├── PROJECT_PROMPT_HISTORY.md # 项目开发历史
├── COMIC-RECIPE-GUIDE.md    # 漫画食谱指南
├── IMAGE-FIX-NOTES.md       # 图片修复笔记
├── QUICK-START.md           # 快速开始指南
└── package.json             # 依赖配置
```

## 📚 API文档 | API Documentation

### 获取所有食谱
```http
GET /api/recipes
```

### 生成新食谱 (用户请求)
```http
POST /api/recipes/generate
Content-Type: application/json

{
  "dishName": "宫保鸡丁",
  "isUserRequest": true
}
```

### 批量生成食谱
```http
POST /api/recipes/batch-generate
Content-Type: application/json

{
  "dishes": ["麻婆豆腐", "鱼香肉丝", "回锅肉"]
}
```

### 查看队列状态
```http
GET /api/queue/status
```

响应示例:
```json
{
  "userQueue": 0,
  "batchQueue": 3,
  "isProcessing": true,
  "currentTask": {
    "dishName": "麻婆豆腐",
    "type": "batch"
  },
  "stats": {
    "userGenerated": 12,
    "batchGenerated": 50,
    "failed": 2,
    "totalTime": 18500000
  }
}
```

### 点赞食谱
```http
POST /api/recipes/:id/like
```

### 健康检查
```http
GET /api/health
```

## 🔧 核心模块说明 | Core Modules

### 队列管理系统 (queue-manager.js)
```javascript
class GenerationQueue {
  userQueue: []      // 用户请求队列 (高优先级)
  batchQueue: []     // 批量生成队列 (低优先级)
  isProcessing: bool // 处理状态标志

  addUserRequest()   // 添加用户请求，立即处理
  addBatchRequest()  // 添加批量请求，排队等待
  processNext()      // 处理下一个任务
  generateRecipe()   // 执行实际生成
}
```

### 超时配置
- **总超时**: 6分钟 (360秒) - 足够生成8步食谱
- **单图超时**: 60秒 - 处理API高峰期延迟
- **步骤限制**: 最多8步 - 平衡详细度与时间

### 错误处理
```javascript
process.on('unhandledRejection', handler)  // 捕获未处理的Promise拒绝
process.on('uncaughtException', handler)   // 捕获未捕获的异常
try/catch/finally                          // 确保队列持续处理
```

## 🎨 生成流程 | Generation Pipeline

1. **接收请求** - 用户通过聊天界面描述想吃的菜
2. **队列调度** - 根据优先级加入对应队列
3. **内容生成** - Claude Sonnet 4生成食谱内容 (~8秒)
4. **主图生成** - Gemini 3 Pro生成主菜插图 (~25秒)
5. **步骤图生成** - 为每步生成漫画插图 (8步 × ~25秒 = ~200秒)
6. **保存入库** - 存储到recipes.json
7. **返回响应** - 发送完整食谱数据

**总计时间**: 约3.5-5分钟 (API速度影响)

## 📊 数据库示例 | Database Schema

```json
{
  "id": "1770311227833",
  "name": "蜂蜜柚子茶鸡翅",
  "description": "酸甜清香的创意鸡翅，柚子香气浓郁",
  "emoji": "🍯🍗",
  "cookTime": 45,
  "difficulty": "简单",
  "servings": 2,
  "ingredients": [
    "鸡翅中 8个",
    "蜂蜜柚子茶 3大勺",
    "生抽 2大勺",
    "..."
  ],
  "steps": [
    "鸡翅中用刀在两面各划2-3刀...",
    "蒜瓣拍扁切碎，生姜切丝...",
    "..."
  ],
  "tips": "柚子茶中的果肉不要去掉...",
  "imageUrl": "https://ai-gateway-resource.trickle-lab.tech/images/...",
  "stepImages": [
    "https://ai-gateway-resource.trickle-lab.tech/images/...",
    "https://ai-gateway-resource.trickle-lab.tech/images/...",
    "..."
  ],
  "author": "AI厨房",
  "createdAt": "2026-02-05T17:07:07.833Z",
  "likes": 0,
  "views": 0
}
```

## 🐛 已知问题与修复 | Known Issues & Fixes

### 问题1: 用户请求失败但批量生成成功
**原因**: 3分钟HTTP超时不足以完成8步生成 (需3.5-5分钟)

**修复**:
- 总超时: 3分钟 → 6分钟 ✅
- 单图超时: 30秒 → 60秒 ✅
- 添加进程级错误处理 ✅

详见: [BUG_FIX_REPORT.md](BUG_FIX_REPORT.md)

### 问题2: 服务器在step 6/6崩溃
**原因**: 未捕获的Promise拒绝导致Node.js进程终止

**修复**:
- 添加 `unhandledRejection` 处理器
- 添加 `uncaughtException` 处理器
- finally块确保队列恢复

## 🔮 未来计划 | Roadmap

- [ ] **流式响应** - 使用Server-Sent Events实时显示生成进度
- [ ] **异步模式** - 立即返回任务ID，轮询查询结果
- [ ] **图片缓存** - 缓存生成的图片，加速相似请求
- [ ] **图片队列** - 独立的图片生成队列，更好的控制
- [ ] **用户系统** - 注册、登录、收藏夹
- [ ] **评分评论** - 用户可以对食谱打分和评论
- [ ] **多语言支持** - 英文、日文界面
- [ ] **移动端优化** - PWA支持，离线访问

## 📖 文档 | Documentation

- [快速开始指南](QUICK-START.md) - 5分钟上手
- [漫画食谱指南](COMIC-RECIPE-GUIDE.md) - 插图风格说明
- [项目开发历史](PROJECT_PROMPT_HISTORY.md) - 完整的prompt工程记录
- [问题修复报告](BUG_FIX_REPORT.md) - 详细的问题诊断与修复
- [图片修复笔记](IMAGE-FIX-NOTES.md) - 图片生成优化

## 🤝 贡献 | Contributing

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📝 开发日志 | Development Log

### v1.0.0 (2026-02-05)
- ✅ 初始版本发布
- ✅ 对话式AI推荐系统
- ✅ 吉卜力风格图片生成
- ✅ 双队列优先级系统
- ✅ 62+道食谱数据库
- ✅ 超时保护与错误恢复
- ✅ 批量生成脚本

## 🙏 致谢 | Acknowledgments

- **Anthropic** - Claude Sonnet 4 AI模型
- **Google** - Gemini 3 Pro Image模型
- **Studio Ghibli** - 插图风格灵感来源
- **AI Gateway** - API集成服务

## 📧 联系方式 | Contact

- GitHub: [@Y1fe1-Yang](https://github.com/Y1fe1-Yang)
- 项目地址: [ghibli-recipe-website](https://github.com/Y1fe1-Yang/ghibli-recipe-website)

## 📄 许可证 | License

MIT License

---

**Built with ❤️ and AI**

由Claude Opus 4.5与开发者协作完成 | Co-created by Claude Opus 4.5 and Developer
