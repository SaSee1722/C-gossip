// Mock react-native-reanimated
import { View } from 'react-native';
import React from 'react';

const Animated = { View, Text: View, Image: View, ScrollView: View, createAnimatedComponent: (c: any) => c };
export const FadeIn = { duration: () => ({}), delay: () => ({}), springify: () => ({}) };
export const FadeInDown = { duration: () => ({}), delay: () => ({}), springify: () => ({}) };
export const FadeInUp = { duration: () => ({}), delay: () => ({}), springify: () => ({}) };
export const FadeInRight = { duration: () => ({}), delay: () => ({}), springify: () => ({}) };
export const FadeInLeft = { duration: () => ({}), delay: () => ({}), springify: () => ({}) };
export const ZoomIn = { duration: () => ({}), delay: () => ({}), springify: () => ({}) };
export const SlideInUp = { duration: () => ({}), delay: () => ({}), springify: () => ({}) };
export const SlideInDown = { duration: () => ({}), delay: () => ({}), springify: () => ({}) };
export const useAnimatedStyle = () => ({});
export const useSharedValue = (v: any) => ({ value: v });
export const withSpring = (v: any) => v;
export const withTiming = (v: any) => v;
export default Animated;
