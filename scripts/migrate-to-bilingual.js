#!/usr/bin/env node

/**
 * Migration Script: Convert single-language recipes to bilingual format
 *
 * This script:
 * 1. Reads existing recipes from recipes.json
 * 2. Identifies Chinese recipes (language='zh' or no language field)
 * 3. Uses Claude to translate each recipe to English
 * 4. Merges translations into bilingual format with _zh and _en suffixes
 * 5. Backs up original data and saves migrated data
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const RECIPES_PATH = path.join(__dirname, '../data/recipes.json');
const BACKUP_PATH = path.join(__dirname, '../data/recipes.backup.json');
const API_KEY = process.env.AI_GATEWAY_API_KEY;

if (!API_KEY) {
    console.error('❌ Error: AI_GATEWAY_API_KEY environment variable not set');
    process.exit(1);
}

// Difficulty mapping
const DIFFICULTY_MAP = {
    '简单': 'Easy',
    '中等': 'Medium',
    '困难': 'Hard',
    'Easy': 'Easy',
    'Medium': 'Medium',
    'Hard': 'Hard'
};

async function translateRecipe(recipe) {
    console.log(`\n🔄 Translating: ${recipe.name}`);

    const prompt = `Translate this Chinese recipe to English. Return ONLY a JSON object with these exact fields (no markdown, no explanation):

{
  "name_en": "English dish name",
  "description_en": "Short description in English (under 50 characters)",
  "difficulty_en": "Easy/Medium/Hard",
  "ingredients_en": ["ingredient 1 with amount", "ingredient 2 with amount", ...],
  "steps_en": ["step 1 description", "step 2 description", ...],
  "tips_en": "Cooking tips in English",
  "author_en": "AI Kitchen"
}

Chinese Recipe:
- Name: ${recipe.name}
- Description: ${recipe.description}
- Difficulty: ${recipe.difficulty}
- Ingredients: ${JSON.stringify(recipe.ingredients)}
- Steps: ${JSON.stringify(recipe.steps)}
- Tips: ${recipe.tips}

IMPORTANT: Return ONLY the JSON object, no other text.`;

    const requestData = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
            role: 'user',
            content: prompt
        }]
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(requestData)
            },
            timeout: 30000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        throw new Error(`API error: ${res.statusCode} - ${data}`);
                    }

                    const response = JSON.parse(data);
                    const content = response.content[0].text;

                    // Extract JSON from response (handle markdown code blocks)
                    let jsonStr = content.trim();
                    if (jsonStr.startsWith('```json')) {
                        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                    } else if (jsonStr.startsWith('```')) {
                        jsonStr = jsonStr.replace(/```\n?/g, '');
                    }

                    const translation = JSON.parse(jsonStr);
                    console.log(`  ✓ Translated to: ${translation.name_en}`);
                    resolve(translation);
                } catch (error) {
                    console.error(`  ✗ Parse error:`, error.message);
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(requestData);
        req.end();
    });
}

async function migrateRecipes() {
    console.log('🌍 Starting bilingual migration...\n');

    // Load existing recipes
    const recipesData = fs.readFileSync(RECIPES_PATH, 'utf8');
    const recipes = JSON.parse(recipesData);
    console.log(`📚 Loaded ${recipes.length} recipes`);

    // Backup original data
    fs.writeFileSync(BACKUP_PATH, recipesData);
    console.log(`💾 Backup created at: ${BACKUP_PATH}`);

    const migratedRecipes = [];
    let translated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        const recipeNum = `${i + 1}/${recipes.length}`;

        try {
            // Check if already bilingual
            if (recipe.name_zh && recipe.name_en) {
                console.log(`[${recipeNum}] ⏭️  Skipping ${recipe.name_zh} (already bilingual)`);
                migratedRecipes.push(recipe);
                skipped++;
                continue;
            }

            // Check if it's an English-only recipe
            if (recipe.language === 'en') {
                console.log(`[${recipeNum}] ⏭️  Skipping ${recipe.name} (English-only, will translate later)`);
                // Keep as-is for now, will be handled separately
                migratedRecipes.push(recipe);
                skipped++;
                continue;
            }

            // It's a Chinese recipe, translate it
            console.log(`[${recipeNum}] 🇨🇳 Processing Chinese recipe...`);

            const translation = await translateRecipe(recipe);

            // Create bilingual recipe
            const bilingualRecipe = {
                id: recipe.id,
                name_zh: recipe.name,
                name_en: translation.name_en,
                description_zh: recipe.description,
                description_en: translation.description_en,
                emoji: recipe.emoji,
                cookTime: recipe.cookTime,
                difficulty_zh: recipe.difficulty,
                difficulty_en: DIFFICULTY_MAP[recipe.difficulty] || translation.difficulty_en,
                servings: recipe.servings,
                ingredients_zh: recipe.ingredients,
                ingredients_en: translation.ingredients_en,
                steps_zh: recipe.steps,
                steps_en: translation.steps_en,
                tips_zh: recipe.tips,
                tips_en: translation.tips_en,
                imageUrl: recipe.imageUrl,
                stepImages: recipe.stepImages,
                author_zh: recipe.author || 'AI厨房',
                author_en: translation.author_en || 'AI Kitchen',
                authorId: recipe.authorId || 'ai-chef',
                createdAt: recipe.createdAt,
                likes: recipe.likes || 0,
                views: recipe.views || 0
            };

            migratedRecipes.push(bilingualRecipe);
            translated++;

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`[${recipeNum}] ❌ Error translating ${recipe.name}:`, error.message);
            console.log(`  Keeping original recipe...`);
            migratedRecipes.push(recipe);
            errors++;
        }
    }

    // Save migrated recipes
    fs.writeFileSync(
        RECIPES_PATH,
        JSON.stringify(migratedRecipes, null, 2),
        'utf8'
    );

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration complete!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total recipes: ${recipes.length}`);
    console.log(`   - Translated: ${translated}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Final count: ${migratedRecipes.length}`);
    console.log(`\n💾 Original data backed up to: ${BACKUP_PATH}`);
    console.log(`📝 Migrated data saved to: ${RECIPES_PATH}`);
    console.log('='.repeat(50));
}

// Run migration
migrateRecipes().catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
});
