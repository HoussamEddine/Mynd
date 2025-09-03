import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables from Expo's extra config
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Validate environment variables
// Supabase configuration loaded

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl);
  console.error('Supabase Anon Key:', supabaseAnonKey?.substring(0, 5) + '...');
  throw new Error('Missing required Supabase environment variables (URL and ANON_KEY)');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: false // Suppress noisy GoTrueClient logs
  },
});

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
  const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('getCurrentUser error:', error);
      throw error;
    }
    console.log('getCurrentUser success:', user?.id);
  return user;
  } catch (error) {
    console.error('getCurrentUser caught error:', error);
    throw error;
  }
};

// Helper function to get current session
export const getCurrentSession = async () => {
  try {
  const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('getCurrentSession error:', error);
      throw error;
    }
    console.log('getCurrentSession success:', session?.user?.id);
  return session;
  } catch (error) {
    console.error('getCurrentSession caught error:', error);
    throw error;
  }
}; 