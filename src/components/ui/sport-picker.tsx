// allows user to select perfered sport on profile-setup
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SPORTS } from '@/constants/sports';

type SportPickerProps = {
  value: string;
  onChange: (sport: string) => void;
};

export function SportPicker({ value, onChange }: SportPickerProps) {
  return (
    <View style={styles.container}>
      {SPORTS.map((sport) => {
        const isSelected = sport === value;
        return (
          <Pressable
            key={sport}
            onPress={() => onChange(sport)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{sport}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipSelected: { backgroundColor: '#2F6B3C', borderColor: '#2F6B3C' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
});