import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { ShadcnColors, ShadcnTypography, ShadcnSpacing, ShadcnBorderRadius } from '../../theme/shadcn-inspired';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? ShadcnColors.button.primary.foreground : ShadcnColors.foreground.primary} 
          size="small" 
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ShadcnBorderRadius.md,
    borderWidth: 1,
  },
  
  // Variants
  primary: {
    backgroundColor: ShadcnColors.button.primary.background,
    borderColor: ShadcnColors.button.primary.background,
  },
  secondary: {
    backgroundColor: ShadcnColors.button.secondary.background,
    borderColor: ShadcnColors.button.secondary.background,
  },
  destructive: {
    backgroundColor: ShadcnColors.button.destructive.background,
    borderColor: ShadcnColors.button.destructive.background,
  },
  outline: {
    backgroundColor: ShadcnColors.button.outline.background,
    borderColor: ShadcnColors.button.outline.border,
  },
  ghost: {
    backgroundColor: ShadcnColors.button.ghost.background,
    borderColor: 'transparent',
  },
  
  // Sizes
  smSize: {
    paddingHorizontal: ShadcnSpacing.sm,
    paddingVertical: ShadcnSpacing.xs,
    minHeight: 32,
  },
  mdSize: {
    paddingHorizontal: ShadcnSpacing.md,
    paddingVertical: ShadcnSpacing.sm,
    minHeight: 40,
  },
  lgSize: {
    paddingHorizontal: ShadcnSpacing.lg,
    paddingVertical: ShadcnSpacing.md,
    minHeight: 48,
  },
  
  // Text styles
  text: {
    fontWeight: ShadcnTypography.fontWeight.medium,
    textAlign: 'center',
  },
  primaryText: {
    color: ShadcnColors.button.primary.foreground,
    fontSize: ShadcnTypography.fontSize.sm,
  },
  secondaryText: {
    color: ShadcnColors.button.secondary.foreground,
    fontSize: ShadcnTypography.fontSize.sm,
  },
  destructiveText: {
    color: ShadcnColors.button.destructive.foreground,
    fontSize: ShadcnTypography.fontSize.sm,
  },
  outlineText: {
    color: ShadcnColors.button.outline.foreground,
    fontSize: ShadcnTypography.fontSize.sm,
  },
  ghostText: {
    color: ShadcnColors.button.ghost.foreground,
    fontSize: ShadcnTypography.fontSize.sm,
  },
  
  // Text sizes
  smText: {
    fontSize: ShadcnTypography.fontSize.xs,
  },
  mdText: {
    fontSize: ShadcnTypography.fontSize.sm,
  },
  lgText: {
    fontSize: ShadcnTypography.fontSize.base,
  },
  
  // Disabled states
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});
