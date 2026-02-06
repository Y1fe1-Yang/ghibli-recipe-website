#!/bin/bash

while true; do
    clear
    echo "============================================"
    echo "🎨 吉卜力食谱厨房 - 超大规模批量生成监控"
    echo "============================================"
    echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # 数据库状态
    cd /home/node/a0/workspace/1ddc8f95-8e73-43aa-9c74-9b9074f6f536/workspace/ghibli-recipe-app
    recipe_count=$(cat data/recipes.json | jq 'length')
    echo "📚 数据库当前食谱数: $recipe_count"
    echo ""

    # 批次1进度
    echo "🔥 批次1 (主菜50道) - mega-batch.log"
    if [ -f /tmp/mega-batch.log ]; then
        tail -3 /tmp/mega-batch.log | grep -E "^\[|进度:|成功:" | tail -2
    else
        echo "  未启动"
    fi
    echo ""

    # 批次2进度
    echo "🍜 批次2 (汤羹30道) - batch2.log"
    if [ -f /tmp/batch2.log ]; then
        tail -3 /tmp/batch2.log | grep -E "^\[|进度:|成功:" | tail -2
    else
        echo "  未启动"
    fi
    echo ""

    # 服务器活动
    echo "⚡ 服务器最新活动:"
    tail -3 /tmp/ghibli-server.log | grep -E "Generating|✓.*image|✅" | tail -2
    echo ""

    # 最新生成的5个食谱
    echo "🆕 最新5个食谱:"
    cat data/recipes.json | jq -r '.[-5:] | .[] | "  \(.name)"'
    echo ""

    echo "============================================"
    echo "按 Ctrl+C 停止监控"
    echo "============================================"

    sleep 10
done
