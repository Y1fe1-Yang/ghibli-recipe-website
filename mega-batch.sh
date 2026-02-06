#!/bin/bash

# 超大规模菜品列表 - 50个热门中餐
dishes=(
    "干煸豆角"
    "京酱肉丝"
    "黄焖鸡"
    "香菇油菜"
    "虎皮青椒"
    "蚝油生菜"
    "凉拌三丝"
    "麻辣香锅"
    "干锅花菜"
    "辣子鸡丁"
    "蒜泥白肉"
    "口味虾"
    "剁椒鱼头"
    "毛血旺"
    "水煮牛肉"
    "夫妻肺片"
    "椒盐排骨"
    "糖醋鱼"
    "红烧狮子头"
    "东坡肉"
    "梅菜扣肉"
    "粉蒸肉"
    "锅包肉"
    "松鼠鳜鱼"
    "佛跳墙"
    "盐水鸭"
    "叫花鸡"
    "白切鸡"
    "手撕包菜"
    "地三鲜"
    "锅塌豆腐"
    "家常豆腐"
    "铁板豆腐"
    "麻婆豆腐"
    "蟹黄豆腐"
    "茄汁大虾"
    "油焖大虾"
    "白灼虾"
    "龙井虾仁"
    "清炒虾仁"
    "腰果虾仁"
    "蒜蓉粉丝蒸扇贝"
    "葱爆海参"
    "红烧海参"
    "蒜蓉蒸生蚝"
    "姜葱炒蟹"
    "避风塘炒蟹"
    "清蒸多宝鱼"
    "红烧带鱼"
    "干炸小黄鱼"
)

echo "🎨 开始超大规模批量生成 ${#dishes[@]} 个菜品..."
echo "⏰ 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

success=0
cached=0
failed=0
start_time=$(date +%s)

for i in "${!dishes[@]}"; do
    dish="${dishes[$i]}"
    progress=$((i + 1))

    echo "[$progress/${#dishes[@]}] 🍳 生成: $dish"

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

    # 显示当前统计
    total_processed=$((success + cached + failed))
    echo "   进度: $total_processed/${#dishes[@]} | 成功:$success | 已有:$cached | 失败:$failed"
    echo ""

    # 每10个菜品显示一次时间统计
    if [ $((progress % 10)) -eq 0 ]; then
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        avg_time=$((elapsed / progress))
        remaining=$((${#dishes[@]} - progress))
        eta=$((avg_time * remaining))
        eta_min=$((eta / 60))

        echo "📊 阶段性统计 [$progress/${#dishes[@]}]"
        echo "   平均每个菜品: ${avg_time}秒"
        echo "   预计剩余时间: ${eta_min}分钟"
        echo "========================================"
        echo ""
    fi

    sleep 2  # 避免API限流
done

end_time=$(date +%s)
total_time=$((end_time - start_time))
total_min=$((total_time / 60))
total_sec=$((total_time % 60))

echo ""
echo "========================================"
echo "📊 超大规模批量生成完成统计"
echo "========================================"
echo "✅ 新生成: $success 个"
echo "📦 已存在: $cached 个"
echo "❌ 失败: $failed 个"
echo "⏱️  总耗时: ${total_min}分${total_sec}秒"
echo "🕐 完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
