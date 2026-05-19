import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../services/supabaseClient';
import { RootStackParamList } from '../App';

// ── University of Michigan palette ────────────────────────────────────────────
const NAVY      = '#00274C';
const NAVY_DEEP = '#001529';
const MAIZE     = '#FFCB05';
const WHITE     = '#FFFFFF';
const MUTED     = 'rgba(255,255,255,0.50)';
const SURFACE   = 'rgba(255,255,255,0.07)';
const BORDER    = 'rgba(255,255,255,0.13)';
const BORDER_FOC = '#FFCB05';

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

interface Props {
  navigation: AuthScreenNavigationProp;
}

export default function AuthScreen({ navigation }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);

  const isWeb = Platform.OS === 'web';

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
    // Navigation to Today is handled by the session listener in App.tsx
    // We just confirm the sign-in succeeded here
    void data;
  }

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
});
