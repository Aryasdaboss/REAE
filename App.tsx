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

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [newTask, setNewTask] = useState('');

  // Detect session on load and after Google OAuth redirect
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

  if (user) {
    return (
      <View style={isWeb ? styles.webOuter : null}>
      <View style={[styles.container, isWeb && styles.phone]}>
        <StatusBar style="auto" />
        <Text style={styles.heading}>REAE</Text>
        <Text style={styles.sub}>Signed in as {user.email}</Text>

        <View style={styles.row}>
          <TextInput
            style={styles.taskInput}
            placeholder="Add a task..."
            value={newTask}
            onChangeText={setNewTask}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addTask}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <Text style={styles.empty}>No tasks yet. Add one above.</Text>
        ) : (
          tasks.map(t => (
            <Text key={t.id} style={styles.task}>• {t.title}</Text>
          ))
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
      </View>
    );
  }

  return (
    <View style={isWeb ? styles.webOuter : null}>
    <View style={[styles.container, isWeb && styles.phone]}>
      <StatusBar style="auto" />
      <Text style={styles.heading}>REAE</Text>
      <Text style={styles.sub}>Remind Everyone About Everything</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" />
      ) : (
        <>
          <TouchableOpacity style={styles.btn} onPress={handleSignIn}>
            <Text style={styles.btnText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleSignUp}>
            <Text style={[styles.btnText, styles.btnTextSecondary]}>Create account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnGoogle]} onPress={handleGoogleSignIn}>
            <Text style={styles.btnText}>Continue with Google</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  heading:          { fontSize: 36, fontWeight: '700', color: '#6C63FF', marginBottom: 4 },
  sub:              { fontSize: 14, color: '#888', marginBottom: 32 },
  input:            { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  btn:              { width: '100%', backgroundColor: '#6C63FF', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 10 },
  btnText:          { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnSecondary:     { backgroundColor: '#fff', borderWidth: 1, borderColor: '#6C63FF' },
  btnTextSecondary: { color: '#6C63FF' },
  row:              { flexDirection: 'row', width: '100%', marginBottom: 16 },
  taskInput:        { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, marginRight: 8 },
  addBtn:           { backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText:       { color: '#fff', fontWeight: '600' },
  task:             { fontSize: 16, color: '#333', alignSelf: 'flex-start', marginBottom: 8 },
  empty:            { color: '#aaa', marginTop: 16 },
  signOutBtn:       { marginTop: 32 },
  signOutText:      { color: '#aaa', fontSize: 14 },
  btnGoogle:        { backgroundColor: '#4285F4', marginTop: 4 },
  webOuter:         { flex: 1, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' as any },
  phone:            { width: 390, height: 844, borderRadius: 40, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 },
});
