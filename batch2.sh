#!/bin/bash

# 第二批菜品 - 甜点和汤类
dishes=(
    "银耳莲子羹"
    "红豆沙"
    "绿豆汤"
    "冰糖雪梨"
    "木瓜炖雪蛤"
    "双皮奶"
    "姜撞奶"
    "龟苓膏"
    "豆腐脑"
    "糖水鸡蛋"
    "酒酿圆子"
    "八宝粥"
    "皮蛋瘦肉粥"
    "海鲜粥"
    "鸡蓉玉米羹"
    "酸辣汤"
    "西湖牛肉羹"
    "紫菜蛋花汤"
    "番茄蛋汤"
    "冬瓜排骨汤"
    "玉米排骨汤"
    "萝卜牛腩汤"
    "莲藕排骨汤"
    "山药排骨汤"
    "鸡汤"
    "老鸭汤"
    "鲫鱼豆腐汤"
    "酸菜鱼"
    "剁椒鱼头汤"
    "番茄鱼片汤"
)

echo "🎨 [批次2] 开始生成 ${#dishes[@]} 个菜品..."
echo "⏰ 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

success=0
cached=0
failed=0

for i in "${!dishes[@]}"; do
    dish="${dishes[$i]}"
    progress=$((i + 1))

    echo "[$progress/${#dishes[@]}] 🍳 生成: $dish"

    response=$(curl -s -X POST http://localhost:3000/api/recipes/generate \
        -H "Content-Type: application/json" \
        -d "{\"dishName\":\"$dish\"}" \
        --max-time 300 2>&1)

    if [ $? -eq 0 ]; then
        if echo "$response" | grep -q '"cached":true'; then
            echo "✓ $dish - 已存在"
            ((cached++))
        elif echo "$response" | grep -q '"recipe"'; then
            echo "✅ $dish - 生成成功"
            ((success++))
        else
            echo "❌ $dish - 失败"
            ((failed++))
        fi
    else
        echo "❌ $dish - 超时或错误"
        ((failed++))
    fi

    total_processed=$((success + cached + failed))
    echo "   进度: $total_processed/${#dishes[@]} | 成功:$success | 已有:$cached | 失败:$failed"
    echo ""

    sleep 2
done

echo "========================================"
echo "📊 [批次2] 完成统计"
echo "========================================"
echo "✅ 新生成: $success 个"
echo "📦 已存在: $cached 个"
echo "❌ 失败: $failed 个"
echo "🕐 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
