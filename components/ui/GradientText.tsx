import React from 'react';
import { Text, View, TextStyle, StyleSheet, Platform } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';

interface GradientTextProps {
    text: string;
    style?: TextStyle;
    colors?: [string, string];
}

export function GradientText({
    text,
    style,
    colors: customColors = [colors.primary, colors.secondary]
}: GradientTextProps) {
    if (!text) return null;

    const firstChar = text.charAt(0);
    const rest = text.slice(1);

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <Text style={[style, { color: customColors[0] }]}>
                    {firstChar}
                </Text>
                <Text
                    style={[
                        style,
                        {
                            backgroundImage: `linear-gradient(to right, ${customColors[0]}, ${customColors[1]})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'inline-block',
                        } as any
                    ]}
                >
                    {rest}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[style, { color: customColors[0] }]}>
                {firstChar}
            </Text>
            <MaskedView
                style={styles.maskedView}
                maskElement={
                    <Text style={[style, { backgroundColor: 'transparent' }]}>
                        {rest}
                    </Text>
                }
            >
                <LinearGradient
                    colors={customColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                >
                    <Text style={[style, { opacity: 0 }]}>
                        {rest}
                    </Text>
                </LinearGradient>
            </MaskedView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    maskedView: {
        flexDirection: 'row',
    },
    gradient: {
        flexDirection: 'row',
    },
});
