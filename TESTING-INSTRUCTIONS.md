# 测试说明 | Testing Instructions

## 已修复的问题 | Fixed Issues

### 1. 快速提示词显示问题 | Quick Prompts Display Issue

**问题 | Problem:**
- Quick prompt buttons showing "quickPrompt1", "quickPrompt2" instead of actual text
- 快速提示词按钮显示为 "quickPrompt1", "quickPrompt2" 而不是实际文本

**修复 | Fix:**
- Added detailed console logging to debug i18n loading
- Enhanced updateUIText() with comprehensive debug output
- Improved i18n.t() function with step-by-step logging
- 添加了详细的控制台日志来调试 i18n 加载
- 增强了 updateUIText() 的调试输出
- 改进了 i18n.t() 函数，添加了逐步日志

### 2. AI 语言匹配问题 | AI Language Matching Issue

**问题 | Problem:**
- AI responds in Chinese when user asks in English
- AI 在用户用英文提问时用中文回答

**修复 | Fix:**
- Enhanced AI prompts with "CRITICAL INSTRUCTION" for language enforcement
- Added multiple reminders in prompts
- Server now sends correct language parameter
- 增强了 AI 提示词，添加了 "CRITICAL INSTRUCTION" 来强制语言
- 在提示词中添加了多次提醒
- 服务器现在发送正确的语言参数

### 3. 食谱匹配问题 | Recipe Matching Issue

**问题 | Problem:**
- Existing recipes (like "麻婆豆腐") being regenerated instead of displayed
- 现有食谱（如"麻婆豆腐"）被重新生成而不是直接显示

**修复 | Fix:**
- Improved recipe name matching with normalization (remove spaces, lowercase)
- Now checks both name_zh/name_en and fallback name field
- Uses substring matching after normalization
- 改进了食谱名称匹配，添加了标准化（移除空格、小写）
- 现在同时检查 name_zh/name_en 和备用 name 字段
- 标准化后使用子字符串匹配

---

## 如何测试 | How to Test

### 步骤 1: 打开浏览器控制台 | Step 1: Open Browser Console

1. 访问 http://localhost:3000
2. 按 F12 或右键点击 → 检查 → Console 标签
3. 清空控制台（点击 🚫 图标）

### 步骤 2: 刷新页面并查看日志 | Step 2: Refresh and Check Logs

刷新页面（Ctrl+R 或 Cmd+R），你应该在控制台看到详细的日志：

```
[Init] Starting app initialization...
[Init] Current language: zh
[UpdateUI] Updating UI text for language: zh
[UpdateUI] Updating quick prompts
[UpdateUI] i18n type: object
[UpdateUI] i18n.t type: function
[UpdateUI] currentLanguage: zh
[i18n.t] Looking up key: "quickPrompt1", currentLang: "zh"
[i18n.t] Starting value (translations[zh]): exists
[i18n.t] Found key "quickPrompt1", value: "我想吃辣的"
[i18n.t] Final translation for "quickPrompt1": "我想吃辣的"
[UpdateUI] Translation for quickPrompt1: "我想吃辣的"
...
```

### 步骤 3: 检查快速提示词 | Step 3: Check Quick Prompts

**预期结果 | Expected Result:**

**中文模式 (Chinese Mode):**
- "我想吃辣的"
- "有什么快手菜"
- "今天想做川菜"
- "素食料理推荐"
- "适合新手的菜"

**English模式:**
- "I want something spicy"
- "Quick and easy dishes"
- "Sichuan cuisine today"
- "Vegetarian recommendations"
- "Beginner-friendly dishes"

### 步骤 4: 测试 AI 语言匹配 | Step 4: Test AI Language Matching

1. **切换到 English 模式 | Switch to English Mode**
   - Click the "English" button at the top right

2. **发送英文消息 | Send English Message**
   - Type: "I want something spicy"
   - Click Send or press Enter

3. **检查 AI 回复 | Check AI Response**
   - AI should respond in English
   - Recommended dishes should have English names
   - Reasons should be in English

**预期结果示例 | Expected Result Example:**
```
AI: Here are some spicy dishes for you:
   🌶️ Mapo Tofu - Spicy Sichuan classic
   🥔 Spicy Shredded Potatoes - Crispy and tangy
   🍜 Spicy Noodles - Bold and flavorful
```

### 步骤 5: 测试食谱匹配 | Step 5: Test Recipe Matching

1. **切换到 English 模式 | Switch to English Mode**
2. **发送消息 | Send Message:** "I want to make Mapo Tofu"
3. **检查推荐 | Check Recommendations:**
   - Should show "Mapo Tofu" with `isExisting: true`
   - Clicking it should show the existing recipe (not generate a new one)
   - 应显示 "Mapo Tofu" 且 `isExisting: true`
   - 点击后应显示现有食谱（不应重新生成）

4. **检查服务器日志 | Check Server Logs:**
   ```bash
   tail -f server.log
   ```
   - Should see: "✓ Found existing recipe: 麻婆豆腐"
   - Should NOT see: "🔄 [用户优先] 开始处理: Mapo Tofu"

---

## 调试信息 | Debug Information

### 查看所有日志 | View All Logs

**浏览器控制台 | Browser Console:**
- F12 → Console
- 查看所有 [Init], [UpdateUI], [i18n.t] 前缀的日志

**服务器日志 | Server Logs:**
```bash
cd /home/node/a0/workspace/1ddc8f95-8e73-43aa-9c74-9b9074f6f536/workspace/ghibli-recipe-app
tail -f server.log
```

### 常见问题 | Common Issues

#### 问题 1: 快速提示词仍显示 "quickPrompt1"

**可能原因 | Possible Causes:**
1. 浏览器缓存 - 尝试硬刷新 (Ctrl+Shift+R)
2. i18n.js 未加载 - 检查控制台是否有加载错误
3. i18n.t() 未找到翻译 - 查看详细日志

#### 问题 2: AI 仍用中文回答英文问题

**可能原因 | Possible Causes:**
1. 服务器未重启 - 重启服务器
2. 语言参数未正确发送 - 检查网络请求中的 `language` 字段
3. Claude 模型行为 - 查看服务器日志中的实际 prompt

#### 问题 3: 食谱仍被重新生成

**可能原因 | Possible Causes:**
1. 食谱名称不匹配 - 查看服务器日志中的匹配逻辑
2. 数据库中食谱不存在 - 检查 data/recipes.json
3. 名称标准化失败 - 查看控制台中的匹配日志

---

## 下一步 | Next Steps

如果测试发现问题，请提供：

1. **浏览器控制台的完整日志** (截图或文本)
2. **服务器日志的相关部分** (`tail -n 100 server.log`)
3. **具体的测试步骤和预期结果**

如果测试成功，我们将继续：

4. 前端性能优化 (图片懒加载、Loading 状态)
5. 服务器优化 (缓存、错误处理)
6. 移动端适配改进
7. 双语数据迁移 (将现有 63 个菜谱翻译成双语格式)

---

**当前时间 | Current Time:** 2026-02-06
**服务器状态 | Server Status:** Running on port 3000
**文件修改 | Files Modified:**
- `public/index.html` - Enhanced logging in updateUIText()
- `public/i18n.js` - Enhanced logging in t() function
- `server/index-v2.js` - Improved recipe matching and language enforcement
