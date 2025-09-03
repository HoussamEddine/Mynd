import { supabase } from '../lib/supabase';
import { databaseService } from './databaseService';
import type { User, UserInsert } from '../types/database';
import { 
  sanitizeInput, 
  validateEmail as securityValidateEmail,
  validatePasswordSimple as securityValidatePasswordSimple,
  validateInput,
  logSecurityEvent,
  getDeviceFingerprint,
  createRateLimiter,
  sessionManager
} from './securityService';
import securityService from './securityService';
import { nativeGoogleAuth } from './nativeGoogleAuth';
import { nativeAppleAuth, type AppleSignInResult } from './nativeAppleAuth';
import type { Database } from '../types/database';

// Define the user record type from your actual database schema
interface AuthUserRecord {
  id: string;
  email: string;
  auth_providers: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    [key: string]: any;
  };
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  private static instance: AuthService;
  private loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 attempts, 15 minutes

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Helper to check if a user exists and their auth method
  public async checkExistingUser(email: string): Promise<{
    exists: boolean;
    providers: string[];
    error?: string;
  }> {
    try {
      // Validate and sanitize email input
      const emailValidation = validateInput(email, 'email');
      if (!emailValidation.isValid) {
        logSecurityEvent('INVALID_EMAIL_INPUT', { email: email.substring(0, 10) + '***' });
        return { exists: false, providers: [], error: emailValidation.error };
      }

      if (emailValidation.securityRisk) {
        logSecurityEvent('SECURITY_RISK_EMAIL_INPUT', { 
          email: email.substring(0, 10) + '***',
          deviceFingerprint: await getDeviceFingerprint()
        });
        return { exists: false, providers: [], error: 'Invalid input detected' };
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, auth_providers')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return { exists: false, providers: [] };
        }
        throw error;
      }

      return {
        exists: true,
        providers: (data as AuthUserRecord)?.auth_providers || []
      };
    } catch (error) {
      console.error('[AUTH] Error checking existing user:', error);
      logSecurityEvent('USER_CHECK_ERROR', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        email: email.substring(0, 10) + '***'
      });
      return {
        exists: false,
        providers: [],
        error: error instanceof Error ? error.message : 'Failed to check user existence'
      };
    }
  }

  async signUp({ email, password, fullName }: SignUpData): Promise<AuthResponse> {
    console.log('[AUTH] Starting email signup flow for:', email);
    
    try {
      // Enhanced input validation
      const emailValidation = validateInput(email, 'email');
      const passwordValidation = securityValidatePasswordSimple(password);
      const nameValidation = fullName ? validateInput(fullName, 'name') : { isValid: true };

      if (!emailValidation.isValid) {
        logSecurityEvent('SIGNUP_INVALID_EMAIL', { email: email.substring(0, 10) + '***' });
        return { user: null, error: emailValidation.error ?? null };
      }

      if (!passwordValidation.isValid) {
        logSecurityEvent('SIGNUP_INVALID_PASSWORD', { email: email.substring(0, 10) + '***' });
        return { user: null, error: passwordValidation.error ?? null };
      }

      if (!nameValidation.isValid) {
        logSecurityEvent('SIGNUP_INVALID_NAME', { email: email.substring(0, 10) + '***' });
        return { user: null, error: nameValidation.error ?? null };
      }

      // Check for security risks (only email/name, not password)
      if (emailValidation.securityRisk || nameValidation.securityRisk) {
        logSecurityEvent('SIGNUP_SECURITY_RISK', { 
          email: email.substring(0, 10) + '***',
          deviceFingerprint: await getDeviceFingerprint()
        });
        return { user: null, error: 'Invalid input detected' };
      }

      // Check if user already exists and their auth methods
      const { exists, providers, error: checkError } = await this.checkExistingUser(email);
      
      if (checkError) {
        return { user: null, error: checkError };
      }

      if (exists) {
        // User exists - provide specific guidance based on their auth methods
        if (providers.includes('google')) {
          return {
            user: null,
            error: 'This email is already registered with Google Sign-In. Please sign in with Google instead.'
          };
        }
        if (providers.includes('apple')) {
          return {
            user: null,
            error: 'This email is already registered with Apple Sign-In. Please sign in with Apple instead.'
          };
        }
        return {
          user: null,
          error: 'This email is already registered. Please sign in instead.'
        };
      }

      // Proceed with signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            signup_method: 'email'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error('No user data received after signup');
      }

      // Create user record in database
      try {
        await databaseService.createUser({
          id: signUpData.user.id,
          email: signUpData.user.email!,
          full_name: fullName || null,
          auth_providers: ['email'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          notification_settings: {
            daily_reminders: true,
            progress_updates: true,
            motivational_quotes: true,
          },
          onboarding_completed: false,
          subscription_tier: 'free',
        });
      } catch (dbError) {
        console.error('[AUTH] Failed to create user record in database:', dbError);
        logSecurityEvent('USER_DB_CREATION_ERROR', { 
          userId: signUpData.user.id,
          error: dbError instanceof Error ? dbError.message : 'Unknown error'
        });
        // Don't fail the signup if database creation fails, but log it
      }

      // Create secure session
      try {
        await sessionManager.createSecureSession(signUpData.user.id);
      } catch (sessionError) {
        console.error('[AUTH] Failed to create secure session:', sessionError);
        logSecurityEvent('SESSION_CREATION_ERROR', { 
          userId: signUpData.user.id,
          error: sessionError instanceof Error ? sessionError.message : 'Unknown error'
        });
      }

      // Log successful signup
      logSecurityEvent('EMAIL_SIGNUP_SUCCESS', {
        email: email.toLowerCase(),
        userId: signUpData.user.id
      });

        return {
          user: {
          id: signUpData.user.id,
          email: signUpData.user.email!,
          user_metadata: signUpData.user.user_metadata
          },
        error: null
        };

    } catch (error) {
      console.error('[AUTH] Signup error:', error);
      
      logSecurityEvent('EMAIL_SIGNUP_ERROR', {
        email: email.toLowerCase(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to sign up'
      };
    }
  }

  async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    console.log('[AUTH] Starting email signin flow for:', email);
    
    try {
      // Enhanced input validation
      const emailValidation = validateInput(email, 'email');
      const passwordValidation = securityValidatePasswordSimple(password);

      if (!emailValidation.isValid) {
        logSecurityEvent('SIGNIN_INVALID_EMAIL', { email: email.substring(0, 10) + '***' });
        return { user: null, error: emailValidation.error ?? null };
      }

      if (!passwordValidation.isValid) {
        logSecurityEvent('SIGNIN_INVALID_PASSWORD', { email: email.substring(0, 10) + '***' });
        return { user: null, error: passwordValidation.error ?? null };
      }

      // Check for security risks (only email)
      if (emailValidation.securityRisk) {
        logSecurityEvent('SIGNIN_SECURITY_RISK', { 
          email: email.substring(0, 10) + '***',
          deviceFingerprint: await getDeviceFingerprint()
        });
        return { user: null, error: 'Invalid input detected' };
      }

      // Rate limiting check
      const deviceFingerprint = await getDeviceFingerprint();
      if (!this.loginRateLimiter.checkLimit(deviceFingerprint)) {
        const remainingTime = this.loginRateLimiter.getRemainingTime(deviceFingerprint);
        logSecurityEvent('LOGIN_RATE_LIMIT_EXCEEDED', { 
          email: email.substring(0, 10) + '***',
          deviceFingerprint,
          remainingTime
        });
        return { 
          user: null, 
          error: `Too many login attempts. Please try again in ${Math.ceil(remainingTime / 1000 / 60)} minutes.` 
        };
      }

      // Check if user exists and their auth methods
      const { exists, providers, error: checkError } = await this.checkExistingUser(email);
      
      if (checkError) {
        return { user: null, error: checkError };
      }

      if (!exists) {
        logSecurityEvent('LOGIN_ATTEMPT_UNKNOWN_USER', { 
          email: email.substring(0, 10) + '***',
          deviceFingerprint
        });
        return {
          user: null,
          error: 'No account found with this email. Please sign up first.'
        };
      }
      
      // If user exists but used different auth methods, guide them
      if (!providers.includes('email') && providers.length > 0) {
        const authMethods = providers.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' or ');
        logSecurityEvent('LOGIN_WRONG_AUTH_METHOD', { 
          email: email.substring(0, 10) + '***',
          attemptedMethod: 'email',
          availableMethods: providers
        });
        return {
          user: null,
          error: `This email is registered with ${authMethods}. Please sign in with ${authMethods} instead.`
        };
      }

      // Proceed with signin
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (signInError) {
        logSecurityEvent('LOGIN_FAILURE', { 
          email: email.substring(0, 10) + '***',
          error: signInError.message,
          deviceFingerprint
        });
        throw signInError;
      }

      if (!signInData.user) {
        throw new Error('No user data received after signin');
      }

      // Create secure session
      try {
        await sessionManager.createSecureSession(signInData.user.id);
      } catch (sessionError) {
        console.error('[AUTH] Failed to create secure session:', sessionError);
        logSecurityEvent('SESSION_CREATION_ERROR', { 
          userId: signInData.user.id,
          error: sessionError instanceof Error ? sessionError.message : 'Unknown error'
        });
      }

      // Log successful signin
      logSecurityEvent('EMAIL_SIGNIN_SUCCESS', {
        email: email.toLowerCase(),
        userId: signInData.user.id
      });

        return {
          user: {
          id: signInData.user.id,
          email: signInData.user.email!,
          user_metadata: signInData.user.user_metadata
          },
        error: null
        };

    } catch (error) {
      console.error('[AUTH] Signin error:', error);
      
      logSecurityEvent('EMAIL_SIGNIN_ERROR', {
        email: email.toLowerCase(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          return {
            user: null,
            error: 'Incorrect email or password. Please try again.'
          };
        }
        if (error.message.includes('Email not confirmed')) {
          return {
            user: null,
            error: 'Please verify your email address before signing in.'
          };
        }
      }

      return {
        user: null,
        error: 'Failed to sign in. Please try again.'
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Also sign out from native providers
      await Promise.all([
        nativeGoogleAuth.signOut().catch(console.error),
        // Only attempt Apple sign out if the user was signed in with Apple
        supabase.auth.getUser().then(({ data }) => {
          const provider = data.user?.app_metadata?.provider;
          if (provider === 'apple') {
            nativeAppleAuth.signOut?.().catch(console.error);
      }
        }).catch(console.error)
      ]);
      
    } catch (error) {
      console.error('[AUTH] Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email!,
        user_metadata: user.user_metadata,
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      return session;
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  // ============= PASSWORD MANAGEMENT =============

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      // Sanitize and validate email
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      
      const emailValidation = securityValidateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        logSecurityEvent('PASSWORD_RESET_VALIDATION_ERROR', { error: emailValidation.error, email: sanitizedEmail });
        return { error: emailValidation.error! };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: 'mynd://reset-password',
      });
      
      // Log password reset attempt (don't include email in logs for privacy)
      logSecurityEvent('PASSWORD_RESET_REQUESTED', { timestamp: new Date().toISOString() });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      // Validate new password
      const passwordValidation = securityValidatePasswordSimple(newPassword);
      if (!passwordValidation.isValid) {
        logSecurityEvent('PASSWORD_UPDATE_VALIDATION_ERROR', { error: passwordValidation.error });
        return { error: passwordValidation.error ?? null };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (!error) {
        logSecurityEvent('PASSWORD_UPDATED', { timestamp: new Date().toISOString() });
      }

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ============= PROFILE MANAGEMENT =============

  async updateProfile(updates: {
    fullName?: string;
    avatarUrl?: string;
  }): Promise<{ error: string | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: 'No authenticated user' };
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
        },
      });

      if (authError) {
        return { error: authError.message };
      }

      // Update database profile
      await databaseService.updateUser(user.id, {
        full_name: updates.fullName || null,
        avatar_url: updates.avatarUrl || null,
      });

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getUserProfile(userId?: string): Promise<User | null> {
    try {
      const targetUserId = userId || (await this.getCurrentUser())?.id;
      
      if (!targetUserId) {
        return null;
      }

      return await databaseService.getUser(targetUserId);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  async completeOnboarding(): Promise<{ error: string | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: 'No authenticated user' };
      }

      await databaseService.updateUser(user.id, {
        onboarding_completed: true,
      });

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ============= AUTH STATE LISTENERS =============

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata,
        });
      } else {
        callback(null);
      }
    });
  }

  // ============= UTILITIES =============

  async refreshSession(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deleteAccount(): Promise<{ error: string | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { error: 'No authenticated user' };
      }

      // Note: Supabase doesn't have a direct user deletion method
      // You'll need to implement this through your backend or admin API
      // For now, we'll just sign out
      await this.signOut();
      
      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // ============= VALIDATION HELPERS =============

  validateEmail(email: string): boolean {
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const validation = securityValidateEmail(sanitizedEmail);
    return validation.isValid;
  }

  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const validation = securityValidatePasswordSimple(password);
    return {
      isValid: validation.isValid,
      errors: validation.isValid ? [] : [validation.error ?? 'Invalid password'],
    };
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    console.log('[AUTH] Starting Google signin flow');
    
    try {
      // Get Google user credentials
      const { user: googleUser, error: googleError } = await nativeGoogleAuth.signIn();
      
      if (googleError) {
        if (googleError === 'cancelled') {
          return { user: null, error: 'cancelled' };
        }
        throw new Error(googleError);
      }
      
      if (!googleUser?.email) throw new Error('No email received from Google');

      // Check if user exists and their auth methods
      const { exists, providers, error: checkError } = await this.checkExistingUser(googleUser.email);
      
      if (checkError) {
        return { user: null, error: checkError };
      }

      // If user exists but never used Google, add it as an auth method
      if (exists && !providers.includes('google')) {
        await databaseService.updateUserAuthProviders(googleUser.id, 'google');
      }

      // Sign in with Supabase using the Google ID token
      if (!googleUser.idToken) {
        throw new Error('No ID token received from Google');
      }

      const supabaseResult = await nativeGoogleAuth.signInToSupabase(googleUser.idToken);
      
      // If there's a setup issue, provide helpful guidance
      if (supabaseResult.error && supabaseResult.error.includes('authentication setup issue')) {
        return {
          user: null,
          error: 'Google Sign-In is temporarily unavailable. Please use email sign-in or try again later.'
        };
      }

      // If sign-in was successful and user doesn't exist in database, create user record
      if (supabaseResult.user && !exists) {
        try {
          await databaseService.createUser({
            id: supabaseResult.user.id,
            email: supabaseResult.user.email!,
            full_name: googleUser.name || null,
            auth_providers: ['google'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notification_settings: {
              daily_reminders: true,
              progress_updates: true,
              motivational_quotes: true,
            },
            onboarding_completed: false,
            subscription_tier: 'free',
          });
        } catch (dbError) {
          console.error('[AUTH] Failed to create user record in database for Google sign-in:', dbError);
          // Don't fail the sign-in if database creation fails, but log it
        }
      }

      return supabaseResult;

    } catch (error) {
      console.error('[AUTH] Google signin error:', error);
      
      logSecurityEvent('GOOGLE_SIGNIN_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to sign in with Google'
      };
    }
  }

  async signInWithApple(): Promise<AuthResponse> {
    console.log('[AUTH] Starting Apple signin flow');
    
    try {
      // Add a timeout to prevent hanging
      const appleSignInPromise = nativeAppleAuth.signIn();
      
      // Add a 2-minute timeout for the entire Apple Sign-In process
      const timeoutPromise = new Promise<AuthResponse>((_, reject) => 
        setTimeout(() => reject(new Error('Apple Sign-In timed out')), 120000)
      );
      
      // Race between the sign-in and the timeout
      const appleResult = await Promise.race([
        appleSignInPromise,
        timeoutPromise.then(() => { throw new Error('Apple Sign-In timed out'); })
      ]) as AppleSignInResult;
      
      if (appleResult.error) {
        console.log('[AUTH] Apple sign-in returned with error:', appleResult.error);
        
        if (appleResult.error === 'cancelled') {
          return { user: null, error: 'cancelled' };
        }
        
        // Return a more user-friendly error message
        const errorMessage = appleResult.error.includes('timed out') 
          ? 'The sign-in process took too long. Please try again.'
          : appleResult.error;
          
        return { user: null, error: errorMessage };
      }

      if (!appleResult.user?.identityToken) {
        console.error('[AUTH] No identity token received from Apple');
        return { 
          user: null, 
          error: 'Failed to authenticate with Apple. Please try again.' 
        };
      }

      // Check if user exists with different auth method
      if (appleResult.user.email) {
        const { exists, providers } = await this.checkExistingUser(appleResult.user.email);
        
        if (exists && !providers.includes('apple')) {
          const authMethods = providers.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' or ');
          return {
            user: null,
            error: `This email is already registered with ${authMethods}. Please sign in with ${authMethods} instead.`
          };
        }
      }

      // Sign in to Supabase with Apple token
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: appleResult.user.identityToken,
      });

      if (supabaseError) {
        console.error('[AUTH] Supabase Apple sign-in failed:', supabaseError.message);
        logSecurityEvent('SUPABASE_APPLE_SIGNIN_ERROR', {
          error: supabaseError.message,
        });
        return { user: null, error: supabaseError.message };
      }

      if (!supabaseData.user) {
        console.error('[AUTH] No user data received from Supabase');
        return { user: null, error: 'No user data received from Supabase' };
      }

      // Update user metadata with Apple info if available
      if (appleResult.user.fullName || appleResult.user.email) {
        await supabase.auth.updateUser({
          data: {
            full_name: appleResult.user.fullName?.givenName && appleResult.user.fullName?.familyName
              ? `${appleResult.user.fullName.givenName} ${appleResult.user.fullName.familyName}`
              : undefined,
            signup_method: 'apple'
          }
        });
      }

      // If sign-in was successful and user doesn't exist in database, create user record
      if (supabaseData.user) {
        const { exists } = await this.checkExistingUser(supabaseData.user.email!);
        if (!exists) {
          try {
            const fullName = appleResult.user.fullName?.givenName && appleResult.user.fullName?.familyName
              ? `${appleResult.user.fullName.givenName} ${appleResult.user.fullName.familyName}`
              : null;

            await databaseService.createUser({
              id: supabaseData.user.id,
              email: supabaseData.user.email!,
              full_name: fullName,
              auth_providers: ['apple'],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              notification_settings: {
                daily_reminders: true,
                progress_updates: true,
                motivational_quotes: true,
              },
              onboarding_completed: false,
              subscription_tier: 'free',
            });
          } catch (dbError) {
            console.error('[AUTH] Failed to create user record in database for Apple sign-in:', dbError);
            // Don't fail the sign-in if database creation fails, but log it
          }
        }
      }

      // Successfully signed in with Apple
      
      return {
        user: {
          id: supabaseData.user.id,
          email: supabaseData.user.email!,
          user_metadata: supabaseData.user.user_metadata
        },
        error: null
      };
    } catch (error) {
      console.error('[AUTH] Apple sign-in error:', error);
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async resendVerificationEmail(email: string): Promise<{ error: string | null }> {
    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      
      // Basic validation
      const emailValidation = securityValidateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        return { error: emailValidation.error! };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: sanitizedEmail,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const authService = AuthService.getInstance(); 