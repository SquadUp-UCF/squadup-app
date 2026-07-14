// text boxes
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  isPassword?: boolean;
};

export function TextField({ label, style, isPassword, secureTextEntry, ...rest }: TextFieldProps) {
  const [reveal, setReveal] = useState(false);
  const hidden = isPassword ? !reveal : secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, isPassword && styles.inputWithIcon, style]}
          placeholderTextColor={colors.muted}
          secureTextEntry={hidden}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setReveal((v) => !v)}
            style={styles.eyeButton}
            hitSlop={8}
            accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
          >
            <MaterialIcons name={reveal ? 'visibility-off' : 'visibility'} size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.muted,
  },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    width: '100%',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputWithIcon: { paddingRight: 44 },
  eyeButton: { position: 'absolute', right: spacing.md },
});
