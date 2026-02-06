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

initDataFiles();

// Helper functions
function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readRecipes() {
    return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8'));
}

function writeRecipes(recipes) {
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
}

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Auth endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const users = readUsers();

        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const users = readUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
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

        // Sort by creation date, newest first
        recipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(recipes);
    } catch (error) {
        console.error('Get recipes error:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

app.get('/api/recipes/:id', (req, res) => {
    try {
        const recipes = readRecipes();
        const recipe = recipes.find(r => r.id === req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.json(recipe);
    } catch (error) {
        console.error('Get recipe error:', error);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});

// Generate recipe with AI - NO AUTH REQUIRED
app.post('/api/recipes/generate', async (req, res) => {
    try {
        const { dishName, cuisine, dietaryRestrictions } = req.body;

        if (!dishName) {
            return res.status(400).json({ error: 'Dish name is required' });
        }

        // Check if recipe already exists
        const recipes = readRecipes();
        const existing = recipes.find(r => r.name.toLowerCase() === dishName.toLowerCase());

        if (existing) {
            return res.json({ recipe: existing, cached: true });
        }

        // Generate recipe using AI Gateway API
        const apiKey = process.env.AI_GATEWAY_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'AI_GATEWAY_API_KEY not configured' });
        }

        console.log(`\n🍳 Generating comic-style recipe for: ${dishName}`);

        // Generate recipe content
        const recipePrompt = `请为"${dishName}"生成一份详细的中文食谱。${cuisine ? `菜系：${cuisine}。` : ''}${dietaryRestrictions ? `饮食限制：${dietaryRestrictions}。` : ''}

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

每个步骤的描述要详细，包含具体的动作和状态，方便生成漫画插图。只返回JSON，不要其他内容。`;

        const recipeResponse = await axios.post(
            'https://ai-gateway.happycapy.ai/api/v1/chat/completions',
            {
                model: 'claude-sonnet-4',
                messages: [
                    { role: 'user', content: recipePrompt }
                ],
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
            console.error('Failed to parse recipe JSON:', parseError);
            return res.status(500).json({ error: 'Failed to generate recipe content' });
        }

        console.log(`✓ Recipe content generated with ${recipeData.steps.length} steps`);
        console.log('🎨 Now generating comic-style images for each step...');

        // Generate main dish image
        const mainImagePrompt = `A beautiful Studio Ghibli style illustration of the finished ${dishName}, featuring the completed dish with warm, inviting colors and soft lighting. The scene should have a cozy, hand-painted aesthetic with detailed food presentation, steam rising from the dish, and a magical, whimsical atmosphere. Watercolor style with rich textures and dreamy ambiance, traditional Chinese kitchen setting.`;

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
        for (let i = 0; i < recipeData.steps.length; i++) {
            const step = recipeData.steps[i];
            console.log(`  🎨 Generating image for step ${i + 1}/${recipeData.steps.length}...`);

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
                        }
                    }
                );

                stepImages.push(stepImageResponse.data.data[0].url);
                console.log(`    ✓ Step ${i + 1} image generated`);

                // Add delay to avoid rate limiting
                if (i < recipeData.steps.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`    ✗ Failed to generate step ${i + 1} image:`, error.message);
                stepImages.push(null); // Use null as placeholder
            }
        }

        console.log('✅ All images generated successfully');

        // Create recipe object with step images
        const newRecipe = {
            id: Date.now().toString(),
            ...recipeData,
            imageUrl,
            stepImages, // Array of image URLs for each step
            author: 'AI厨房',
            authorId: 'ai-chef',
            createdAt: new Date().toISOString(),
            likes: 0,
            views: 0
        };

        recipes.push(newRecipe);
        writeRecipes(recipes);

        res.json({ recipe: newRecipe, cached: false });
    } catch (error) {
        console.error('Generate recipe error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate recipe',
            details: error.response?.data?.error?.message || error.message
        });
    }
});

// Like a recipe - NO AUTH REQUIRED
app.post('/api/recipes/:id/like', (req, res) => {
    try {
        const recipes = readRecipes();
        const recipe = recipes.find(r => r.id === req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        recipe.likes = (recipe.likes || 0) + 1;
        writeRecipes(recipes);

        res.json({ likes: recipe.likes });
    } catch (error) {
        console.error('Like recipe error:', error);
        res.status(500).json({ error: 'Failed to like recipe' });
    }
});

// View a recipe (increment view count)
app.post('/api/recipes/:id/view', (req, res) => {
    try {
        const recipes = readRecipes();
        const recipe = recipes.find(r => r.id === req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        recipe.views = (recipe.views || 0) + 1;
        writeRecipes(recipes);

        res.json({ views: recipe.views });
    } catch (error) {
        console.error('View recipe error:', error);
        res.status(500).json({ error: 'Failed to record view' });
    }
});

// Get recipe recommendations based on user's description
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

        // Get all existing recipes
        const recipes = readRecipes();
        const recipeNames = recipes.map(r => r.name).join('、');

        // Ask AI for recommendations
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
                messages: [
                    { role: 'user', content: prompt }
                ],
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

        // Match existing recipes
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`✨ Ghibli Recipe Server running on http://localhost:${PORT}`);
    console.log(`🎨 API Key configured: ${process.env.AI_GATEWAY_API_KEY ? 'Yes' : 'No'}`);
});
