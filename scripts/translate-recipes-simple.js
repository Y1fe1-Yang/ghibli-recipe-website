#!/usr/bin/env node

/**
 * Simple Translation Script for Bilingual Migration
 * Uses AI Gateway API to translate Chinese recipes to English
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const RECIPES_PATH = path.join(__dirname, '../data/recipes.json');
const BACKUP_PATH = path.join(__dirname, '../data/recipes.backup.json');
const API_KEY = process.env.AI_GATEWAY_API_KEY;

if (!API_KEY) {
    console.error('❌ AI_GATEWAY_API_KEY not set');
    process.exit(1);
}

const DIFFICULTY_MAP = {
    '简单': 'Easy',
    '中等': 'Medium',
    '困难': 'Hard'
};

// Call AI Gateway API (same as server code)
async function callAI(prompt) {
    const requestData = JSON.stringify({
        model: 'claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'ai-gateway.happycapy.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Length': Buffer.byteLength(requestData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`API error: ${res.statusCode} - ${data}`));
                }
                try {
                    const response = JSON.parse(data);
                    const content = response.choices[0].message.content;
                    resolve(content);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(requestData);
        req.end();
    });
}

async function translateRecipe(recipe) {
    console.log(`🔄 [${recipe.name}]`);

    const prompt = `Translate this Chinese recipe to English. Return ONLY valid JSON, no markdown:

{
  "name_en": "English name",
  "description_en": "Short description",
  "ingredients_en": ${JSON.stringify(recipe.ingredients).replace(/"/g, '\\"')},
  "steps_en": ${JSON.stringify(recipe.steps).replace(/"/g, '\\"')},
  "tips_en": "${(recipe.tips || '').replace(/"/g, '\\"')}"
}

Recipe:
Name: ${recipe.name}
Description: ${recipe.description}
Ingredients: ${recipe.ingredients.join(', ')}
Tips: ${recipe.tips || 'None'}

Return ONLY the JSON, nothing else.`;

    const content = await callAI(prompt);

    // Parse JSON from response
    let jsonStr = content.trim();
    if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```/g, '');
    } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```/g, '');
    }

    return JSON.parse(jsonStr.trim());
}

async function main() {
    console.log('🌍 Bilingual Migration Starting...\n');

    const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf8'));
    console.log(`📚 ${recipes.length} recipes loaded`);

    // Backup
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(recipes, null, 2));
    console.log(`💾 Backup saved\n`);

    const migrated = [];
    let count = {translated: 0, skipped: 0, errors: 0};

    for (let i = 0; i < recipes.length; i++) {
        const r = recipes[i];
        console.log(`[${i+1}/${recipes.length}]`, r.name || r.name_zh || r.name_en);

        try {
            // Already bilingual
            if (r.name_zh && r.name_en) {
                console.log('  ⏭️  Already bilingual');
                migrated.push(r);
                count.skipped++;
                continue;
            }

            // English-only (skip for now)
            if (r.language === 'en') {
                console.log('  ⏭️  English-only');
                migrated.push(r);
                count.skipped++;
                continue;
            }

            // Translate Chinese recipe
            const translation = await translateRecipe(r);

            migrated.push({
                id: r.id,
                name_zh: r.name,
                name_en: translation.name_en,
                description_zh: r.description,
                description_en: translation.description_en,
                emoji: r.emoji,
                cookTime: r.cookTime,
                difficulty_zh: r.difficulty,
                difficulty_en: DIFFICULTY_MAP[r.difficulty] || 'Medium',
                servings: r.servings,
                ingredients_zh: r.ingredients,
                ingredients_en: translation.ingredients_en,
                steps_zh: r.steps,
                steps_en: translation.steps_en,
                tips_zh: r.tips || '',
                tips_en: translation.tips_en || '',
                imageUrl: r.imageUrl,
                stepImages: r.stepImages,
                author_zh: r.author || 'AI厨房',
                author_en: 'AI Kitchen',
                authorId: r.authorId || 'ai-chef',
                createdAt: r.createdAt,
                likes: r.likes || 0,
                views: r.views || 0
            });

            console.log(`  ✅ → ${translation.name_en}`);
            count.translated++;

            // Rate limit
            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            migrated.push(r);
            count.errors++;
        }
    }

    // Save
    fs.writeFileSync(RECIPES_PATH, JSON.stringify(migrated, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration Complete');
    console.log(`📊 Translated: ${count.translated}, Skipped: ${count.skipped}, Errors: ${count.errors}`);
    console.log('='.repeat(50));
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
