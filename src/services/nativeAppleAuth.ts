import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../lib/supabase';
import { logSecurityEvent } from './securityService';
import type { AuthResponse } from './authService';

export interface AppleSignInResult {
  user: {
    email: string | null;
    fullName: {
      familyName: string | null;
      givenName: string | null;
    } | null;
    identityToken: string | null;
  } | null;
  error: string | null;
}

class NativeAppleAuthService {
  private isInitialized = false;
  private initializationError: Error | null = null;

  public async checkInitialization(): Promise<{ isInitialized: boolean; error: string | null }> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      return { isInitialized: this.isInitialized, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during initialization';
      return { isInitialized: false, error: errorMessage };
    }
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[APPLE_AUTH] Starting native Apple Sign-In initialization...');
    
    try {
      // Check if Apple Sign-In is available on this device
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only available on iOS devices');
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      this.isInitialized = true;
      console.log('[APPLE_AUTH] ✅ Successfully initialized native Apple Sign-In');
    } catch (error) {
      this.initializationError = error instanceof Error ? error : new Error('Failed to initialize Apple Sign-In');
      console.error('[APPLE_AUTH] ❌ Initialization failed:', {
        error: this.initializationError.message,
        platform: Platform.OS
      });
      throw this.initializationError;
    }
  }

  public async signIn(): Promise<AppleSignInResult> {
    console.log('[APPLE_AUTH] 🚀 Starting native Apple Sign-In flow...');
    
    try {
      // Ensure initialization is complete
      await this.ensureInitialized();
      console.log('[APPLE_AUTH] ✅ Native module initialized, proceeding with sign-in...');

      // Start the actual sign-in flow with a timeout to prevent hanging
      console.log('[APPLE_AUTH] 🎯 Launching native sign-in UI...');
      
      // Add a timeout to prevent hanging
      const signInPromise = AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // Add a 60-second timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Apple Sign-In timed out')), 60000)
      );
      
      // Race between the sign-in and the timeout
      const credential = await Promise.race([signInPromise, timeoutPromise]) as AppleAuthentication.AppleAuthenticationCredential;

      console.log('[APPLE_AUTH] ✅ Sign-in successful');

      // Ensure we have the required identity token
      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Log successful sign-in attempt
      logSecurityEvent('APPLE_SIGNIN_SUCCESS', {
        email: credential.email || 'no-email',
        userIdentifier: credential.user,
      });

      return {
        user: {
          email: credential.email || null,
          fullName: credential.fullName || null,
          identityToken: credential.identityToken,
        },
        error: null,
      };
    } catch (error) {
      console.error('[APPLE_AUTH] ❌ Sign-in error occurred:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const appleError = error as { code: number; message?: string };
        
        switch (appleError.code) {
          case 1000: // CANCELED
            console.log('[APPLE_AUTH] User cancelled sign-in');
            return { user: null, error: 'cancelled' };
          case 1001: // FAILED
            console.log('[APPLE_AUTH] Sign-in failed');
            return { user: null, error: 'Sign-in failed' };
          case 1002: // INVALID_RESPONSE
            console.log('[APPLE_AUTH] Invalid response received');
            return { user: null, error: 'Invalid response from Apple' };
          default:
            // Log failed sign-in attempt
            logSecurityEvent('APPLE_SIGNIN_ERROR', {
              error: appleError.message || 'Unknown error',
              code: appleError.code,
            });
            return { user: null, error: appleError.message || 'Unknown error' };
        }
      }
      
      console.error('[APPLE_AUTH] Unknown error type:', error);
      return { user: null, error: 'An unknown error occurred during Apple Sign-In' };
    }
  }

  public async signInToSupabase(identityToken: string): Promise<AuthResponse> {
    // Signing in to Supabase with Apple ID token
    
    try {
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (supabaseError) {
        console.error('[APPLE_AUTH] ❌ Supabase sign-in failed:', supabaseError.message);
        logSecurityEvent('SUPABASE_APPLE_SIGNIN_ERROR', {
          error: supabaseError.message,
        });
        return { user: null, error: supabaseError.message };
      }

      if (!supabaseData.user) {
        console.error('[APPLE_AUTH] ❌ No user data received from Supabase');
        return { user: null, error: 'No user data received from Supabase' };
      }

      // Successfully signed in to Supabase with Apple
      
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
      console.error('[APPLE_AUTH] ❌ Supabase sign-in exception:', errorMessage);
      
      logSecurityEvent('SUPABASE_APPLE_SIGNIN_ERROR', {
        error: errorMessage,
      });
      return {
        user: null,
        error: `Failed to sign in with Supabase: ${errorMessage}`,
      };
    }
  }

  public async signOut(): Promise<void> {
    // Apple Sign-In doesn't require explicit sign-out
    // Just clear any stored credentials if needed
    console.log('[APPLE_AUTH] Signing out...');
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

export const nativeAppleAuth = new NativeAppleAuthService(); 