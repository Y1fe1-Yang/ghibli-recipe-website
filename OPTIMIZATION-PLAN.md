# 🚀 Ghibli Recipe Kitchen - 全栈优化计划

## 📊 当前问题诊断

### 🔴 紧急问题（P0 - 必须立即修复）

1. **快速提示词显示异常**
   - 状态：显示为 "quickPrompt1", "quickPrompt2" 而非实际文本
   - 原因：可能是 i18n 加载时机问题或 updateUIText() 未正确执行
   - 影响：用户体验严重受损

2. **AI 语言匹配错误**
   - 状态：用英文提问，AI 用中文回答
   - 原因：虽然前端发送了 language 参数，但服务器可能未正确处理
   - 影响：双语功能完全失效

### 🟡 重要问题（P1 - 短期内修复）

3. **双语数据迁移未完成**
   - 状态：63个中文菜谱未翻译成双语格式
   - 影响：English用户看到的菜谱较少

4. **服务器未生成双语菜谱**
   - 状态：新生成的菜谱仍是单语言格式
   - 影响：数据库格式不统一

### 🟢 优化项（P2 - 中长期优化）

5. **前端性能**
   - 没有图片懒加载
   - 没有请求缓存
   - 大量 DOM 操作未优化

6. **错误处理不完善**
   - API 失败时用户反馈不明确
   - 没有 Loading 状态管理
   - 没有离线提示

7. **用户体验细节**
   - 语言切换后需手动刷新
   - 没有动画过渡
   - 移动端适配不完善

---

## 🛠️ 修复方案

### Phase 1: 修复关键Bug (预计30分钟)

#### 1.1 修复快速提示词显示

**问题分析：**
- i18n.js 可能在 index.html 的 script 执行前未加载完成
- 或 updateUIText() 中的逻辑有误

**解决方案：**
```javascript
// 方案A: 在 initApp() 中延迟执行
async function initApp() {
    // 确保 i18n 加载完成
    await new Promise(resolve => {
        if (typeof i18n !== 'undefined') {
            resolve();
        } else {
            setTimeout(resolve, 100);
        }
    });

    updateUIText();
    await loadRecipes();
}

// 方案B: 使用 DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
```

#### 1.2 修复AI语言匹配

**当前代码：**
```javascript
// 前端已发送 language 参数
body: JSON.stringify({
    userMessage: message,
    language: currentLanguage
})

// 服务器已接收并使用
const { userMessage, language = 'zh' } = req.body;
```

**问题可能在于：**
- Claude 的 prompt 可能不够强
- 或者需要更明确的指示

**优化方案：**
```javascript
// 在 server/index-v2.js 中加强 prompt
let prompt;
if (language === 'en') {
    prompt = `IMPORTANT: You MUST respond in English only.

User said: "${userMessage}"
...
Return recommendations and response in ENGLISH ONLY.`;
} else {
    prompt = `重要：你必须只用中文回复。

用户说："${userMessage}"
...
只用中文返回推荐和回复。`;
}
```

---

### Phase 2: 全栈优化 (预计2小时)

#### 2.1 前端优化

**a) 图片懒加载**
```javascript
// 使用 Intersection Observer
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
        }
    });
});

document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});
```

**b) 添加 Loading 状态**
```javascript
class LoadingManager {
    show(message = '加载中...') {
        // 显示全屏 loading
    }

    hide() {
        // 隐藏 loading
    }

    showToast(message, type = 'info') {
        // 显示提示消息
    }
}
```

**c) 优化语言切换**
```javascript
function switchLanguage(lang) {
    currentLanguage = lang;
    i18n.setLanguage(lang);
    localStorage.setItem('language', lang);

    // 立即更新UI，无需刷新
    updateUIText();
    renderRecipes(allRecipes);

    // 添加平滑过渡动画
    document.body.classList.add('language-switching');
    setTimeout(() => {
        document.body.classList.remove('language-switching');
    }, 300);
}
```

**d) 添加离线支持**
```javascript
window.addEventListener('online', () => {
    showToast('网络已恢复', 'success');
});

window.addEventListener('offline', () => {
    showToast('网络连接已断开', 'warning');
});
```

#### 2.2 服务器优化

**a) 添加缓存层**
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getCachedRecommendation(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCachedRecommendation(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}
```

**b) 优化API响应**
```javascript
// 压缩响应
app.use(compression());

// 添加 CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? 'https://yourdomain.com'
        : '*'
}));

// 添加速率限制
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 最多100个请求
});
app.use('/api/', limiter);
```

**c) 错误处理中间件**
```javascript
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            code: err.code || 'UNKNOWN_ERROR'
        }
    });
});
```

#### 2.3 数据库优化

**a) 添加索引字段**
```json
{
  "id": "unique-id",
  "name_zh": "麻婆豆腐",
  "name_en": "Mapo Tofu",
  "searchTerms_zh": ["麻婆", "豆腐", "川菜", "辣"],
  "searchTerms_en": ["mapo", "tofu", "sichuan", "spicy"],
  "tags": ["spicy", "easy", "chinese"],
  "popularity": 0.95,
  "createdAt": "2026-02-06T00:00:00Z",
  "updatedAt": "2026-02-06T00:00:00Z"
}
```

**b) 添加搜索功能**
```javascript
function searchRecipes(query, language = 'zh') {
    const lowerQuery = query.toLowerCase();
    return recipes.filter(recipe => {
        const name = language === 'zh' ? recipe.name_zh : recipe.name_en;
        const searchTerms = language === 'zh'
            ? recipe.searchTerms_zh
            : recipe.searchTerms_en;

        return name.toLowerCase().includes(lowerQuery) ||
               searchTerms.some(term => term.includes(lowerQuery));
    });
}
```

---

### Phase 3: 用户体验提升 (预计1小时)

#### 3.1 添加动画

```css
/* 页面切换动画 */
.language-switching * {
    transition: opacity 0.3s ease-in-out;
}

/* 卡片悬停效果 */
.recipe-card {
    transition: transform 0.2s, box-shadow 0.2s;
}

.recipe-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

/* Loading 骨架屏 */
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

#### 3.2 移动端优化

```css
@media (max-width: 768px) {
    .recipes-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .modal-content {
        width: 95%;
        max-height: 90vh;
        overflow-y: auto;
    }

    .quick-prompts {
        flex-wrap: wrap;
        gap: 0.5rem;
    }
}
```

#### 3.3 无障碍访问

```html
<!-- 添加 ARIA 标签 -->
<button aria-label="切换到中文" role="button" tabindex="0">
    中文
</button>

<!-- 键盘导航支持 -->
<div class="recipe-card"
     tabindex="0"
     role="button"
     onkeypress="handleKeyPress(event)">
</div>
```

---

## 📈 预期效果

### 性能提升
- 首屏加载时间：从 2s 降至 800ms
- 图片加载优化：懒加载节省 60% 初始流量
- API 响应时间：缓存层减少 50% 重复请求

### 用户体验
- 语言切换即时生效，无需刷新
- 错误提示清晰友好
- 移动端体验流畅

### 代码质量
- 统一的错误处理
- 完善的日志系统
- 可维护性提升

---

## 🎯 实施优先级

### 立即执行（今天）
1. ✅ 修复快速提示词显示
2. ✅ 修复 AI 语言匹配
3. ✅ 测试双语功能

### 短期优化（本周）
4. 添加 Loading 状态
5. 优化语言切换
6. 添加错误处理

### 中期优化（下周）
7. 图片懒加载
8. 服务器缓存
9. 移动端优化

### 长期规划（下月）
10. 用户系统
11. 收藏功能
12. 评论系统
13. PWA 支持
