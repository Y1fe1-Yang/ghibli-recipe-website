// 国际化配置文件 | Internationalization Configuration

const translations = {
    zh: {
        // Header
        siteTitle: '🌿 吉卜力食谱厨房',
        siteSubtitle: '用AI魔法创造美味',

        // Chat Interface
        chatPlaceholder: '告诉我你想吃什么... (比如: 我想吃辣的)',
        sendButton: '发送',

        // System Messages
        welcomeMessage: '你好！我是你的AI美食助手 🍳 告诉我你想吃什么类型的菜，我会为你推荐或生成美味食谱！',
        thinking: '思考中...',
        generating: '生成中，请稍候...',

        // Recipe Card
        viewRecipe: '查看食谱',
        cookTime: '烹饪时间',
        difficulty: '难度',
        servings: '份量',
        minutes: '分钟',
        people: '人份',

        // Difficulty Levels
        easy: '简单',
        medium: '中等',
        hard: '困难',

        // Recipe Detail Modal
        ingredients: '食材清单',
        steps: '烹饪步骤',
        tips: '小贴士',
        close: '关闭',
        step: '步骤',

        // Actions
        like: '点赞',
        views: '浏览',

        // Errors
        errorGenerate: '生成失败，请重试',
        errorLoad: '加载失败，请刷新页面',
        errorEmpty: '请输入您想吃的菜品',

        // Loading
        loadingRecipes: '正在加载食谱...',
        generatingRecipe: '正在生成食谱，大约需要3-5分钟...',

        // Language
        language: '语言',
        chinese: '中文',
        english: 'English'
    },

    en: {
        // Header
        siteTitle: '🌿 Ghibli Recipe Kitchen',
        siteSubtitle: 'Creating Delicious Recipes with AI Magic',

        // Chat Interface
        chatPlaceholder: 'Tell me what you want to eat... (e.g., I want something spicy)',
        sendButton: 'Send',

        // System Messages
        welcomeMessage: 'Hello! I\'m your AI culinary assistant 🍳 Tell me what type of dish you\'re craving, and I\'ll recommend or generate delicious recipes for you!',
        thinking: 'Thinking...',
        generating: 'Generating, please wait...',

        // Recipe Card
        viewRecipe: 'View Recipe',
        cookTime: 'Cook Time',
        difficulty: 'Difficulty',
        servings: 'Servings',
        minutes: 'mins',
        people: 'servings',

        // Difficulty Levels
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',

        // Recipe Detail Modal
        ingredients: 'Ingredients',
        steps: 'Cooking Steps',
        tips: 'Tips',
        close: 'Close',
        step: 'Step',

        // Actions
        like: 'Like',
        views: 'Views',

        // Errors
        errorGenerate: 'Generation failed, please try again',
        errorLoad: 'Loading failed, please refresh the page',
        errorEmpty: 'Please enter a dish you want to eat',

        // Loading
        loadingRecipes: 'Loading recipes...',
        generatingRecipe: 'Generating recipe, this will take about 3-5 minutes...',

        // Language
        language: 'Language',
        chinese: '中文',
        english: 'English'
    }
};

// 语言管理器
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'zh';
        this.translations = translations;
    }

    // 获取当前语言
    getCurrentLanguage() {
        return this.currentLang;
    }

    // 设置语言
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('language', lang);
            return true;
        }
        return false;
    }

    // 获取翻译文本
    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];

        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }

        return value;
    }

    // 翻译难度级别
    translateDifficulty(difficulty) {
        const difficultyMap = {
            '简单': 'easy',
            '中等': 'medium',
            '困难': 'hard',
            'Easy': 'easy',
            'Medium': 'medium',
            'Hard': 'hard'
        };

        const key = difficultyMap[difficulty] || 'easy';
        return this.t(key);
    }
}

// 导出全局实例
const i18n = new LanguageManager();
