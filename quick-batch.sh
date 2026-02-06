#!/bin/bash

# 热门菜品列表
dishes=(
    "回锅肉"
    "鱼香茄子"
    "糖醋里脊"
    "青椒肉丝"
    "蒜蓉西兰花"
    "酸辣土豆丝"
    "清蒸鲈鱼"
    "红烧茄子"
    "干煸豆角"
    "木须肉"
)

echo "🎨 开始批量生成 ${#dishes[@]} 个菜品..."
echo ""

success=0
cached=0
failed=0

for dish in "${dishes[@]}"; do
    echo "🍳 生成: $dish"

    # 调用API
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

    echo ""
    sleep 2  # 避免API限流
done

echo "========================================"
echo "📊 批量生成完成统计"
echo "========================================"
echo "✅ 新生成: $success 个"
echo "📦 已存在: $cached 个"
echo "❌ 失败: $failed 个"
echo "========================================"
