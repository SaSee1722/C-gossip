#!/bin/bash

# Script to remove react-native-reanimated imports from all files

FILES=(
  "app/(onboarding)/auth.tsx"
  "app/(onboarding)/index.tsx"
  "app/(onboarding)/setup.tsx"
  "app/lock.tsx"
  "app/chat/[id].tsx"
  "app/(app)/(tabs)/groups.tsx"
  "app/(app)/(tabs)/status.tsx"
  "app/(app)/(tabs)/connections.tsx"
  "app/(app)/(tabs)/settings.tsx"
  "app/(app)/chat/[id].tsx"
  "app/(app)/(tabs)/index.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Remove the react-native-reanimated import line
    sed -i '' "/import.*from 'react-native-reanimated'/d" "$file"
    # Add Animated to react-native import if not already there
    sed -i '' "s/from 'react-native';/, Animated } from 'react-native';/" "$file"
    sed -i '' "s/, Animated, Animated/, Animated/" "$file"
  fi
done

echo "Done!"
