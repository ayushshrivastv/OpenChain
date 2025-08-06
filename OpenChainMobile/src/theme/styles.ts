import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './colors';

// Professional shared styles for OpenChain Mobile
export const SharedStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: Colors.background.primary,
    padding: Spacing.md,
  },
  
  // Professional card styles with refined shadows
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    ...Shadows.sm,
  },
  
  cardGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  
  accentCard: {
    backgroundColor: Colors.background.accent,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  
  // Modern header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: 'transparent',
  },
  
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700' as const,
    color: Colors.text.primary,
    letterSpacing: -0.5,
    lineHeight: Typography.lineHeight.tight,
  },
  
  // Text styles
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700' as const,
    color: Colors.text.onCard,
    marginBottom: Spacing.sm,
  },
  
  subtitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600' as const,
    color: Colors.text.onCard,
    marginBottom: Spacing.xs,
  },
  
  bodyText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '400' as const,
    color: Colors.text.onCard,
    lineHeight: Typography.lineHeight.normal,
  },
  
  captionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '400' as const,
    color: Colors.text.muted,
    lineHeight: Typography.lineHeight.normal,
  },
  
  // Dark theme specific styles
  darkCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    ...Shadows.sm,
  },
  
  darkCardGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    ...Shadows.md,
  },
  
  // Text on dark backgrounds
  titleOnDark: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700' as const,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  
  bodyTextOnDark: {
    fontSize: Typography.fontSize.base,
    fontWeight: '400' as const,
    color: Colors.text.primary,
    lineHeight: Typography.lineHeight.normal,
  },
  
  // Button styles (matching website)
  primaryButton: {
    backgroundColor: Colors.button.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800' as const,
    color: Colors.text.primary,
  },
  
  secondaryButton: {
    backgroundColor: Colors.button.secondary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800' as const,
    color: Colors.text.primary,
  },
  
  // Button on white card (dark button like website)
  cardButton: {
    backgroundColor: Colors.button.onCard,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
  },
  
  cardButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700' as const,
    color: Colors.text.primary,
  },
  
  // Warning/Status buttons
  warningButton: {
    backgroundColor: Colors.button.warning,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  
  dangerButton: {
    backgroundColor: Colors.button.danger,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  
  // Input styles
  input: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.onCard,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  
  inputOnDark: {
    backgroundColor: Colors.background.overlay,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  
  // List styles
  listItem: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  
  // Network badge styles
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.overlay,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  
  networkBadgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500' as const,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  
  // Status indicators
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  
  dividerOnDark: {
    height: 1,
    backgroundColor: Colors.border.primary,
    marginVertical: Spacing.md,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  
  // Error states
  errorContainer: {
    backgroundColor: Colors.status.error,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: '500' as const,
  },
  
  // Success states
  successContainer: {
    backgroundColor: Colors.status.success,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  
  successText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    fontWeight: '500' as const,
  },
  
  // Metric display (for dashboard cards)
  metricContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  
  metricValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800' as const,
    color: Colors.text.onCard,
  },
  
  metricLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500' as const,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
  
  // Tab navigation styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.overlay,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  
  activeTab: {
    backgroundColor: Colors.background.card,
  },
  
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500' as const,
    color: Colors.text.secondary,
  },
  
  activeTabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600' as const,
    color: Colors.text.onCard,
  },

  // Additional styles for BorrowingScreen
  section: {
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700' as const,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600' as const,
    color: Colors.text.onCard,
  },

  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '400' as const,
    color: Colors.text.muted,
  },

  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '400' as const,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500' as const,
    color: Colors.text.muted,
    marginBottom: Spacing.xs,
  },

  value: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600' as const,
    color: Colors.text.onCard,
  },

  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    textAlign: 'center',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },

  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600' as const,
    color: Colors.text.onCard,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },

  emptySubtext: {
    fontSize: Typography.fontSize.base,
    fontWeight: '400' as const,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});

export default SharedStyles;
