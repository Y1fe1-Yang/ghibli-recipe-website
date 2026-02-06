#!/bin/bash
# Generate North American recipes in English

echo "🇺🇸 Generating North American Recipe Collection..."
echo "=========================================="

# North American classic dishes
dishes=(
    # American Classics
    "Mac and Cheese"
    "Grilled Cheese Sandwich"
    "BBQ Pulled Pork"
    "Classic Hamburger"
    "Buffalo Wings"
    "Clam Chowder"
    "Chicken Pot Pie"
    "Meatloaf"
    "Cornbread"
    "Coleslaw"

    # Tex-Mex
    "Beef Tacos"
    "Chicken Quesadilla"
    "Nachos Supreme"
    "Chicken Fajitas"
    "Burrito Bowl"

    # Breakfast
    "Pancakes with Maple Syrup"
    "French Toast"
    "Eggs Benedict"
    "Breakfast Burrito"
    "Scrambled Eggs and Bacon"

    # Salads & Sides
    "Caesar Salad"
    "Cobb Salad"
    "Baked Potato"
    "French Fries"
    "Onion Rings"

    # Sandwiches
    "Club Sandwich"
    "Philly Cheesesteak"
    "BLT Sandwich"
    "Reuben Sandwich"
    "Pulled Pork Sandwich"

    # Dinner
    "Roast Turkey"
    "Grilled Salmon"
    "Beef Steak"
    "Baked Chicken"
    "BBQ Ribs"

    # Comfort Food
    "Chili Con Carne"
    "Gumbo"
    "Jambalaya"
    "Pot Roast"
    "Baked Beans"
)

# Convert to JSON array
dishes_json=$(printf '%s\n' "${dishes[@]}" | jq -R . | jq -s .)

echo "Total dishes to generate: ${#dishes[@]}"
echo ""

# Send batch generation request
curl -X POST http://localhost:3000/api/recipes/batch-generate \
    -H "Content-Type: application/json" \
    -d "{\"dishes\": $dishes_json, \"language\": \"en\"}" \
    | jq

echo ""
echo "✅ Batch generation started!"
echo "Monitor progress at: http://localhost:3000/api/queue/status"
