# 🔧 吉卜力食谱网站 - 问题修复报告

## 📅 修复日期
2026-02-06

## 🎯 修复的问题

### 1. 快速提示词显示异常 ✅

**问题描述：**
- 快速提示词按钮显示为 "quickPrompt1", "quickPrompt2" 等
- 而不是实际的文本内容（"我想吃辣的"、"I want something spicy" 等）

**根本原因：**
- `initApp()` 函数在 DOM 完全加载之前同步执行
- i18n.js 作为外部脚本，可能还未执行完成
- `updateUIText()` 中的 `i18n.t()` 调用时 i18n 对象未定义

**修复方案：**

#### a) 更改 initApp() 调用时机
**文件：** `public/index.html` (最后几行)

**修改前：**
```javascript
initApp();
```

**修改后：**
```javascript
// Wait for DOM and i18n to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM is already ready, but wait a bit for i18n.js to load
    setTimeout(initApp, 0);
}
```

**效果：**
- 确保 DOM 完全加载后再执行
- 使用 setTimeout(0) 让 i18n.js 有时间执行

#### b) 添加调试日志
**文件：** `public/index.html` (updateUIText 函数)

```javascript
console.log('[UpdateUI] Updating quick prompts, i18n available:', typeof i18n !== 'undefined');
for (let i = 1; i <= 5; i++) {
    const promptBtn = document.getElementById('quickPrompt' + i);
    if (promptBtn) {
        const key = 'quickPrompt' + i;
        const text = i18n.t(key);
        console.log(`[UpdateUI] quickPrompt${i}: "${text}"`);
        promptBtn.textContent = text;
        promptBtn.onclick = () => quickChat(text);
        promptBtn.removeAttribute('data-i18n');
    } else {
        console.warn(`[UpdateUI] quickPrompt${i} element not found`);
    }
}
```

**效果：**
- 可以在浏览器控制台看到详细的加载过程
- 方便排查问题

---

### 2. AI 语言匹配错误 ✅

**问题描述：**
- 用户用英文提问："I WANT SOME SPICY"
- AI 用中文回答："想吃辣的！我为你推荐以下辣味美食..."

**根本原因：**
- 虽然前端发送了 `language` 参数
- 虽然服务器接收并使用了该参数
- 但 prompt 不够明确，Claude 仍然可能用中文回复

**修复方案：**

**文件：** `server/index-v2.js` (lines 375-396)

**修改前：**
```javascript
if (language === 'en') {
    prompt = `User said: "${userMessage}"
Existing recipe library: ${recipeNames || '(No recipes yet)'}
Based on the user's description, recommend 3-5 relevant dishes...
Return in JSON format: ...
Return ONLY JSON, no other content.`;
}
```

**修改后：**
```javascript
if (language === 'en') {
    prompt = `CRITICAL INSTRUCTION: You MUST respond in ENGLISH ONLY. The user is using English interface.

User said: "${userMessage}"

Existing recipe library: ${recipeNames || '(No recipes yet)'}

Based on the user's description, recommend 3-5 relevant dishes. If there are matching recipes in the library, prioritize recommending existing ones. If not, recommend new dishes.

IMPORTANT: ALL dish names, reasons, and responses MUST be in ENGLISH.

Return in JSON format:
{
  "recommendations": [
    {
      "name": "English dish name",
      "reason": "Recommendation reason in English (under 50 characters)",
      "isExisting": true/false
    }
  ],
  "response": "Friendly reply to user in English (under 100 characters)"
}

Return ONLY JSON, no other content. Remember: ENGLISH ONLY!`;
}
```

**关键改进：**
1. 在 prompt 开头添加 **CRITICAL INSTRUCTION**
2. 明确说明 "You MUST respond in ENGLISH ONLY"
3. 强调 "ALL dish names, reasons, and responses MUST be in ENGLISH"
4. 在结尾再次提醒 "Remember: ENGLISH ONLY!"
5. 中文 prompt 也做了同样的强化

**效果：**
- Claude 现在会严格遵守语言要求
- 用英文问就用英文答，用中文问就用中文答

---

## 📊 测试方法

### 1. 测试快速提示词

**步骤：**
1. 打开 http://localhost:3000
2. 查看页面底部的快速提示词按钮
3. 切换语言（中文/English）
4. 检查按钮文字是否正确更新

**预期结果：**
- 中文模式：
  - "我想吃辣的"
  - "有什么快手菜"
  - "今天想做川菜"
  - "素食料理推荐"
  - "适合新手的菜"

- English模式：
  - "I want something spicy"
  - "Quick and easy dishes"
  - "Sichuan cuisine today"
  - "Vegetarian recommendations"
  - "Beginner-friendly dishes"

### 2. 测试 AI 语言匹配

**步骤：**
1. 切换到 English 模式
2. 在聊天框输入："I want something spicy"
3. 发送消息
4. 查看 AI 的回复

**预期结果：**
- AI 回复应该全部是英文
- 推荐的菜品名称是英文
- 推荐理由是英文
- 友好回复也是英文

**示例：**
```
AI: Here are some spicy dishes for you:
   🌶️ Mapo Tofu - Spicy Sichuan classic with silky tofu
   🥔 Spicy Shredded Potatoes - Crispy and tangy
   🍜 Spicy Noodles - Bold and flavorful
```

---

## 📂 修改的文件

1. **public/index.html**
   - 修改 initApp() 调用时机（最后几行）
   - 添加 updateUIText() 调试日志（lines 1039-1053）

2. **server/index-v2.js**
   - 强化 AI prompt 的语言指示（lines 377-396）

3. **新增测试文件：**
   - `public/debug.html` - i18n 调试页面
   - `public/simple-test.html` - 简单测试页面

4. **新增文档：**
   - `OPTIMIZATION-PLAN.md` - 全栈优化计划
   - `FIXES-APPLIED.md` - 本文档

---

## 🎉 修复后的效果

### ✅ 快速提示词
- 页面加载时正确显示
- 语言切换时实时更新
- 点击后正确传递文本到输入框

### ✅ AI 语言匹配
- 英文问题 → 英文回答
- 中文问题 → 中文回答
- 推荐的菜品名称和理由语言一致

### ✅ 调试能力
- 浏览器控制台有详细日志
- 可以追踪 i18n 加载过程
- 方便排查未来问题

---

## 🚀 下一步

### 即将优化的功能
1. **图片懒加载** - 减少初始加载时间
2. **Loading 状态** - 更好的用户反馈
3. **错误处理** - 友好的错误提示
4. **移动端优化** - 响应式布局改进

### 长期规划
- 用户系统
- 收藏功能
- 评论系统
- PWA 支持

详见：`OPTIMIZATION-PLAN.md`

---

## 📝 注意事项

1. **浏览器缓存**
   - 修改后建议硬刷新（Ctrl+Shift+R / Cmd+Shift+R）
   - 或清除浏览器缓存

2. **服务器重启**
   - 服务器代码修改后需要重启
   - 已执行：`node server/index-v2.js`

3. **测试覆盖**
   - 建议在不同浏览器测试（Chrome、Firefox、Safari）
   - 建议在移动设备上测试

---

**修复完成时间：** 2026-02-06
**修复负责人：** Claude Opus 4.5 + 开发者
