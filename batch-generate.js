const axios = require('axios');

// 热门中餐菜品列表
const popularDishes = [
    '水煮鱼',
    '回锅肉',
    '鱼香茄子',
    '西红柿炒鸡蛋',
    '糖醋里脊',
    '青椒肉丝',
    '蒜蓉西兰花',
    '酸辣土豆丝',
    '清蒸鲈鱼',
    '红烧茄子',
    '干煸豆角',
    '木须肉',
    '京酱肉丝',
    '黄焖鸡',
    '香菇油菜',
    '虎皮青椒',
    '蚝油生菜',
    '凉拌三丝',
    '麻辣香锅',
    '干锅花菜'
];

async function generateRecipe(dishName) {
    try {
        console.log(`\n🍳 开始生成: ${dishName}`);
        const startTime = Date.now();

        const response = await axios.post('http://localhost:3000/api/recipes/generate', {
            dishName
        }, {
            timeout: 300000 // 5分钟超时
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (response.data.cached) {
            console.log(`✓ ${dishName} - 已存在（${elapsed}秒）`);
            return { success: true, cached: true, dishName, elapsed };
        } else {
            console.log(`✅ ${dishName} - 生成成功（${elapsed}秒）`);
            return { success: true, cached: false, dishName, elapsed };
        }
    } catch (error) {
        console.error(`❌ ${dishName} - 生成失败:`, error.message);
        return { success: false, dishName, error: error.message };
    }
}

async function batchGenerate() {
    console.log(`🎨 开始批量生成 ${popularDishes.length} 个菜品...\n`);
    const startTime = Date.now();

    const results = [];

    // 逐个生成（避免并发导致API限流）
    for (const dish of popularDishes) {
        const result = await generateRecipe(dish);
        results.push(result);

        // 每个菜品之间间隔2秒，避免API限流
        if (popularDishes.indexOf(dish) < popularDishes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // 统计结果
    const successful = results.filter(r => r.success && !r.cached).length;
    const cached = results.filter(r => r.success && r.cached).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 批量生成完成统计');
    console.log('='.repeat(60));
    console.log(`✅ 新生成: ${successful} 个`);
    console.log(`📦 已存在: ${cached} 个`);
    console.log(`❌ 失败: ${failed} 个`);
    console.log(`⏱️  总耗时: ${totalElapsed} 秒`);
    console.log('='.repeat(60));

    if (failed > 0) {
        console.log('\n❌ 失败的菜品:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.dishName}: ${r.error}`);
        });
    }
}

// 运行批量生成
batchGenerate().catch(error => {
    console.error('批量生成过程出错:', error);
    process.exit(1);
});
