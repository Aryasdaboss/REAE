import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RankedTask } from '../services/rankingEngine';
import TaskCard from './TaskCard';

// ── Palette ───────────────────────────────────────────────────────────────────
const GOLD_WARM = '#C8A415';
const MUTED     = 'rgba(255,255,255,0.50)';

interface Props {
  tasks: RankedTask[];
  defaultExpanded?: boolean;
}

export default function DoneSection({ tasks, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (tasks.length === 0) return null;

  return (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => setExpanded(e => !e)}
        style={styles.header}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        accessibilityRole="button"
        accessibilityLabel={`Today's wins, ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}, ${expanded ? 'collapse' : 'expand'}`}
      >
        <Text style={styles.title}>Today's wins · {tasks.length}</Text>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} variant="done" />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 22,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },

  title: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD_WARM,
    letterSpacing: 2,
    textTransform: 'uppercase',
    flex: 1,
  },

  chevron: {
    color: MUTED,
    fontSize: 12,
    marginLeft: 6,
  },
});
