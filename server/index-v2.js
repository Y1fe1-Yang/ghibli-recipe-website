const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const generationQueue = require('./queue-manager');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'ghibli-recipe-secret-key-' + Date.now();

// Prevent crashes from unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise);
    console.error('🚨 Reason:', reason);
    // Don't exit - keep server running
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    console.error('🚨 Stack:', error.stack);
    // Don't exit - keep server running
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Data storage paths
const USERS_FILE = path.join(__dirname, '../data/users.json');
const RECIPES_FILE = path.join(__dirname, '../data/recipes.json');

// Initialize data files
function initDataFiles() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(RECIPES_FILE)) {
        fs.writeFileSync(RECIPES_FILE, JSON.stringify([]));
    }
}

function readUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (error) {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readRecipes() {
    try {
        return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8'));
    } catch (error) {
        return [];
    }
}

function writeRecipes(recipes) {
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
}

initDataFiles();

console.log('✨ Ghibli Recipe Server running on http://localhost:' + PORT);
console.log('🎨 API Key configured:', !!process.env.AI_GATEWAY_API_KEY ? 'Yes' : 'No');

// 实际生成逻辑 - 注入到队列管理器
generationQueue.generateRecipe = async function(dishName, language = 'zh') {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
        throw new Error('AI_GATEWAY_API_KEY not configured');
    }

    // Generate recipe content with language-specific prompts
    const prompts = {
        zh: `请为"${dishName}"生成一份详细的中文食谱。

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

每个步骤的描述要详细，包含具体的动作和状态，方便生成漫画插图。只返回JSON，不要其他内容。`,

        en: `Generate a detailed recipe for "${dishName}" in English.

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

Each step should be detailed with specific actions and states for comic illustration. Return ONLY JSON, no other content.`
    };

    const recipePrompt = prompts[language] || prompts.zh;

    const recipeResponse = await axios.post(
        'https://ai-gateway.happycapy.ai/api/v1/chat/completions',
        {
            model: 'claude-sonnet-4',
            messages: [{ role: 'user', content: recipePrompt }],
            max_tokens: 2000
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        }
    );

    let recipeData;
    try {
        const content = recipeResponse.data.choices[0].message.content;
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
        recipeData = JSON.parse(jsonMatch ? jsonMatch[1] : content);
    } catch (parseError) {
        throw new Error('Failed to parse recipe JSON');
    }

    console.log(`✓ Recipe content generated with ${recipeData.steps.length} steps (${language})`);

    // Generate main dish image with language-specific settings
    const kitchenSettings = {
        zh: 'traditional Chinese kitchen setting with wooden utensils and bamboo steamers',
        en: 'modern North American kitchen setting with stainless steel appliances and granite countertops'
    };

    const mainImagePrompt = `A beautiful Studio Ghibli style illustration of the finished ${dishName}, featuring the completed dish with warm, inviting colors and soft lighting. The scene should have a cozy, hand-painted aesthetic with detailed food presentation, steam rising from the dish, and a magical, whimsical atmosphere. Watercolor style with rich textures and dreamy ambiance, ${kitchenSettings[language] || kitchenSettings.en}.`;

    const mainImageResponse = await axios.post(
        'https://ai-gateway.happycapy.ai/api/v1/images/generations',
        {
            model: 'google/gemini-3-pro-image-preview',
            prompt: mainImagePrompt,
            response_format: 'url'
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Origin': 'https://trickle.so'
            }
        }
    );

    const imageUrl = mainImageResponse.data.data[0].url;
    console.log('  ✓ Main dish image generated');

    // Generate step-by-step comic images
    const stepImages = [];
    const maxSteps = Math.min(recipeData.steps.length, 8); // Limit to max 8 steps

    for (let i = 0; i < maxSteps; i++) {
        const step = recipeData.steps[i];
        console.log(`  🎨 Generating image for step ${i + 1}/${maxSteps}...`);

        const stepPrompt = `A Studio Ghibli style comic panel illustration showing step ${i + 1} of cooking ${dishName}: "${step}". The scene should show hands performing the cooking action in a warm, cozy kitchen. Hand-painted watercolor style with soft lighting, showing the ingredients and cooking process clearly. The illustration should be like a cooking manga panel with a magical, whimsical Ghibli atmosphere. Focus on the specific action described in the step.`;

        try {
            const stepImageResponse = await axios.post(
                'https://ai-gateway.happycapy.ai/api/v1/images/generations',
                {
                    model: 'google/gemini-3-pro-image-preview',
                    prompt: stepPrompt,
                    response_format: 'url'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'Origin': 'https://trickle.so'
                    },
                    timeout: 60000 // 60 second timeout per image
                }
            );

            stepImages.push(stepImageResponse.data.data[0].url);
            console.log(`    ✓ Step ${i + 1} image generated`);

            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`    ✗ Failed to generate step ${i + 1} image:`, error.message);
            stepImages.push(null);
            // Don't throw - continue with remaining steps
        }
    }

    // Add null for any remaining steps that were skipped
    for (let i = maxSteps; i < recipeData.steps.length; i++) {
        stepImages.push(null);
    }

    console.log('✅ All images generated successfully');

    // Create recipe object
    const authorNames = {
        zh: 'AI厨房',
        en: 'AI Kitchen'
    };

    const newRecipe = {
        id: Date.now().toString(),
        ...recipeData,
        language,
        imageUrl,
        stepImages,
        author: authorNames[language] || authorNames.zh,
        authorId: 'ai-chef',
        createdAt: new Date().toISOString(),
        likes: 0,
        views: 0
    };

    // Save to database
    const recipes = readRecipes();
    recipes.push(newRecipe);
    writeRecipes(recipes);

    return newRecipe;
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Recipe endpoints
app.get('/api/recipes', (req, res) => {
    try {
        const { search } = req.query;
        let recipes = readRecipes();

        if (search) {
            const searchLower = search.toLowerCase();
            recipes = recipes.filter(r =>
                r.name.toLowerCase().includes(searchLower) ||
                r.description.toLowerCase().includes(searchLower) ||
                r.ingredients.some(i => i.toLowerCase().includes(searchLower))
            );
        }

        recipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(recipes);
    } catch (error) {
        console.error('Get recipes error:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// Generate recipe with QUEUE SYSTEM - 用户请求优先
app.post('/api/recipes/generate', async (req, res) => {
    try {
        const { dishName, isUserRequest = true, language = 'zh' } = req.body;

        if (!dishName) {
            return res.status(400).json({ error: 'Dish name is required' });
        }

        // Check if recipe already exists (language-specific check)
        const recipes = readRecipes();
        const existing = recipes.find(r =>
            r.name.toLowerCase() === dishName.toLowerCase() &&
            (r.language || 'zh') === language
        );

        if (existing) {
            return res.json({ recipe: existing, cached: true });
        }

        // Add to queue based on priority
        const result = await new Promise((resolve, reject) => {
            if (isUserRequest) {
                generationQueue.addUserRequest(dishName, language, resolve, reject);
            } else {
                generationQueue.addBatchRequest(dishName, language, resolve, reject);
            }
        });

        res.json({ recipe: result, cached: false });
    } catch (error) {
        console.error('Generate recipe error:', error.message);
        res.status(500).json({
            error: 'Failed to generate recipe',
            details: error.message
        });
    }
});

// 批量生成API - 低优先级
app.post('/api/recipes/batch-generate', async (req, res) => {
    try {
        const { dishes, language = 'zh' } = req.body;

        if (!Array.isArray(dishes) || dishes.length === 0) {
            return res.status(400).json({ error: 'Dishes array is required' });
        }

        console.log(`📦 批量生成请求: ${dishes.length} 个菜品 (${language})`);

        // Add all dishes to batch queue
        const promises = dishes.map(dishName => {
            return new Promise((resolve, reject) => {
                generationQueue.addBatchRequest(dishName, language, resolve, reject);
            }).catch(error => ({ error: true, dishName, message: error.message }));
        });

        res.json({
            message: `已添加 ${dishes.length} 个菜品到批量生成队列`,
            queueStatus: generationQueue.getStatus()
        });

        // Don't await - let them process in background
    } catch (error) {
        console.error('Batch generate error:', error);
        res.status(500).json({ error: 'Failed to start batch generation' });
    }
});

// 队列状态API
app.get('/api/queue/status', (req, res) => {
    res.json(generationQueue.getStatus());
});

// Get recipe recommendations
app.post('/api/recipes/recommend', async (req, res) => {
    try {
        const { userMessage } = req.body;

        if (!userMessage) {
            return res.status(400).json({ error: 'User message is required' });
        }

        const apiKey = process.env.AI_GATEWAY_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'AI_GATEWAY_API_KEY not configured' });
        }

        const recipes = readRecipes();
        const recipeNames = recipes.map(r => r.name).join('、');

        const prompt = `用户说："${userMessage}"

现有食谱库：${recipeNames || '(暂无食谱)'}

请根据用户的描述，推荐3-5个相关的菜品。如果食谱库中有匹配的，优先推荐现有的。如果没有，推荐新的菜品。

以JSON格式返回：
{
  "recommendations": [
    {
      "name": "菜名",
      "reason": "推荐理由（20字以内）",
      "isExisting": true/false
    }
  ],
  "response": "对用户的友好回复（30字以内）"
}

只返回JSON，不要其他内容。`;

        const aiResponse = await axios.post(
            'https://ai-gateway.happycapy.ai/api/v1/chat/completions',
            {
                model: 'claude-sonnet-4',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        let recommendData;
        try {
            const content = aiResponse.data.choices[0].message.content;
            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
            recommendData = JSON.parse(jsonMatch ? jsonMatch[1] : content);
        } catch (parseError) {
            console.error('Failed to parse recommendation JSON:', parseError);
            return res.status(500).json({ error: 'Failed to generate recommendations' });
        }

        const enrichedRecommendations = recommendData.recommendations.map(rec => {
            const existingRecipe = recipes.find(r =>
                r.name.includes(rec.name) || rec.name.includes(r.name)
            );

            return {
                ...rec,
                recipe: existingRecipe || null,
                isExisting: !!existingRecipe
            };
        });

        res.json({
            recommendations: enrichedRecommendations,
            response: recommendData.response
        });
    } catch (error) {
        console.error('Recommendation error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate recommendations',
            details: error.response?.data?.error?.message || error.message
        });
    }
});

// Like/View endpoints
app.post('/api/recipes/:id/like', (req, res) => {
    try {
        const recipes = readRecipes();
        const recipe = recipes.find(r => r.id === req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        recipe.likes = (recipe.likes || 0) + 1;
        writeRecipes(recipes);

        res.json({ success: true, likes: recipe.likes });
    } catch (error) {
        console.error('Like recipe error:', error);
        res.status(500).json({ error: 'Failed to like recipe' });
    }
});

app.post('/api/recipes/:id/view', (req, res) => {
    try {
        const recipes = readRecipes();
        const recipe = recipes.find(r => r.id === req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        recipe.views = (recipe.views || 0) + 1;
        writeRecipes(recipes);

        res.json({ success: true, views: recipe.views });
    } catch (error) {
        console.error('View recipe error:', error);
        res.status(500).json({ error: 'Failed to record view' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});
