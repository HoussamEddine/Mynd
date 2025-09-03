/**
 * Enhanced Security Service
 * Comprehensive security measures for protection against various attacks
 */

import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Security constants
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  ENCRYPTION_KEY: 'mynd-secure-key-2024',
  HASH_ITERATIONS: 10000,
};

// Enhanced XSS Prevention with multiple layers
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove all potentially dangerous characters and patterns
    .replace(/[<>\"'&]/g, '') // Basic XSS
    .replace(/javascript:/gi, '') // JavaScript protocol
    .replace(/data:/gi, '') // Data URLs
    .replace(/vbscript:/gi, '') // VBScript
    .replace(/on\w+\s*=/gi, '') // Event handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Embed tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .substring(0, 1000); // Limit length to prevent DoS
};

// Sanitize arrays of strings
export const sanitizeArray = (arr: string[]): string[] => {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitizeInput(item))
    .slice(0, 10); // Limit array size
};

// Enhanced SQL Injection Prevention
export const sanitizeDbInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove SQL injection patterns
    .replace(/['";]/g, '') // Remove SQL delimiters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//g, '') // Remove SQL block comments
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE|EXEC|EXECUTE|SCRIPT|DECLARE|CAST|CONVERT)\b/gi, '') // Remove SQL keywords
    .replace(/xp_/gi, '') // Remove extended procedures
    .replace(/sp_/gi, '') // Remove stored procedures
    .replace(/@@/g, '') // Remove SQL variables
    .replace(/0x[0-9a-fA-F]+/g, '') // Remove hex values
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .substring(0, 500); // Reasonable length limit
};

// Advanced password validation with entropy checking
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 12) {
    return { isValid: false, error: 'Password must be at least 12 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }
  
  // Check for common weak passwords (expanded list)
  const commonPasswords = [
    'password123', 'qwerty123', '12345678', 'letmein123', 'welcome123', 'monkey123',
    'football123', 'abc123456', 'password1', '123456789', '1234567890', 'qwertyuiop',
    'asdfghjkl', 'zxcvbnm', 'password', 'admin123', 'root123', 'test123', 'guest123'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'This password is too common. Please choose a stronger password.' };
  }

  // Check for sequential characters (expanded)
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789|890|qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/.test(password.toLowerCase())) {
    return { isValid: false, error: 'Password cannot contain sequential characters' };
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    return { isValid: false, error: 'Password cannot contain repeated characters (e.g., "aaa")' };
  }
  
  // Check for keyboard patterns
  if (/(?:qwerty|asdfgh|zxcvbn|123456|654321)/.test(password.toLowerCase())) {
    return { isValid: false, error: 'Password cannot contain keyboard patterns' };
  }
  
  // Check for personal information patterns (birth years, common names)
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 100; year <= currentYear; year++) {
    if (password.includes(year.toString())) {
      return { isValid: false, error: 'Password cannot contain birth years or common years' };
    }
  }
  
  // Calculate password entropy
  const charSet = new Set(password.split(''));
  const entropy = Math.log2(Math.pow(charSet.size, password.length));
  if (entropy < 50) {
    return { isValid: false, error: 'Password is not complex enough. Try using more varied characters.' };
  }
  
  return { isValid: true };
};

// Enhanced email validation with security checks
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  // Length validation
  if (email.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }
  
  // Check for disposable email domains
  const disposableDomains = [
    'tempmail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'sharklasers.com'
  ];
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { isValid: false, error: 'Please use a valid email address, not a temporary one' };
  }
  
  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const [localPart, emailDomain] = email.split('@');
  
  // Check for common domain typos
  const similarDomain = commonDomains.find(d => 
    d.length === emailDomain.length && 
    d.split('').filter((char, i) => char !== emailDomain[i]).length === 1
  );
  
  if (similarDomain) {
    return { 
      isValid: false, 
      error: `Did you mean ${localPart}@${similarDomain}?` 
    };
  }
  
  // Check for suspicious patterns
  if (/[<>\"'&]/.test(email)) {
    return { isValid: false, error: 'Email contains invalid characters' };
  }
  
  return { isValid: true };
};

// Name validation with security checks
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized || sanitized.length === 0) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' };
  }
  
  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens and apostrophes' };
  }
  
  // Check for suspicious patterns (repeated characters)
  if (/(.)\1{4,}/.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid name' };
  }
  
  // Check for test data patterns
  if (/\b(test|testing|asdf|qwerty|123)\b/i.test(sanitized)) {
    return { isValid: false, error: 'Please enter your real name' };
  }
  
  return { isValid: true };
};

// Age validation
export const validateAge = (age: number): { isValid: boolean; error?: string } => {
  if (!age || typeof age !== 'number' || isNaN(age)) {
    return { isValid: false, error: 'Please select a valid age' };
  }
  
  if (age < 13 || age > 120) {
    return { isValid: false, error: 'Please select a valid age between 13 and 120' };
  }
  
  if (!Number.isInteger(age)) {
    return { isValid: false, error: 'Age must be a whole number' };
  }
  
  return { isValid: true };
};

// Text content validation (for beliefs, goals, etc.)
export const validateTextContent = (
  text: string, 
  fieldName: string, 
  minLength = 10, 
  maxLength = 500
): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(text);
  
  if (!sanitized || sanitized.length === 0) {
    return { isValid: false, error: `Please enter ${fieldName}` };
  }
  
  if (sanitized.length < minLength) {
    return { isValid: false, error: `Please provide more detail (at least ${minLength} characters)` };
  }
  
  if (sanitized.length > maxLength) {
    return { isValid: false, error: `Please keep it under ${maxLength} characters` };
  }
  
  // Check for inappropriate content patterns
  if (/\b(test|testing|asdf|qwerty|123)\b/i.test(sanitized)) {
    return { isValid: false, error: `Please enter meaningful ${fieldName}` };
  }
  
  return { isValid: true };
};

// Enhanced rate limiting with IP tracking and progressive delays
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, { 
    count: number; 
    resetTime: number; 
    lastAttempt: number;
    lockoutUntil?: number;
  }>();
  
  return {
    checkLimit: (identifier: string): boolean => {
      const now = Date.now();
      const userAttempts = attempts.get(identifier);
      
      // Check if user is locked out
      if (userAttempts?.lockoutUntil && now < userAttempts.lockoutUntil) {
        return false;
      }
      
      // Clear lockout if expired
      if (userAttempts?.lockoutUntil && now >= userAttempts.lockoutUntil) {
        userAttempts.lockoutUntil = undefined;
      }
      
      if (!userAttempts || now > userAttempts.resetTime) {
        attempts.set(identifier, { 
          count: 1, 
          resetTime: now + windowMs,
          lastAttempt: now
        });
        return true;
      }
      
      if (userAttempts.count >= maxAttempts) {
        // Implement progressive lockout
        const lockoutDuration = Math.min(windowMs * Math.pow(2, userAttempts.count - maxAttempts), 24 * 60 * 60 * 1000);
        userAttempts.lockoutUntil = now + lockoutDuration;
        logSecurityEvent('RATE_LIMIT_EXCEEDED', { identifier, lockoutDuration });
        return false;
      }
      
      userAttempts.count++;
      userAttempts.lastAttempt = now;
      return true;
    },
    
    getRemainingTime: (identifier: string): number => {
      const userAttempts = attempts.get(identifier);
      if (!userAttempts) return 0;
      
      if (userAttempts.lockoutUntil) {
        const remaining = userAttempts.lockoutUntil - Date.now();
        return Math.max(0, remaining);
      }
      
      const remaining = userAttempts.resetTime - Date.now();
      return Math.max(0, remaining);
    },
    
    getAttemptsCount: (identifier: string): number => {
      const userAttempts = attempts.get(identifier);
      return userAttempts?.count || 0;
    }
  };
};

// Enhanced device fingerprinting
export const getDeviceFingerprint = async (): Promise<string> => {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const platform = Platform.OS;
    const version = Platform.Version;
    
    // Get additional device info for better fingerprinting
    const { Dimensions } = require('react-native');
    const { width, height } = Dimensions.get('window');
    const screenInfo = `${width}x${height}`;
    
    // Create a more unique fingerprint
    const fingerprint = `${platform}-${version}-${screenInfo}-${timestamp}-${random}`;
    
    // Hash the fingerprint for security
    const hashedFingerprint = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fingerprint
    );
    
    return hashedFingerprint.substring(0, 64);
      } catch (error) {
      logSecurityEvent('FINGERPRINT_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      return `${Platform.OS}-unknown-${Date.now()}`.substring(0, 64);
    }
};

// Session management and security
export const sessionManager = {
  async createSecureSession(userId: string): Promise<string> {
    try {
      const sessionId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${userId}-${Date.now()}-${Math.random()}`
      );
      
      const sessionData = {
        userId,
        sessionId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        deviceFingerprint: await getDeviceFingerprint(),
      };
      
      await AsyncStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
      return sessionId;
         } catch (error) {
       logSecurityEvent('SESSION_CREATION_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
       throw new Error('Failed to create secure session');
     }
  },
  
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await AsyncStorage.getItem(`session_${sessionId}`);
      if (!sessionData) return false;
      
      const session = JSON.parse(sessionData);
      const now = Date.now();
      
      // Check if session is expired
      if (now - session.lastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
        await this.destroySession(sessionId);
        return false;
      }
      
      // Update last activity
      session.lastActivity = now;
      await AsyncStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
      
      return true;
         } catch (error) {
       logSecurityEvent('SESSION_VALIDATION_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
       return false;
     }
  },
  
  async destroySession(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`session_${sessionId}`);
       } catch (error) {
     logSecurityEvent('SESSION_DESTROY_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
   }
  }
};

// Input validation with attack detection
export const validateInput = (input: string, type: 'email' | 'password' | 'name' | 'text'): { 
  isValid: boolean; 
  error?: string;
  securityRisk?: boolean;
} => {
  const sanitized = sanitizeInput(input);
  
  // Check for potential attack patterns
  const attackPatterns = [
    /<script/i, /javascript:/i, /data:/i, /vbscript:/i,
    /on\w+\s*=/i, /<iframe/i, /<object/i, /<embed/i,
    /union\s+select/i, /drop\s+table/i, /delete\s+from/i,
    /exec\s*\(/i, /eval\s*\(/i, /document\./i, /window\./i
  ];
  
  const hasAttackPattern = attackPatterns.some(pattern => pattern.test(input));
  if (hasAttackPattern) {
    logSecurityEvent('POTENTIAL_ATTACK_DETECTED', { 
      type, 
      pattern: input.substring(0, 100),
      deviceFingerprint: getDeviceFingerprint()
    });
    return { 
      isValid: false, 
      error: 'Invalid input detected', 
      securityRisk: true 
    };
  }
  
  // Type-specific validation
  switch (type) {
    case 'email':
      return validateEmail(sanitized);
    case 'password':
      return validatePassword(sanitized);
    case 'name':
      return validateName(sanitized);
    case 'text':
      return validateTextContent(sanitized, 'text');
    default:
      return { isValid: true };
  }
};

// Enhanced security logging
export const logSecurityEvent = (event: string, details: any) => {
  const timestamp = new Date().toISOString();
  const securityEvent = {
    event,
    timestamp,
    details,
    deviceInfo: {
      platform: Platform.OS,
      version: Platform.Version,
    },
    severity: getEventSeverity(event)
  };
  
  console.warn(`[SECURITY] ${timestamp}: ${event}`, securityEvent);
  
  // In production, send to security monitoring service
  if (!__DEV__) {
    // Example: Send to Sentry, LogRocket, or custom analytics
    // analytics.track('security_event', securityEvent);
  }
};

// Determine event severity
const getEventSeverity = (event: string): 'low' | 'medium' | 'high' | 'critical' => {
  const criticalEvents = ['POTENTIAL_ATTACK_DETECTED', 'RATE_LIMIT_EXCEEDED', 'SESSION_HIJACKING'];
  const highEvents = ['LOGIN_FAILURE', 'PASSWORD_RESET', 'ACCOUNT_LOCKOUT'];
  const mediumEvents = ['VALIDATION_ERROR', 'SUSPICIOUS_ACTIVITY'];
  
  if (criticalEvents.includes(event)) return 'critical';
  if (highEvents.includes(event)) return 'high';
  if (mediumEvents.includes(event)) return 'medium';
  return 'low';
};

// Content Security Policy headers
export const secureHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// Add after validatePassword
export function validatePasswordSimple(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one letter' };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  return { isValid: true };
}

// Export all security functions
export default {
  sanitizeInput,
  sanitizeArray,
  sanitizeDbInput,
  validateEmail,
  validatePassword,
  validateName,
  validateAge,
  validateTextContent,
  validateInput,
  createRateLimiter,
  secureHeaders,
  logSecurityEvent,
  getDeviceFingerprint,
  sessionManager,
  SECURITY_CONFIG,
  validatePasswordSimple,
}; 