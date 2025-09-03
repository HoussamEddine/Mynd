import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  type NativeModuleError,
  type User as GoogleUser,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../lib/supabase';
import { logSecurityEvent } from './securityService';
import Constants from 'expo-constants';
import type { AuthUser, AuthResponse } from '../types/auth';

// Extended AuthUser type for Google authentication
interface GoogleAuthUser extends AuthUser {
  name?: string | null;
  photo?: string | null;
  idToken?: string;
}

// Extended AuthResponse type for Google authentication
interface GoogleAuthResponse {
  user: GoogleAuthUser | null;
  error: string | null;
}

class NativeGoogleAuthService {
  private static instance: NativeGoogleAuthService;
  private isInitialized = false;

  private constructor() {
    this.initialize().catch(console.error);
  }

  public static getInstance(): NativeGoogleAuthService {
    if (!NativeGoogleAuthService.instance) {
      NativeGoogleAuthService.instance = new NativeGoogleAuthService();
    }
    return NativeGoogleAuthService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const webClientId = Constants.expoConfig?.extra?.WEB_CLIENT_ID;
      const iosClientId = Constants.expoConfig?.extra?.IOS_GOOGLE_CLIENT_ID;
      
      // Google Auth configuration logs removed
      
      const config = {
        webClientId: webClientId,
        ...(Platform.OS === 'ios' ? { iosClientId: iosClientId } : {}),
        offlineAccess: false,
      };

      await GoogleSignin.configure(config);
      this.isInitialized = true;
      // Google Auth configured successfully
    } catch (error) {
      console.error('[GOOGLE_AUTH] ❌ Failed to configure Google Sign-In:', error);
      throw error;
    }
  }

  public async signIn(): Promise<GoogleAuthResponse> {
    try {
      // Ensure we're initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Sign out any existing Google Sign-In session
      await GoogleSignin.signOut();

      // Check if Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Start native sign-in flow
      const signInResult = await GoogleSignin.signIn();

      if (!signInResult) {
        throw new Error('Failed to get user info from Google Sign-In');
      }

      const tokens = await GoogleSignin.getTokens();
      if (!tokens.idToken) {
        throw new Error('Failed to get ID token from Google Sign-In');
      }

      const user = signInResult.user;

      // Log successful sign-in attempt
      logSecurityEvent('GOOGLE_SIGNIN_SUCCESS', {
        email: user.email,
        userId: user.id,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          photo: user.photo,
          idToken: tokens.idToken,
        },
        error: null
      };

    } catch (error) {
      // Handle specific error cases
      if ((error as NativeModuleError).code === statusCodes.SIGN_IN_CANCELLED) {
        return { user: null, error: 'cancelled' };
      }

      if ((error as NativeModuleError).code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { user: null, error: 'Google Play Services not available' };
      }

      // Log other errors
      logSecurityEvent('GOOGLE_SIGNIN_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code: (error as NativeModuleError).code
      });

      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to sign in with Google'
      };
    }
  }

  public async signInToSupabase(idToken: string): Promise<AuthResponse> {
    // Signing in to Supabase with Google ID token
    
    try {
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (supabaseError) {
        console.error('[GOOGLE_AUTH] ❌ Supabase sign-in failed:', supabaseError.message);
        logSecurityEvent('SUPABASE_GOOGLE_SIGNIN_ERROR', {
          error: supabaseError.message,
        });
        return { user: null, error: supabaseError.message };
      }

      if (!supabaseData.user) {
        console.error('[GOOGLE_AUTH] ❌ No user data received from Supabase');
        return { user: null, error: 'No user data received from Supabase' };
      }

      // Successfully signed in to Supabase
      
      return {
        user: {
          id: supabaseData.user.id,
          email: supabaseData.user.email!,
          user_metadata: supabaseData.user.user_metadata,
        },
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[GOOGLE_AUTH] ❌ Supabase sign-in exception:', errorMessage);
      
      logSecurityEvent('SUPABASE_GOOGLE_SIGNIN_ERROR', {
        error: errorMessage,
      });
      return {
        user: null,
        error: `Failed to sign in with Supabase: ${errorMessage}`,
      };
    }
  }

  public async signOut(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      await GoogleSignin.signOut();
    } catch (error) {
      throw error;
    }
  }

  public async getCurrentUser(): Promise<{
    id: string;
    email: string;
    name: string | null;
    photo: string | null;
  } | null> {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (!currentUser) return null;
      
      return {
        id: currentUser.user.id,
        email: currentUser.user.email,
        name: currentUser.user.name,
        photo: currentUser.user.photo,
      };
    } catch (error) {
      return null;
    }
  }
}

export const nativeGoogleAuth = NativeGoogleAuthService.getInstance(); 