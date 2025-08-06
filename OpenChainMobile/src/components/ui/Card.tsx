import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ShadcnColors, ShadcnTypography, ShadcnSpacing, ShadcnBorderRadius, ShadcnShadows } from '../../theme/shadcn-inspired';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'destructive' | 'accent';
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  return (
    <View style={[styles.card, styles[variant], style]}>
      {children}
    </View>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => {
  return (
    <Text style={[styles.title, style]}>
      {children}
    </Text>
  );
};

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, style }) => {
  return (
    <Text style={[styles.description, style]}>
      {children}
    </Text>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ShadcnColors.background.card,
    borderRadius: ShadcnBorderRadius.lg,
    borderWidth: 1,
    borderColor: ShadcnColors.border.primary,
    ...ShadcnShadows.sm,
  },
  
  // Variants
  default: {
    backgroundColor: ShadcnColors.background.card,
    borderColor: ShadcnColors.border.primary,
  },
  destructive: {
    backgroundColor: ShadcnColors.background.destructive,
    borderColor: ShadcnColors.border.destructive,
  },
  accent: {
    backgroundColor: ShadcnColors.background.accent,
    borderColor: ShadcnColors.border.accent,
  },
  
  header: {
    padding: ShadcnSpacing.lg,
    paddingBottom: 0,
  },
  
  title: {
    fontSize: ShadcnTypography.fontSize.lg,
    fontWeight: ShadcnTypography.fontWeight.semibold,
    color: ShadcnColors.foreground.primary,
    lineHeight: ShadcnTypography.lineHeight.tight * ShadcnTypography.fontSize.lg,
  },
  
  description: {
    fontSize: ShadcnTypography.fontSize.sm,
    color: ShadcnColors.foreground.muted,
    marginTop: ShadcnSpacing.xs,
    lineHeight: ShadcnTypography.lineHeight.normal * ShadcnTypography.fontSize.sm,
  },
  
  content: {
    padding: ShadcnSpacing.lg,
  },
  
  footer: {
    padding: ShadcnSpacing.lg,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
