import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme/shadcn-inspired';

interface CardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface CardHeaderProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface CardTitleProps {
  style?: TextStyle;
  children?: React.ReactNode;
}

interface CardDescriptionProps {
  style?: TextStyle;
  children?: React.ReactNode;
}

interface CardContentProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

interface CardFooterProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ style, children }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

export const CardHeader: React.FC<CardHeaderProps> = ({ style, children }) => {
  return <View style={[styles.header, style]}>{children}</View>;
};

export const CardTitle: React.FC<CardTitleProps> = ({ style, children }) => {
  return <Text style={[styles.title, style]}>{children}</Text>;
};

export const CardDescription: React.FC<CardDescriptionProps> = ({ style, children }) => {
  return <Text style={[styles.description, style]}>{children}</Text>;
};

export const CardContent: React.FC<CardContentProps> = ({ style, children }) => {
  return <View style={[styles.content, style]}>{children}</View>;
};

export const CardFooter: React.FC<CardFooterProps> = ({ style, children }) => {
  return <View style={[styles.footer, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.md,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  title: {
    ...theme.typography.h3,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.foreground.secondary,
    marginTop: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.lg,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
