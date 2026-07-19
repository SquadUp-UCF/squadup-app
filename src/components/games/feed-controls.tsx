// Home controls: the Feed/Map view toggle plus separated Filter and Sort.
// Filter sits on the left, Sort on the right; each opens a panel downward and
// turns green (active) while open. Sort is hidden in Map view. All state lives
// in the parent (home); this is presentational. Styled with the shared theme.
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { availableSports, sportLabel } from '@/components/ui/sport-icon';
import { colors, fonts, fontSizes, radii, spacing } from '@/constants/theme';

export type ViewMode = 'feed' | 'map';
export type SortKey = 'distance' | 'recent' | 'players';
export type SkillFilter = 'all' | 'beginner' | 'intermediate' | 'pro';

const SKILLS: { value: SkillFilter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'pro', label: 'Pro' },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'distance', label: 'Distance' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'players', label: 'Player Count' },
];

type Props = {
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  sport: string; // '' = all sports
  onSport: (sport: string) => void;
  skill: SkillFilter | null; // null = any skill
  onSkill: (skill: SkillFilter | null) => void;
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  distanceNote?: string | null;
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function FeedControls({
  viewMode,
  onViewMode,
  sport,
  onSport,
  skill,
  onSkill,
  sort,
  onSort,
  distanceNote,
}: Props) {
  const [openPanel, setOpenPanel] = useState<'filter' | 'sort' | null>(null);
  const filterOpen = openPanel === 'filter';
  const sortOpen = openPanel === 'sort';
  const hasFilters = sport !== '' || skill !== null;

  function setView(mode: ViewMode) {
    if (mode === 'map' && sortOpen) setOpenPanel(null);
    onViewMode(mode);
  }

  const filterColor = filterOpen || hasFilters ? colors.green : colors.text;
  const sortColor = sortOpen ? colors.green : colors.text;

  return (
    <View style={styles.wrap}>
      <View style={styles.toggleRow}>
        <Text
          style={[
            styles.toggleLabel,
            styles.toggleLabelLeft,
            viewMode === 'feed' && styles.toggleLabelActive,
          ]}
          numberOfLines={1}
        >
          Feed View
        </Text>
        <Switch
          value={viewMode === 'map'}
          onValueChange={(v) => setView(v ? 'map' : 'feed')}
          trackColor={{ false: colors.borderStrong, true: colors.green }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.borderStrong}
        />
        <Text
          style={[
            styles.toggleLabel,
            styles.toggleLabelRight,
            viewMode === 'map' && styles.toggleLabelActive,
          ]}
          numberOfLines={1}
        >
          Map View (Live)
        </Text>
      </View>

      <View style={styles.controlsRow}>
        <Pressable style={styles.control} onPress={() => setOpenPanel(filterOpen ? null : 'filter')}>
          <Feather name="filter" size={16} color={filterColor} />
          <Text style={[styles.controlText, { color: filterColor }]}>Filter</Text>
        </Pressable>

        {viewMode === 'feed' ? (
          <Pressable style={styles.control} onPress={() => setOpenPanel(sortOpen ? null : 'sort')}>
            <Feather name="chevrons-down" size={16} color={sortColor} />
            <Text style={[styles.controlText, { color: sortColor }]}>Sort</Text>
          </Pressable>
        ) : null}
      </View>

      {filterOpen ? (
        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent} nestedScrollEnabled>
          <Text style={styles.group}>By Sport</Text>
          <View style={styles.wrapRow}>
            {availableSports.map((s) => (
              <Chip
                key={s}
                label={sportLabel(s)}
                selected={sport === s}
                onPress={() => onSport(sport === s ? '' : s)}
              />
            ))}
          </View>

          <Text style={styles.group}>By Skill Level</Text>
          <View style={styles.wrapRow}>
            {SKILLS.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                selected={skill === s.value}
                onPress={() => onSkill(skill === s.value ? null : s.value)}
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      {sortOpen && viewMode === 'feed' ? (
        <View style={styles.panel}>
          <View style={styles.wrapRow}>
            {SORTS.map((s) => (
              <Chip key={s.value} label={s.label} selected={sort === s.value} onPress={() => onSort(s.value)} />
            ))}
          </View>
          {sort === 'distance' && distanceNote ? <Text style={styles.note}>{distanceNote}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  // Equal-width labels put the switch on the screen's centre line rather than
  // the centre of the row: "Map View (Live)" is the wider label, so centring
  // the group as a whole pushed the switch left. Fixed widths also stop the
  // switch shifting when the active label turns bold.
  toggleLabel: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  toggleLabelLeft: { textAlign: 'right' },
  toggleLabelRight: { textAlign: 'left' },
  toggleLabelActive: { color: colors.text, fontFamily: fonts.bodyBold },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  control: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  controlText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md },
  panel: {
    maxHeight: 260,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  panelContent: { gap: spacing.sm },
  group: { fontFamily: fonts.headingBold, fontSize: fontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.muted, marginTop: 2 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, color: colors.text },
  chipTextSelected: { color: colors.white, fontFamily: fonts.bodyBold },
  note: { fontFamily: fonts.body, fontSize: fontSizes.xs, color: colors.muted, marginTop: spacing.sm },
});
