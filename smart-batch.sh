#!/bin/bash

# 智能批量生成 - 使用队列系统，用户请求优先

dishes=(
    "京酱肉丝"
    "黄焖鸡"
    "香菇油菜"
    "虎皮青椒"
    "蚝油生菜"
    "麻辣香锅"
    "干锅花菜"
    "辣子鸡丁"
    "蒜泥白肉"
    "剁椒鱼头"
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
    "盐水鸭"
    "白切鸡"
    "手撕包菜"
    "地三鲜"
    "锅塌豆腐"
    "铁板豆腐"
    "蟹黄豆腐"
    "茄汁大虾"
    "龙井虾仁"
    "腰果虾仁"
)

echo "🎨 启动智能批量生成系统"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 总数: ${#dishes[@]} 个菜品"
echo "⚡ 模式: 队列系统（用户请求自动优先）"
echo "🕐 开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 使用新的批量生成API
dishes_json=$(printf '%s\n' "${dishes[@]}" | jq -R . | jq -s .)

curl -X POST http://localhost:3000/api/recipes/batch-generate \
    -H "Content-Type: application/json" \
    -d "{\"dishes\": $dishes_json}" \
    -s | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 批量生成任务已提交到队列"
echo "📊 监控队列状态: curl http://localhost:3000/api/queue/status | jq"
echo "🌐 访问网站: https://3000-capy-1769767690860-469691-preview.happycapy.ai"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
