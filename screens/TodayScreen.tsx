import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../services/supabaseClient';
import { prepareTodayTasks, TaskRow } from '../services/todayPresenter';
import CreateTaskSheet from '../components/CreateTaskSheet';
import TaskCard from '../components/TaskCard';
import DoneSection from '../components/DoneSection';

// ── University of Michigan palette ────────────────────────────────────────────
const NAVY      = '#00274C';
const NAVY_DEEP = '#001529';
const MAIZE     = '#FFCB05';
const WHITE     = '#FFFFFF';
const MUTED     = 'rgba(255,255,255,0.50)';
const SOFT      = 'rgba(255,255,255,0.72)';

type TodayScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Today'>;

interface Props {
  navigation: TodayScreenNavigationProp;
}

const COLUMNS = 'id, title, importance, ispinned, iscompleted, issnoozed, duedate, createdat, completedat';

export default function TodayScreen({ navigation }: Props) {
  const isWeb = Platform.OS === 'web';

  // We keep raw rows in state so the completion handler can do optimistic
  // updates without re-fetching. The three buckets are derived via useMemo.
  const [rows, setRows]           = useState<TaskRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sections = useMemo(() => prepareTodayTasks(rows), [rows]);

  const loadTasks = useCallback(async () => {
    setError(null);
    const { data, error: queryError } = await supabase
      .from('tasks')
      .select(COLUMNS);

    if (queryError) {
      setError("We couldn't load your tasks. Pull to retry.");
      setLoading(false);
      return;
    }

    setRows((data ?? []) as TaskRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    // Session listener in App.tsx will navigate back to Auth automatically
  }

  async function handleComplete(taskId: string) {
    const completedAt = new Date().toISOString();

    // Optimistic update — flip the task to completed in local state immediately.
    // prepareTodayTasks re-buckets it into `done` on next render.
    const prevRows = rows;
    setRows(prev => prev.map(r =>
      r.id === taskId
        ? { ...r, iscompleted: true, completedat: completedAt }
        : r
    ));

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ iscompleted: true, completedat: completedAt })
      .eq('id', taskId);

    if (updateError) {
      // Roll back if the write failed
      setRows(prevRows);
      setError("Couldn't save that. Try again?");
    }
  }

  const hasActive = sections.today.length > 0 || sections.overdue.length > 0;
  const hasAnything = hasActive || sections.done.length > 0;

  return (
    <View style={isWeb ? styles.webOuter : null}>
      <View style={[styles.container, isWeb && styles.phone]}>
        <StatusBar style="light" />

        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.logoSmall}>REAE</Text>
          <TouchableOpacity
            onPress={handleSignOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={MAIZE} />
          </View>
        ) : (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {error && <Text style={styles.errorText}>{error}</Text>}

            {!hasAnything && !error && <EmptyState />}

            {sections.today.length > 0 && (
              <Section title="Today">
                {sections.today.map(task => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} />
                ))}
              </Section>
            )}

            {sections.overdue.length > 0 && (
              <Section title="Needs rescheduling" subtle>
                {sections.overdue.map(task => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} />
                ))}
              </Section>
            )}

            <DoneSection tasks={sections.done} />
          </ScrollView>
        )}

        {/* Floating add button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setSheetOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabPlus}>+</Text>
        </TouchableOpacity>

        <CreateTaskSheet
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onCreated={() => void loadTasks()}
        />
      </View>
    </View>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Section({ title, subtle, children }: { title: string; subtle?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, subtle && styles.sectionTitleSubtle]}>{title}</Text>
      {children}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyMark}>✦</Text>
      <Text style={styles.emptyHeading}>All clear.</Text>
      <Text style={styles.emptyBody}>Add something whenever you're ready.</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: NAVY_DEEP,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh' as any,
  },

  phone: {
    width: 390,
    height: 844,
    borderRadius: 44,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.7,
    shadowRadius: 56,
    elevation: 24,
  },

  container: {
    flex: 1,
    backgroundColor: NAVY,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 28,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },

  logoSmall: {
    fontSize: 24,
    fontWeight: '800',
    color: MAIZE,
    letterSpacing: 5,
    ...Platform.select({ web: { fontFamily: "'Georgia', 'Times New Roman', serif" } }),
  },

  signOutText: {
    color: MUTED,
    fontSize: 13,
    letterSpacing: 0.3,
  },

  list: {
    flex: 1,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorText: {
    color: SOFT,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: MAIZE,
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  sectionTitleSubtle: {
    color: SOFT,
    opacity: 0.65,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: 52,
  },

  emptyMark: {
    fontSize: 26,
    color: MAIZE,
    marginBottom: 14,
    opacity: 0.7,
  },

  emptyHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
    marginBottom: 8,
  },

  emptyBody: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },

  fab: {
    position: 'absolute',
    right: 22,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MAIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  fabPlus: {
    fontSize: 30,
    fontWeight: '700',
    color: NAVY,
    marginTop: -2,
  },
});
