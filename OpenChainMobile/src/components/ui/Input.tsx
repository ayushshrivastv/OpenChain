import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { ShadcnColors, ShadcnTypography, ShadcnSpacing, ShadcnBorderRadius } from '../../theme/shadcn-inspired';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          inputStyle,
        ]}
        placeholderTextColor={ShadcnColors.input.placeholder}
        onFocus={(e) => {
          setIsFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          textInputProps.onBlur?.(e);
        }}
        {...textInputProps}
      />
      {error && (
        <Text style={[styles.error, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ShadcnSpacing.md,
  },
  
  label: {
    fontSize: ShadcnTypography.fontSize.sm,
    fontWeight: ShadcnTypography.fontWeight.medium,
    color: ShadcnColors.foreground.primary,
    marginBottom: ShadcnSpacing.xs,
  },
  
  input: {
    backgroundColor: ShadcnColors.input.background,
    borderWidth: 1,
    borderColor: ShadcnColors.input.border,
    borderRadius: ShadcnBorderRadius.md,
    paddingHorizontal: ShadcnSpacing.sm,
    paddingVertical: ShadcnSpacing.sm,
    fontSize: ShadcnTypography.fontSize.sm,
    color: ShadcnColors.input.foreground,
    minHeight: 40,
  },
  
  inputFocused: {
    borderColor: ShadcnColors.input.focus,
    borderWidth: 2,
  },
  
  inputError: {
    borderColor: ShadcnColors.status.error,
  },
  
  error: {
    fontSize: ShadcnTypography.fontSize.xs,
    color: ShadcnColors.status.error,
    marginTop: ShadcnSpacing.xs,
  },
});
