import { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RankedTask } from '../services/rankingEngine';
import { supabase } from '../services/supabaseClient';

interface SubTask {
  title: string;
  dueDate: string | null;
}

// ── Palette ───────────────────────────────────────────────────────────────────
const NAVY      = '#00274C';
const MAIZE     = '#FFCB05';
const GOLD_WARM = '#C8A415';
const WHITE     = '#FFFFFF';
const MUTED     = 'rgba(255,255,255,0.50)';
const SOFT      = 'rgba(255,255,255,0.72)';
const SURFACE   = 'rgba(255,255,255,0.07)';
const BORDER    = 'rgba(255,255,255,0.13)';

export type TaskCardVariant = 'active' | 'done';

interface Props {
  task: RankedTask;
  variant?: TaskCardVariant;
  onComplete?: (taskId: string) => void;
}

export default function TaskCard({ task, variant = 'active', onComplete }: Props) {
  const isDone = variant === 'done' || task.isCompleted;

  // Local "completing" state lets us disable the circle while the optimistic
  // update is in flight, so a fast double-tap doesn't fire two updates.
  const [completing, setCompleting] = useState(false);

  // Break-it-down state. Sub-tasks live in component memory only — per the
  // FEATURES decision they are not persisted in MVP, so the breakdown button
  // reappears after a page reload (subject to the 10/day server-side limit).
  const [subTasks, setSubTasks]   = useState<SubTask[] | null>(null);
  const [bdLoading, setBdLoading] = useState(false);
  const [bdError, setBdError]     = useState<string | null>(null);

  function handleCompletePress() {
    if (isDone || completing || !onComplete) return;
    setCompleting(true);
    onComplete(task.id);
  }

  async function handleBreakDown() {
    if (bdLoading) return;
    setBdLoading(true);
    setBdError(null);

    const { data, error } = await supabase.functions.invoke('break-it-down', {
      body: { taskId: task.id, title: task.title, dueDate: task.dueDate },
    });

    setBdLoading(false);

    if (error) {
      // Supabase wraps non-2xx responses into FunctionsHttpError. The body of
      // the underlying response holds our friendly message — try to surface it.
      const errAny = error as { context?: { status?: number }; message?: string };
      const status = errAny.context?.status;
      if (status === 429) {
        setBdError("You've used all 10 breakdowns today. Try again tomorrow.");
      } else {
        setBdError("Couldn't break that down right now. Try again in a moment.");
      }
      return;
    }

    const result = data as { subTasks?: SubTask[] };
    if (!result?.subTasks || result.subTasks.length === 0) {
      setBdError('No sub-tasks came back. Try again?');
      return;
    }

    setSubTasks(result.subTasks);
  }

  return (
    <View style={[styles.card, isDone && styles.cardDone]}>
      <TouchableOpacity
        onPress={handleCompletePress}
        disabled={isDone || completing || !onComplete}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={styles.circleWrap}
        accessibilityRole="button"
        accessibilityLabel={isDone ? 'Completed' : `Mark "${task.title}" as done`}
      >
        <View style={[styles.circle, isDone && styles.circleDone]}>
          {isDone && <Text style={styles.check}>✓</Text>}
        </View>
      </TouchableOpacity>

      {task.isPinned && !isDone && <Text style={styles.pin}>★</Text>}

      <View style={styles.body}>
        <Text
          style={[styles.title, isDone && styles.titleDone]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        {!isDone && (
          <View style={styles.metaRow}>
            <Text style={styles.metaImportance}>{task.importance}</Text>
            {task.dueDate && (
              <Text style={styles.metaDue}>· {formatDue(task.dueDate)}</Text>
            )}
          </View>
        )}

        {/* Break-it-down inline area — only on active cards */}
        {!isDone && (
          <View style={styles.bdArea}>
            {subTasks === null && !bdLoading && (
              <TouchableOpacity
                onPress={handleBreakDown}
                style={styles.bdButton}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.bdButtonText}>Break it down</Text>
              </TouchableOpacity>
            )}

            {bdLoading && (
              <View style={styles.bdLoadingRow}>
                <ActivityIndicator size="small" color={MAIZE} />
                <Text style={styles.bdLoadingText}>Thinking…</Text>
              </View>
            )}

            {bdError && (
              <Text style={styles.bdErrorText}>{bdError}</Text>
            )}

            {subTasks && subTasks.length > 0 && (
              <View style={styles.subTaskList}>
                {subTasks.map((st, idx) => (
                  <View key={idx} style={styles.subTaskRow}>
                    <Text style={styles.subTaskBullet}>·</Text>
                    <Text style={styles.subTaskTitle} numberOfLines={2}>{st.title}</Text>
                    {st.dueDate && (
                      <Text style={styles.subTaskDue}>{formatDue(st.dueDate)}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDue(dueDate: string): string {
  const due = new Date(dueDate + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return due.toLocaleDateString(undefined, { weekday: 'long' });
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },

  cardDone: {
    backgroundColor: 'rgba(200, 164, 21, 0.07)',
    borderColor: 'rgba(200, 164, 21, 0.30)',
  },

  circleWrap: {
    marginRight: 12,
    paddingTop: 1,
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },

  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: MAIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  circleDone: {
    backgroundColor: GOLD_WARM,
    borderColor: GOLD_WARM,
  },

  check: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 14,
  },

  pin: {
    color: MAIZE,
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },

  body: {
    flex: 1,
  },

  title: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  titleDone: {
    color: SOFT,
    textDecorationLine: 'line-through',
    textDecorationColor: MUTED,
    fontWeight: '500',
    marginBottom: 0,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaImportance: {
    color: SOFT,
    fontSize: 12,
    letterSpacing: 0.3,
  },

  metaDue: {
    color: MUTED,
    fontSize: 12,
    marginLeft: 6,
  },

  bdArea: {
    marginTop: 10,
  },

  bdButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },

  bdButtonText: {
    color: SOFT,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  bdLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  bdLoadingText: {
    color: SOFT,
    fontSize: 12,
    marginLeft: 8,
  },

  bdErrorText: {
    color: SOFT,
    fontSize: 12,
    fontStyle: 'italic',
  },

  subTaskList: {
    marginTop: 4,
    paddingLeft: 2,
  },

  subTaskRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },

  subTaskBullet: {
    color: MAIZE,
    fontSize: 14,
    marginRight: 8,
    lineHeight: 18,
  },

  subTaskTitle: {
    color: SOFT,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  subTaskDue: {
    color: MUTED,
    fontSize: 11,
    marginLeft: 8,
  },
});
