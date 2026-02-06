const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Try to get API key from environment or fallback
let API_KEY = process.env.AI_GATEWAY_API_KEY;

// If not in env, try to read from a common location
if (!API_KEY) {
    try {
        const fs_check = require('fs');
        if (fs_check.existsSync('/run/secrets/ai_gateway_key')) {
            API_KEY = fs_check.readFileSync('/run/secrets/ai_gateway_key', 'utf8').trim();
        }
    } catch (e) {
        // Ignore
    }
}

if (!API_KEY) {
    console.error('❌ AI_GATEWAY_API_KEY not set');
    console.error('Please set the AI_GATEWAY_API_KEY environment variable');
    process.exit(1);
}

console.log('✓ API Key loaded successfully');

const API_BASE = 'https://ai-gateway-api-3.claudecode.com/v1';

// Sample dishes to generate
const sampleDishes = [
    { name: '麻婆豆腐', cuisine: '川菜' },
    { name: '番茄炒蛋', cuisine: '家常菜' },
    { name: '宫保鸡丁', cuisine: '川菜' },
    { name: '红烧肉', cuisine: '江浙菜' },
    { name: '糖醋排骨', cuisine: '家常菜' },
    { name: '鱼香肉丝', cuisine: '川菜' },
    { name: '回锅肉', cuisine: '川菜' },
    { name: '水煮鱼', cuisine: '川菜' }
];

async function generateRecipe(dishName, cuisine) {
    console.log(`\n🍳 Generating recipe for: ${dishName}`);

    try {
        // Generate recipe content
        const recipePrompt = `请为"${dishName}"生成一份详细的中文食谱。菜系：${cuisine}。

请以JSON格式返回，包含以下字段：
{
  "name": "菜名",
  "description": "一句话简介（20字以内）",
  "emoji": "合适的emoji表情",
  "cookTime": 烹饪时间（分钟，数字）,
  "difficulty": "简单/中等/困难",
  "servings": 几人份（数字）,
  "ingredients": ["食材1 用量", "食材2 用量"],
  "steps": ["步骤1", "步骤2"],
  "tips": "烹饪小贴士"
}

只返回JSON，不要其他内容。`;

        console.log('  📝 Generating recipe content...');
        const recipeResponse = await axios.post(
            `${API_BASE}/chat/completions`,
            {
                model: 'claude-sonnet-4',
                messages: [{ role: 'user', content: recipePrompt }],
                max_tokens: 2000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            }
        );

        const content = recipeResponse.data.choices[0].message.content;
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
        const recipeData = JSON.parse(jsonMatch ? jsonMatch[1] : content);

        console.log('  ✓ Recipe content generated');

        // Generate Ghibli-style image
        console.log('  🎨 Generating Ghibli-style image...');
        const imagePrompt = `A beautiful Studio Ghibli style illustration of ${dishName}, featuring the finished dish with warm, inviting colors and soft lighting. The scene should have a cozy, hand-painted aesthetic with detailed food presentation, steam rising from the dish, and a magical, whimsical atmosphere. Watercolor style with rich textures and dreamy ambiance, traditional Chinese kitchen setting with wooden elements.`;

        const imageResponse = await axios.post(
            `${API_BASE}/images/generations`,
            {
                model: 'flux-1.1-pro',
                prompt: imagePrompt,
                n: 1,
                size: '1024x1024'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            }
        );

        const imageUrl = imageResponse.data.data[0].url;
        console.log('  ✓ Image generated');

        const recipe = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...recipeData,
            imageUrl,
            author: 'AI厨房',
            authorId: 'ai-chef',
            createdAt: new Date().toISOString(),
            likes: Math.floor(Math.random() * 50),
            views: Math.floor(Math.random() * 200)
        };

        console.log(`  ✅ Recipe "${dishName}" generated successfully`);
        return recipe;

    } catch (error) {
        console.error(`  ❌ Failed to generate "${dishName}":`, error.response?.data || error.message);
        return null;
    }
}

async function seedRecipes() {
    console.log('🌿 Starting recipe generation...\n');

    const recipesFile = path.join(__dirname, '../data/recipes.json');
    let existingRecipes = [];

    if (fs.existsSync(recipesFile)) {
        existingRecipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8'));
        console.log(`📚 Found ${existingRecipes.length} existing recipes`);
    }

    const newRecipes = [];
    let successCount = 0;
    let failCount = 0;

    for (const dish of sampleDishes) {
        // Check if recipe already exists
        const exists = existingRecipes.find(r => r.name === dish.name);
        if (exists) {
            console.log(`⏭️  Skipping "${dish.name}" (already exists)`);
            continue;
        }

        const recipe = await generateRecipe(dish.name, dish.cuisine);
        if (recipe) {
            newRecipes.push(recipe);
            successCount++;
        } else {
            failCount++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (newRecipes.length > 0) {
        const allRecipes = [...existingRecipes, ...newRecipes];
        fs.writeFileSync(recipesFile, JSON.stringify(allRecipes, null, 2));
        console.log(`\n✅ Generated ${successCount} new recipes`);
        console.log(`📁 Total recipes in database: ${allRecipes.length}`);
    } else {
        console.log('\n✅ All recipes already exist, nothing to generate');
    }

    if (failCount > 0) {
        console.log(`⚠️  ${failCount} recipes failed to generate`);
    }

    console.log('\n🎉 Recipe seeding complete!');
}

seedRecipes().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
