import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './services/supabaseClient';
import AuthScreen from './screens/AuthScreen';
import TodayScreen from './screens/TodayScreen';

// Route names and their params — exported so screens can import this type
export type RootStackParamList = {
  Auth: undefined;
  Today: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // null = loading, false = not signed in, true = signed in
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for an existing session on launch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session);
    });

    // Listen for sign in / sign out events and update routing accordingly
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionReady(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show nothing while we confirm whether a session exists
  if (sessionReady === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {sessionReady ? (
          <Stack.Screen name="Today" component={TodayScreen} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
