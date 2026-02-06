# 双语系统使用指南 | Bilingual System Guide

## 概述 | Overview

吉卜力食谱厨房现已支持中英双语！系统可以生成中文和英文食谱，每种语言都有独立的数据库条目和文化适配的图片风格。

The Ghibli Recipe Kitchen now supports bilingual functionality! The system can generate recipes in both Chinese and English, with separate database entries and culturally-adapted image styles for each language.

## 功能特性 | Features

### 1. 语言切换 | Language Switching
- ✅ 前端界面双语支持 (中文/English)
- ✅ 自动保存语言偏好到 localStorage
- ✅ 切换语言后界面立即更新

### 2. 独立数据 | Separate Data
- ✅ 同一道菜的中英文版本分别存储
- ✅ 支持搜索中英文食谱
- ✅ 语言字段标记每个食谱

### 3. 文化适配 | Cultural Adaptation

#### 中文模式 (Chinese Mode)
- **厨房场景**: 传统中式厨房，木质器具，竹蒸笼
- **食谱风格**: 中式烹饪方法，中式调料
- **作者名**: "AI厨房"
- **难度描述**: 简单/中等/困难

#### 英文模式 (English Mode)
- **Kitchen Setting**: Modern North American kitchen, stainless steel appliances, granite countertops
- **Recipe Style**: Western cooking methods, common American ingredients
- **Author Name**: "AI Kitchen"
- **Difficulty Levels**: Easy/Medium/Hard

## API变更 | API Changes

### 生成食谱 | Generate Recipe

**请求 | Request:**
```json
POST /api/recipes/generate
{
  "dishName": "Mac and Cheese",
  "language": "en",
  "isUserRequest": true
}
```

**响应 | Response:**
```json
{
  "recipe": {
    "id": "1770312345678",
    "name": "Mac and Cheese",
    "description": "Creamy comfort food classic",
    "language": "en",
    "emoji": "🧀🍝",
    "cookTime": 25,
    "difficulty": "Easy",
    "servings": 4,
    "ingredients": [...],
    "steps": [...],
    "imageUrl": "https://...",
    "stepImages": [...],
    "author": "AI Kitchen"
  },
  "cached": false
}
```

### 批量生成 | Batch Generate

**请求 | Request:**
```json
POST /api/recipes/batch-generate
{
  "dishes": ["Mac and Cheese", "Grilled Cheese", "Hamburger"],
  "language": "en"
}
```

## 文件结构 | File Structure

### 新增文件 | New Files
```
public/
  └── i18n.js                    # 国际化配置和翻译
server/
  ├── index-v2.js                # 更新：支持language参数
  └── queue-manager.js           # 更新：传递language到生成函数
generate-na-recipes.sh           # 北美食谱批量生成脚本
BILINGUAL_GUIDE.md              # 本文档
```

### 修改文件 | Modified Files
- `server/index-v2.js` - 添加语言支持的生成逻辑
- `server/queue-manager.js` - 队列系统传递语言参数
- `public/index.html` - 计划添加语言切换UI

## 翻译系统 | Translation System

### i18n.js 使用方法 | Usage

```javascript
// 初始化
const i18n = new LanguageManager();

// 获取当前语言
const currentLang = i18n.getCurrentLanguage(); // 'zh' or 'en'

// 设置语言
i18n.setLanguage('en');

// 获取翻译
const title = i18n.t('siteTitle'); // '🌿 Ghibli Recipe Kitchen'
const placeholder = i18n.t('chatPlaceholder');

// 翻译难度级别
const diff = i18n.translateDifficulty('简单'); // 'Easy'
```

### 翻译键 | Translation Keys

```javascript
{
  // Header
  siteTitle: string
  siteSubtitle: string

  // Chat
  chatPlaceholder: string
  sendButton: string
  welcomeMessage: string
  thinking: string
  generating: string

  // Recipe
  viewRecipe: string
  cookTime: string
  difficulty: string
  servings: string
  ingredients: string
  steps: string
  tips: string

  // Difficulty
  easy: string
  medium: string
  hard: string

  // Actions
  like: string
  views: string
  close: string

  // Errors
  errorGenerate: string
  errorLoad: string
  errorEmpty: string

  // Language
  language: string
  chinese: string
  english: string
}
```

## AI Prompt 配置 | AI Prompt Configuration

### 中文食谱 Prompt (Chinese)
```
请为"${dishName}"生成一份详细的中文食谱。

请以JSON格式返回，包含以下字段：
{
  "name": "菜名",
  "description": "一句话简介（20字以内）",
  "emoji": "合适的emoji表情",
  "cookTime": 烹饪时间（分钟，数字）,
  "difficulty": "简单/中等/困难",
  "servings": 几人份（数字）,
  "ingredients": ["食材1 用量", "食材2 用量"],
  "steps": ["步骤1的详细描述", "步骤2的详细描述"],
  "tips": "烹饪小贴士"
}
```

### 英文食谱 Prompt (English)
```
Generate a detailed recipe for "${dishName}" in English.

Return in JSON format with the following fields:
{
  "name": "Dish name",
  "description": "One-line description (under 50 characters)",
  "emoji": "Appropriate emoji",
  "cookTime": cooking time in minutes (number),
  "difficulty": "Easy/Medium/Hard",
  "servings": number of servings (number),
  "ingredients": ["Ingredient 1 with amount", "Ingredient 2 with amount"],
  "steps": ["Detailed description of step 1", "Detailed description of step 2"],
  "tips": "Cooking tips and tricks"
}
```

### 图片 Prompt 差异 | Image Prompt Differences

**中文模式图片:**
- `traditional Chinese kitchen setting with wooden utensils and bamboo steamers`

**英文模式图片:**
- `modern North American kitchen setting with stainless steel appliances and granite countertops`

## 北美食谱列表 | North American Recipe Collection

已准备40道经典北美菜品用于批量生成：

### 美式经典 | American Classics (10)
- Mac and Cheese
- Grilled Cheese Sandwich
- BBQ Pulled Pork
- Classic Hamburger
- Buffalo Wings
- Clam Chowder
- Chicken Pot Pie
- Meatloaf
- Cornbread
- Coleslaw

### 墨西哥风味 | Tex-Mex (5)
- Beef Tacos
- Chicken Quesadilla
- Nachos Supreme
- Chicken Fajitas
- Burrito Bowl

### 早餐 | Breakfast (5)
- Pancakes with Maple Syrup
- French Toast
- Eggs Benedict
- Breakfast Burrito
- Scrambled Eggs and Bacon

### 沙拉配菜 | Salads & Sides (5)
- Caesar Salad
- Cobb Salad
- Baked Potato
- French Fries
- Onion Rings

### 三明治 | Sandwiches (5)
- Club Sandwich
- Philly Cheesesteak
- BLT Sandwich
- Reuben Sandwich
- Pulled Pork Sandwich

### 主菜 | Dinner (5)
- Roast Turkey
- Grilled Salmon
- Beef Steak
- Baked Chicken
- BBQ Ribs

### 舒适食物 | Comfort Food (5)
- Chili Con Carne
- Gumbo
- Jambalaya
- Pot Roast
- Baked Beans

## 批量生成 | Batch Generation

### 生成北美食谱 | Generate NA Recipes
```bash
# 执行批量生成脚本
./generate-na-recipes.sh

# 或手动调用API
curl -X POST http://localhost:3000/api/recipes/batch-generate \
  -H "Content-Type: application/json" \
  -d '{"dishes":["Mac and Cheese","Hamburger"],"language":"en"}'
```

### 监控进度 | Monitor Progress
```bash
# 查看队列状态
curl http://localhost:3000/api/queue/status | jq

# 实时查看服务器日志
tail -f server.log
```

## 数据库结构 | Database Structure

### 中文食谱示例 | Chinese Recipe Example
```json
{
  "id": "1770279329081",
  "name": "酸辣土豆丝",
  "language": "zh",
  "description": "酸辣爽口的经典家常菜",
  "emoji": "🥔🌶️",
  "difficulty": "简单",
  "author": "AI厨房",
  ...
}
```

### 英文食谱示例 | English Recipe Example
```json
{
  "id": "1770312345678",
  "name": "Mac and Cheese",
  "language": "en",
  "description": "Creamy comfort food classic",
  "emoji": "🧀🍝",
  "difficulty": "Easy",
  "author": "AI Kitchen",
  ...
}
```

## 性能考虑 | Performance Considerations

### 生成时间 | Generation Time
- **中文食谱**: 约3.5-5分钟 (8步骤 + 主图)
- **英文食谱**: 约3.5-5分钟 (同上)
- **并发控制**: 队列系统确保单线程生成，防止API过载

### 存储空间 | Storage
- 每道食谱约 2-3KB JSON 数据
- 图片通过URL引用，不占用本地存储
- 双语支持将使数据库大小翻倍（中英各一份）

## 未来改进 | Future Improvements

### 计划功能 | Planned Features
- [ ] 前端语言切换按钮UI
- [ ] 自动检测浏览器语言
- [ ] 更多语言支持（日语、韩语、西班牙语）
- [ ] 语言混合搜索（搜索"汉堡"显示"Hamburger"）
- [ ] 食谱翻译功能（中文食谱一键翻译成英文）
- [ ] 地区口味定制（北美、欧洲、亚洲）

### 技术优化 | Technical Optimization
- [ ] 图片CDN缓存加速
- [ ] 懒加载优化
- [ ] 服务端渲染（SSR）
- [ ] Redis缓存常见食谱
- [ ] GraphQL API支持

## 故障排除 | Troubleshooting

### 问题1: 语言参数未生效
**症状**: 请求英文食谱，但返回中文

**解决**:
```bash
# 检查API请求是否包含language参数
curl -X POST http://localhost:3000/api/recipes/generate \
  -H "Content-Type: application/json" \
  -d '{"dishName":"Test","language":"en"}' | jq '.recipe.language'

# 应该返回: "en"
```

### 问题2: 翻译文本未显示
**症状**: 前端仍显示中文

**解决**:
1. 确认 `i18n.js` 已加载
2. 检查 localStorage: `localStorage.getItem('language')`
3. 清除缓存重新加载

### 问题3: 同名食谱冲突
**症状**: "汉堡包"和"Hamburger"被认为是同一道菜

**解决**: 系统现在使用语言字段区分：
```javascript
const existing = recipes.find(r =>
    r.name.toLowerCase() === dishName.toLowerCase() &&
    (r.language || 'zh') === language
);
```

## 更新日志 | Changelog

### v1.1.0 (2026-02-06)
- ✅ 添加双语支持（中英文）
- ✅ 创建 i18n 国际化系统
- ✅ API支持language参数
- ✅ 独立中英文数据存储
- ✅ 文化适配的图片风格
- ✅ 40道北美食谱列表
- ✅ 批量生成脚本

### v1.0.0 (2026-02-05)
- ✅ 初始中文版本
- ✅ 62道中文食谱
- ✅ 队列系统
- ✅ 吉卜力风格图片

---

**Built with ❤️ and AI**

由Claude Opus 4.5与开发者协作完成 | Co-created by Claude Opus 4.5 and Developer
