// Mobile port of squadup-front's OtpVerif.jsx box UI: 6 auto-advancing boxes.
// RN's TextInput onChangeText can receive multiple characters at once (e.g. an
// autofill or a paste), so that's handled the same way typed input is.
import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, fontSizes, radii } from '@/constants/theme';

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function OtpInput({ value, onChange }: OtpInputProps) {
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '');

  function commit(arr: string[]) {
    onChange(arr.join('').slice(0, OTP_LENGTH));
  }

  function focusBox(i: number) {
    inputsRef.current[i]?.focus();
  }

  function handleChange(i: number, text: string) {
    const digits = text.replace(/\D/g, '');
    if (!digits) return; // deletion is handled in onKeyPress below
    if (digits.length > 1) {
      // Multiple digits landed at once (autofill/paste) — spread from this box.
      const arr = boxes.slice();
      for (let k = 0; k < digits.length && i + k < OTP_LENGTH; k++) {
        arr[i + k] = digits[k];
      }
      commit(arr);
      focusBox(Math.min(i + digits.length, OTP_LENGTH - 1));
      return;
    }
    const arr = boxes.slice();
    arr[i] = digits;
    commit(arr);
    if (i < OTP_LENGTH - 1) focusBox(i + 1);
  }

  function handleKeyPress(i: number, key: string) {
    if (key !== 'Backspace') return;
    const arr = boxes.slice();
    if (arr[i]) {
      arr[i] = '';
      commit(arr);
    } else if (i > 0) {
      arr[i - 1] = '';
      commit(arr);
      focusBox(i - 1);
    }
  }

  return (
    <View style={styles.row}>
      {boxes.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          style={styles.box}
          value={digit}
          keyboardType="number-pad"
          maxLength={i === 0 ? OTP_LENGTH : 1}
          textContentType={i === 0 ? 'oneTimeCode' : undefined}
          onChangeText={(text) => handleChange(i, text)}
          onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  box: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontFamily: fonts.headingBold,
    fontSize: fontSizes.xl,
    color: colors.text,
  },
});
