import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  FadeInUp,
  FadeInDown 
} from 'react-native-reanimated';
import { authService, type AuthUser } from '../services/authService';
import { theme } from '../constants'
const { colors } = theme.foundations;;

const { width, height } = Dimensions.get('window');

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(true); // Default to sign up for first-time users
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingUser, setHasExistingUser] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  });

  const slideValue = useSharedValue(0);

  useEffect(() => {
    slideValue.value = withSpring(isSignUp ? 0 : 1, {
      damping: 20,
      stiffness: 100,
    });
  }, [isSignUp, slideValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideValue.value * -width }],
  }));

  const handleSubmit = async () => {
    if (isLoading) return;

    // Validation
    if (!formData.email || !formData.password) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (isSignUp) {
      if (!formData.fullName) {
        Alert.alert('Name Required', 'Please enter your full name to create your account');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
        return;
      }
      if (formData.password.length < 6) {
        Alert.alert('Weak Password', 'Password must be at least 6 characters long for security');
        return;
      }
    }

    setIsLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await authService.signUp({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        });
      } else {
        result = await authService.signIn({
          email: formData.email,
          password: formData.password,
        });
      }

      if (result.error) {
        // Handle specific error cases
        if (result.error.includes('User already registered')) {
          Alert.alert(
            'Account Exists', 
            'An account with this email already exists. Would you like to sign in instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Sign In', 
                onPress: () => {
                  setHasExistingUser(true);
                  setIsSignUp(false);
                  setFormData(prev => ({ ...prev, fullName: '', confirmPassword: '' }));
                }
              }
            ]
          );
        } else if (result.error.includes('Invalid login credentials')) {
          Alert.alert('Sign In Failed', 'Invalid email or password. Please check your credentials and try again.');
        } else {
          Alert.alert('Authentication Error', result.error);
        }
      } else if (result.user) {
        onAuthSuccess(result.user);
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to connect. Please check your internet connection and try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    if (!isSignUp) {
      setHasExistingUser(true);
    }
    setFormData({
      email: '',
      password: '',
      fullName: '',
      confirmPassword: '',
    });
  };

  const renderSignUpForm = () => (
    <View style={styles.formContainer}>
      <Animated.View entering={FadeInUp.delay(200)} style={styles.headerSection}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start your wellness journey with personalized features</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400)} style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Feather name="user" size={20} color="#8b5cf6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor="#9CA3AF"
            value={formData.fullName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
            autoComplete="name"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Feather name="mail" size={20} color="#8b5cf6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#9CA3AF"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Feather name="lock" size={20} color="#8b5cf6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Create password"
            placeholderTextColor="#9CA3AF"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Feather name="lock" size={20} color="#8b5cf6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor="#9CA3AF"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600)} style={styles.buttonContainer}>
        <Pressable
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </Pressable>

        <Pressable style={styles.switchButton} onPress={toggleMode}>
          <Text style={styles.switchButtonText}>
            Already have an account? <Text style={styles.switchButtonHighlight}>Sign in</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );

  const renderSignInForm = () => (
    <View style={styles.formContainer}>
      <Animated.View entering={FadeInUp.delay(200)} style={styles.headerSection}>
        <Text style={styles.title}>
          {hasExistingUser ? 'Welcome back' : 'Sign in to Mynd'}
        </Text>
        <Text style={styles.subtitle}>
          {hasExistingUser 
            ? 'Continue your wellness journey' 
            : 'Access your account and personalized features'
          }
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400)} style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Feather name="mail" size={20} color="#8b5cf6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#9CA3AF"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Feather name="lock" size={20} color="#8b5cf6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
            autoComplete="password"
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600)} style={styles.buttonContainer}>
        <Pressable
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </Pressable>

        <Pressable style={styles.switchButton} onPress={toggleMode}>
          <Text style={styles.switchButtonText}>
            New to Mynd? <Text style={styles.switchButtonHighlight}>Create account</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* App Logo/Branding */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.brandingSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Mynd</Text>
          </Animated.View>

          {/* Form Container with sliding animation */}
          <View style={styles.formsContainer}>
            <Animated.View style={[styles.formsWrapper, animatedStyle]}>
              <View style={[styles.formSlide, { width }]}>
                {renderSignUpForm()}
              </View>
              <View style={[styles.formSlide, { width }]}>
                {renderSignInForm()}
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: height,
  },
  brandingSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logo: {
    width: 80,
    height: 80,
    tintColor: '#8b5cf6',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -1.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  formsContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  formsWrapper: {
    flexDirection: 'row',
    width: width * 2,
  },
  formSlide: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  headerSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 32,
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    height: '100%',
    fontWeight: '500',
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  switchButton: {
    padding: 16,
  },
  switchButtonText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  switchButtonHighlight: {
    color: '#8b5cf6',
    fontWeight: '700',
  },
}); 