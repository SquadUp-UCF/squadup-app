// The su-submit look from AuthShell.css: solid green pill button.
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

type PrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: 'solid' | 'outline';
};

export function PrimaryButton({ label, loading, variant = 'solid', disabled, style, ...rest }: PrimaryButtonProps) {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      disabled={disabled || loading}
      style={[
        styles.button,
        isOutline ? styles.outline : styles.solid,
        (disabled || loading) && styles.disabled,
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.green : colors.white} />
      ) : (
        <Text style={[styles.label, isOutline && styles.labelOutline]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  solid: { backgroundColor: colors.green },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.green },
  disabled: { opacity: 0.5 },
  label: { color: colors.white, fontFamily: fonts.headingBold, fontSize: fontSizes.lg },
  labelOutline: { color: colors.green },
});
