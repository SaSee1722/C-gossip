#!/bin/bash

# Script to remove all reanimated animations from the project

FILES=(
  "app/(onboarding)/auth.tsx"
  "app/(onboarding)/index.tsx"
  "app/(onboarding)/setup.tsx"
  "app/lock.tsx"
  "app/chat/[id].tsx"
  "app/(app)/(tabs)/groups.tsx"
  "app/(app)/(tabs)/status.tsx"
  "app/(app)/(tabs)/settings.tsx"
  "app/(app)/chat/[id].tsx"
  "app/(app)/(tabs)/index.tsx"
)

echo "Removing all reanimated animations..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Replace Animated.View with View
    sed -i '' 's/<Animated\.View/<View/g' "$file"
    sed -i '' 's/<\/Animated\.View>/<\/View>/g' "$file"
    
    # Replace Animated.Image with Image
    sed -i '' 's/<Animated\.Image/<Image/g' "$file"
    sed -i '' 's/<\/Animated\.Image>/<\/Image>/g' "$file"
    
    # Replace Animated.Text with Text
    sed -i '' 's/<Animated\.Text/<Text/g' "$file"
    sed -i '' 's/<\/Animated\.Text>/<\/Text>/g' "$file"
    
    # Remove entering props
    sed -i '' 's/ entering={[^}]*}//g' "$file"
    
    # Remove exiting props
    sed -i '' 's/ exiting={[^}]*}//g' "$file"
    
    # Remove layout props
    sed -i '' 's/ layout={[^}]*}//g' "$file"
    
    echo "✓ Fixed $file"
  fi
done

echo ""
echo "✅ All files processed!"
echo "Now restart your Expo server: npx expo start -c"
