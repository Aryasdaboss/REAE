import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './services/supabaseClient';

// ── University of Michigan palette ────────────────────────────────────────────
const NAVY       = '#00274C';
const NAVY_DEEP  = '#001529';
const MAIZE      = '#FFCB05';
const WHITE      = '#FFFFFF';
const MUTED      = 'rgba(255,255,255,0.50)';
const SURFACE    = 'rgba(255,255,255,0.07)';
const BORDER     = 'rgba(255,255,255,0.13)';
const BORDER_FOC = '#FFCB05';

export default function App() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [user, setUser]             = useState<{ email: string } | null>(null);
  const [tasks, setTasks]           = useState<{ id: string; title: string }[]>([]);
  const [newTask, setNewTask]       = useState('');
  const [focused, setFocused]       = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ email: session.user.email! });
        loadTasks();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email! });
        loadTasks();
      } else {
        setUser(null);
        setTasks([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) Alert.alert('Google sign in failed', error.message);
  }

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      Alert.alert('Account created', 'You can now sign in.');
    }
  }

  async function handleSignIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    setUser({ email: data.user.email! });
    loadTasks();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setTasks([]);
  }

  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title')
      .order('createdAt', { ascending: false });
    if (!error && data) setTasks(data);
  }

  async function addTask() {
    if (!newTask.trim()) return;
    const { error } = await supabase
      .from('tasks')
      .insert({ title: newTask.trim(), importance: 'Medium' });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewTask('');
      loadTasks();
    }
  }

  const isWeb = Platform.OS === 'web';

  // ── Task screen ──────────────────────────────────────────────────────────
  if (user) {
    return (
      <View style={isWeb ? styles.webOuter : null}>
        <View style={[styles.container, isWeb && styles.phone]}>
          <StatusBar style="light" />

          {/* Top bar */}
          <View style={styles.topBar}>
            <Text style={styles.logoSmall}>REAE</Text>
            <TouchableOpacity onPress={handleSignOut} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingEyebrow}>WELCOME BACK</Text>
            <Text style={styles.greetingEmail} numberOfLines={1}>{user.email}</Text>
          </View>

          {/* Add task row */}
          <View style={styles.addRow}>
            <TextInput
              style={[styles.taskInput, focused === 'newtask' && styles.inputFocused]}
              placeholder="What needs doing?"
              placeholderTextColor={MUTED}
              value={newTask}
              onChangeText={setNewTask}
              onFocus={() => setFocused('newtask')}
              onBlur={() => setFocused(null)}
              onSubmitEditing={addTask}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addBtn, !newTask.trim() && styles.addBtnDim]}
              onPress={addTask}
              disabled={!newTask.trim()}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Task list */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {tasks.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyMark}>✦</Text>
                <Text style={styles.emptyHeading}>All clear.</Text>
                <Text style={styles.emptyBody}>Add something above whenever you're ready.</Text>
              </View>
            ) : (
              tasks.map(t => (
                <View key={t.id} style={styles.taskCard}>
                  <View style={styles.taskDot} />
                  <Text style={styles.taskTitle}>{t.title}</Text>
                </View>
              ))
            )}
            {/* bottom padding inside scroll */}
            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Login screen ─────────────────────────────────────────────────────────
  return (
    <View style={isWeb ? styles.webOuter : null}>
      <View style={[styles.container, isWeb && styles.phone]}>
        <StatusBar style="light" />

        {/* Logo lockup */}
        <View style={styles.logoBlock}>
          <Text style={styles.logo}>REAE</Text>
          <Text style={styles.logoSub}>REMIND EVERYONE ABOUT EVERYTHING</Text>
          <View style={styles.logoRule} />
        </View>

        {/* Auth form */}
        <View style={styles.form}>
          <TextInput
            style={[styles.input, focused === 'email' && styles.inputFocused]}
            placeholder="Email address"
            placeholderTextColor={MUTED}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />
          <TextInput
            style={[styles.input, focused === 'pw' && styles.inputFocused]}
            placeholder="Password"
            placeholderTextColor={MUTED}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocused('pw')}
            onBlur={() => setFocused(null)}
          />

          {loading ? (
            <ActivityIndicator size="large" color={MAIZE} style={{ marginVertical: 16 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSignIn}>
                <Text style={styles.btnPrimaryText}>Sign in</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnOutline} onPress={handleSignUp}>
                <Text style={styles.btnOutlineText}>Create account</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.btnGoogle} onPress={handleGoogleSignIn}>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.btnGoogleText}>Continue with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footerNote}>Your tasks, your pace.</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Web shell
  webOuter: {
    flex: 1,
    backgroundColor: NAVY_DEEP,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh' as any,
  },

  // Phone frame
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

  // Shared container
  container: {
    flex: 1,
    backgroundColor: NAVY,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 28,
  },

  // ── Login ──────────────────────────────────────────
  logoBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    fontSize: 72,
    fontWeight: '800',
    color: MAIZE,
    letterSpacing: 10,
    ...Platform.select({ web: { fontFamily: "'Georgia', 'Times New Roman', serif" } }),
  },

  logoSub: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 2.5,
    marginTop: 6,
    textAlign: 'center',
  },

  logoRule: {
    width: 48,
    height: 2,
    backgroundColor: MAIZE,
    borderRadius: 1,
    marginTop: 20,
    opacity: 0.6,
  },

  form: {
    width: '100%',
  },

  input: {
    width: '100%',
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    fontSize: 15,
    color: WHITE,
  },

  inputFocused: {
    borderColor: BORDER_FOC,
  },

  btnPrimary: {
    width: '100%',
    backgroundColor: MAIZE,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 10,
  },

  btnPrimaryText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  btnOutline: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: MAIZE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },

  btnOutlineText: {
    color: MAIZE,
    fontWeight: '600',
    fontSize: 16,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },

  dividerLabel: {
    color: MUTED,
    fontSize: 12,
    marginHorizontal: 14,
    letterSpacing: 1,
  },

  btnGoogle: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  googleG: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 10,
  },

  btnGoogleText: {
    color: NAVY,
    fontWeight: '600',
    fontSize: 16,
  },

  footerNote: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 20,
  },

  // ── Task screen ────────────────────────────────────
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

  greetingBlock: {
    marginBottom: 28,
  },

  greetingEyebrow: {
    fontSize: 9,
    color: MAIZE,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 6,
    opacity: 0.8,
  },

  greetingEmail: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.2,
  },

  addRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },

  taskInput: {
    flex: 1,
    backgroundColor: SURFACE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: WHITE,
    marginRight: 10,
  },

  addBtn: {
    backgroundColor: MAIZE,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addBtnDim: {
    opacity: 0.35,
  },

  addBtnText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 15,
  },

  list: {
    flex: 1,
  },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },

  taskDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: MAIZE,
    marginTop: 7,
    marginRight: 12,
    flexShrink: 0,
  },

  taskTitle: {
    flex: 1,
    fontSize: 15,
    color: WHITE,
    lineHeight: 22,
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
});
