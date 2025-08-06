import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../theme/shadcn-inspired';

const buttonVariants = {
  default: {
    backgroundColor: theme.colors.primary.DEFAULT,
    textColor: theme.colors.primary.foreground,
  },
  destructive: {
    backgroundColor: theme.colors.destructive.DEFAULT,
    textColor: theme.colors.destructive.foreground,
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: theme.colors.foreground.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary.DEFAULT,
    textColor: theme.colors.secondary.foreground,
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: theme.colors.foreground.primary,
  },
  link: {
    backgroundColor: 'transparent',
    textColor: theme.colors.primary.DEFAULT,
  },
};

const buttonSizes = {
  default: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  sm: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  lg: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const variantStyles = buttonVariants[variant];
  const sizeStyles = buttonSizes[size];

  const buttonStyle = StyleSheet.flatten([
    styles.base,
    { 
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
    },
    sizeStyles,
    (disabled || loading) && styles.disabled,
    style,
  ]);

  const titleStyle = StyleSheet.flatten([
    theme.typography.button,
    { color: variantStyles.textColor },
    textStyle,
  ]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.textColor} />
      ) : (
        <Text style={titleStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Button;
