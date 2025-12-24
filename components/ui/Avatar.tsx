import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { colors, borderRadius } from '../../constants/theme';

interface AvatarProps {
  uri?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  hasStory?: boolean;
  storyViewed?: boolean;
}

export function Avatar({ uri, size = 48, style, hasStory, storyViewed }: AvatarProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {hasStory && (
        <View
          style={[
            styles.storyRing,
            {
              width: size + 8,
              height: size + 8,
              borderColor: storyViewed ? colors.text.tertiary : colors.secondary,
            },
          ]}
        />
      )}
      <Image
        source={{ uri: uri || 'https://i.pravatar.cc/150?img=0' }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: colors.glass.medium,
  },
  storyRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: borderRadius.full,
  },
});
