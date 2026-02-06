# 🌿 魔法漫画厨房 | Magic Comic Kitchen

一个由AI驱动的智能食谱网站，为每个烹饪步骤生成魔法漫画风格的插图。支持中英文双语，通过对话式AI界面发现和生成美味食谱。

An AI-powered recipe website that generates magic comic-style illustrations for each cooking step. Bilingual support (Chinese/English) with a conversational AI interface for discovering and generating delicious recipes.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![AI](https://img.shields.io/badge/AI-Claude%20%26%20Gemini-purple.svg)
![Languages](https://img.shields.io/badge/languages-中文%20%7C%20English-blue.svg)

## ✨ 特性 | Features

### 🎨 核心功能 | Core Features
- **双语支持** - 完整的中英文双语界面和内容 | Full bilingual support (Chinese/English)
- **对话式AI推荐** - 告诉AI你想吃什么，获得智能食谱推荐 | AI-powered recipe recommendations
- **魔法漫画风格** - 每个烹饪步骤都配有手绘水彩风格的漫画插图 | Hand-painted watercolor comic illustrations
- **AI实时生成** - 使用Claude Sonnet 4生成双语食谱，Gemini 3 Pro生成图片 | Real-time generation with Claude & Gemini
- **智能队列系统** - 用户请求优先级高于批量生成 | Priority queue system for user requests
- **丰富的数据库** - 72+道精选菜谱，涵盖中式、西式料理 | 72+ curated recipes

### 🚀 技术亮点 | Technical Highlights
- **双语数据架构** - 所有食谱同时包含中英文内容 | Bilingual data architecture
- **跨语言搜索** - 输入中文或英文都能找到同一食谱 | Cross-language recipe search
- **双队列优先级** - 用户请求立即处理，批量任务后台运行 | Dual-queue priority system
- **超时保护** - 6分钟总超时 + 60秒单图超时 | Comprehensive timeout protection
- **智能缓存** - 已生成的食谱立即返回 | Smart caching for instant access
- **步骤限制** - 最多8步，平衡详细度与生成时间 | Max 8 steps for optimal balance

## 🚀 快速开始 | Quick Start

### 环境要求 | Requirements
- Node.js >= 18.0.0
- npm >= 8.0.0
- AI Gateway API Key

### 安装步骤 | Installation

1. **克隆仓库 | Clone Repository**
```bash
git clone https://github.com/Y1fe1-Yang/magic-comic-kitchen.git
cd magic-comic-kitchen
```

2. **安装依赖 | Install Dependencies**
```bash
npm install
```

3. **配置环境变量 | Configure Environment**
```bash
# 设置AI Gateway API密钥 | Set AI Gateway API Key
export AI_GATEWAY_API_KEY="your_api_key_here"
```

4. **启动服务器 | Start Server**
```bash
# 使用v2服务器(推荐) | Use v2 server (recommended)
node server/index-v2.js

# 或使用npm脚本 | Or use npm script
npm start
```

5. **访问网站 | Access Website**
```
打开浏览器访问 | Open in browser: http://localhost:3000
```

## 📸 效果展示 | Screenshots

### 主界面 - 对话式交互 | Main Interface - Conversational AI
```
中文模式 | Chinese Mode:
用户: "我想吃点辣的"
AI: 为您推荐以下辣味美食...
    🌶️ 麻婆豆腐 - 经典川菜，麻辣鲜香
    🥔 酸辣土豆丝 - 爽脆开胃
    🍜 辣子鸡丁 - 香辣诱人

English Mode:
User: "I want something spicy"
AI: Here are some spicy recommendations...
    🌶️ Mapo Tofu - Classic Sichuan dish
    🥔 Sour and Spicy Shredded Potatoes
    🍜 Spicy Diced Chicken
```

### 食谱详情 - 分步图解 | Recipe Details - Step-by-Step
每道菜包含 | Each recipe includes:
- 🎭 精美的主菜插图 | Beautiful main dish illustration
- 📝 双语食材清单 | Bilingual ingredients list
- 🎨 每一步的魔法漫画风格图片 | Magic comic-style image for each step
- 💡 双语烹饪小贴士 | Bilingual cooking tips

## 🛠️ 技术栈 | Tech Stack

### 前端 | Frontend
- HTML5 + CSS3
- Vanilla JavaScript
- i18n (Bilingual Support)
- 响应式设计 | Responsive Design

### 后端 | Backend
- Node.js v18+
- Express.js
- JSON文件存储 | JSON File Storage
- 双语数据模型 | Bilingual Data Model

### AI服务 | AI Services
- **文本生成 | Text**: Claude Sonnet 4 (Anthropic)
- **图片生成 | Images**: Google Gemini 3 Pro Image
- **API网关 | Gateway**: AI Gateway Integration

## 📁 项目结构 | Project Structure

```
magic-comic-kitchen/
├── server/
│   ├── index-v2.js          # 主服务器(双语) | Main server (bilingual)
│   └── index.js             # 旧版服务器 | Legacy server
├── public/
│   ├── index.html           # 主页面 | Main page
│   ├── i18n.js              # 国际化配置 | i18n config
│   └── style.css            # 样式 | Styles
├── data/
│   ├── recipes.json         # 食谱数据库(双语) | Recipe database (bilingual)
│   └── recipes.backup.json  # 备份 | Backup
├── scripts/
│   └── translate-recipes-simple.js  # 翻译脚本 | Translation script
├── package.json
└── README.md
```

## 🌍 双语支持 | Bilingual Support

### 数据格式 | Data Format
所有食谱使用双语字段 | All recipes use bilingual fields:

```json
{
  "name_zh": "麻婆豆腐",
  "name_en": "Mapo Tofu",
  "description_zh": "麻辣鲜香，豆腐嫩滑入味",
  "description_en": "Spicy and numbing, silky smooth tofu",
  "ingredients_zh": ["豆腐 400克", "..."],
  "ingredients_en": ["400g tofu", "..."],
  "steps_zh": ["步骤1...", "步骤2..."],
  "steps_en": ["Step 1...", "Step 2..."]
}
```

### 语言切换 | Language Switching
- 点击右上角语言按钮即时切换 | Click language button for instant switching
- 所有内容实时更新 | All content updates in real-time
- 用户偏好保存在本地存储 | User preference saved in localStorage

### 跨语言搜索 | Cross-Language Search
- 输入"麻婆豆腐"或"Mapo Tofu"都能找到同一食谱 | Find the same recipe in either language
- 智能名称匹配算法 | Smart name matching algorithm
- 避免重复生成 | Prevents duplicate generation

## 🎯 API端点 | API Endpoints

### 食谱相关 | Recipe Endpoints
- `GET /api/recipes` - 获取所有食谱 | Get all recipes
- `POST /api/recipes/generate` - 生成新食谱 | Generate new recipe
- `POST /api/recipes/recommend` - AI推荐 | AI recommendations
- `POST /api/recipes/:id/like` - 点赞食谱 | Like recipe
- `POST /api/recipes/:id/view` - 记录浏览 | Record view

### 健康检查 | Health Check
- `GET /api/health` - 服务器状态 | Server status

## 📊 数据统计 | Statistics

### 食谱数据库 | Recipe Database
- **总食谱数 | Total**: 72
- **双语食谱 | Bilingual**: 63 (87.5%)
- **英文食谱 | English**: 9 (12.5%)
- **类别 | Categories**: 中式、西式、汤品、小吃 | Chinese, Western, Soups, Snacks

### 迁移历史 | Migration History
- 2026-02-06: 完成63个食谱的双语迁移 | Completed bilingual migration for 63 recipes
- 使用Claude API自动翻译 | Automated translation using Claude API
- 数据大小增长61% (179KB → 288KB) | Data size increased 61%

## 🔧 配置 | Configuration

### 环境变量 | Environment Variables
```bash
AI_GATEWAY_API_KEY=your_key_here    # AI Gateway API密钥 | API Key
PORT=3000                            # 服务器端口 | Server port (optional)
```

### 服务器设置 | Server Settings
- **默认端口 | Default Port**: 3000
- **超时设置 | Timeout**: 6分钟总超时 | 6 min total timeout
- **单图超时 | Image Timeout**: 60秒 | 60 seconds
- **最大步骤数 | Max Steps**: 8

## 📝 开发指南 | Development Guide

### 添加新食谱 | Adding New Recipes
1. 使用AI生成 - 在网站上直接生成 | Use AI - Generate directly on website
2. 手动添加 - 编辑 `data/recipes.json` | Manual - Edit `data/recipes.json`
3. 批量导入 - 使用脚本 `scripts/translate-recipes-simple.js` | Batch import - Use script

### 翻译现有食谱 | Translating Existing Recipes
```bash
node scripts/translate-recipes-simple.js
```

### 启动开发服务器 | Start Development Server
```bash
npm run dev
```

## 🐛 故障排除 | Troubleshooting

### 常见问题 | Common Issues

**Q: 食谱生成失败**
A: 检查API密钥是否正确配置，查看server.log了解详细错误

**Q: 图片加载失败**
A: 确认网络连接，图片URL可能有超时

**Q: 语言切换不生效**
A: 清除浏览器缓存并硬刷新 (Ctrl+Shift+R)

**Q: Recipe generation fails**
A: Check if API key is configured correctly, see server.log for details

**Q: Images fail to load**
A: Check network connection, image URLs may timeout

**Q: Language switching doesn't work**
A: Clear browser cache and hard refresh (Ctrl+Shift+R)

## 📄 许可证 | License

MIT License - 详见 LICENSE 文件 | See LICENSE file for details

## 👥 贡献 | Contributing

欢迎提交问题和拉取请求！| Issues and pull requests are welcome!

## 📞 联系方式 | Contact

- GitHub: [Y1fe1-Yang/magic-comic-kitchen](https://github.com/Y1fe1-Yang/magic-comic-kitchen)
- 问题反馈 | Issues: [GitHub Issues](https://github.com/Y1fe1-Yang/magic-comic-kitchen/issues)

## 🎉 更新日志 | Changelog

### v2.0.0 (2026-02-06)
- ✅ 品牌重塑：吉卜力 → 魔法漫画 | Rebranded: Ghibli → Magic Comic
- ✅ 完整双语支持 (中/英) | Full bilingual support (Chinese/English)
- ✅ 63个食谱双语化 | 63 recipes now bilingual
- ✅ 跨语言搜索功能 | Cross-language search
- ✅ 改进的UI/UX | Improved UI/UX
- ✅ 优化的服务器性能 | Optimized server performance

### v1.0.0 (2026-02-05)
- 🎉 初始发布 | Initial release
- 基础食谱生成 | Basic recipe generation
- 图片生成功能 | Image generation
- 对话式AI | Conversational AI

---

**Made with ❤️ and AI Magic** | **用 ❤️ 和 AI 魔法制作**
