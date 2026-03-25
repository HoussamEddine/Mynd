# Mynd

**Your Mind. Your Voice. Your Power.**

Mynd transforms limiting beliefs into empowering truths through personalized voice-cloned affirmations, AI-powered daydream analysis, and transformation sessions.

## Features

- **Voice Cloning Technology** - Record your voice once and hear all affirmations in your own voice
- **Core Belief Transformation** - Identify and rewire limiting beliefs with personalized affirmations
- **AI-Powered Personalization** - Content tailored to your specific challenges
- **Guided Transformation Sessions** - Audio sessions for motivation, stress relief, focus, and sleep
- **Progress Tracking** - Monitor your belief strength and growth over time
- **Dreamscape** - AI-powered daydream analysis to uncover hidden core beliefs

## Tech Stack

- **Framework**: React Native with Expo (SDK 50)
- **Language**: TypeScript
- **Navigation**: React Navigation (native-stack, bottom-tabs)
- **Backend**: Supabase (Auth, Database)
- **State Management**: Zustand
- **Styling**: Styled Components
- **Animations**: React Native Reanimated, Moti, Lottie
- **Voice**: React Native Voice
- **Charts**: Victory Native, React Native Chart Kit
- **3D Graphics**: Three.js with React Three Fiber

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth, Belief, Theme, Notification)
├── constants/        # Theme, colors, typography
├── hooks/            # Custom React hooks
├── lib/              # Library configurations (Supabase client)
├── navigation/       # Navigation configuration and tabs
├── screens/          # Screen components
├── services/         # Business logic and API services
├── store/            # Zustand stores
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Yarn or npm
- Expo CLI
- iOS Simulator / Android Emulator or physical device

### Installation

```bash
# Install dependencies
yarn install

# Start the development server
yarn start

# Run on iOS
yarn ios

# Run on Android
yarn android
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID=your_ios_google_client_id
EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID=your_android_google_client_id
EXPO_PUBLIC_WEB_GOOGLE_CLIENT_ID=your_web_google_client_id
EXPO_PUBLIC_IOS_GOOGLE_URL_SCHEME=your_ios_url_scheme
```

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start Expo development server |
| `yarn android` | Run on Android device/emulator |
| `yarn ios` | Run on iOS simulator |
| `yarn web` | Run in web browser |
| `yarn generate-assets` | Generate app icons and splash screens |

## Build

### iOS (EAS Build)

```bash
eas build --platform ios --profile preview
```

### Android (EAS Build)

```bash
eas build --platform android --profile preview
```

## Architecture

### Authentication Flow

1. User opens app → Welcome screen
2. Sign up via Email, Google, or Apple
3. Complete onboarding questionnaire
4. Record voice clone
5. Access main app with personalized content

### State Management

- **Zustand** for global state (user preferences, app settings)
- **React Context** for theme, auth, and belief state
- **AsyncStorage** for local persistence
- **Supabase** for cloud data sync

### Key Services

- `authService` - Authentication with Supabase Auth
- `appStateService` - Onboarding flow state management
- `beliefService` - Belief CRUD operations
- `profileService` - User profile and settings
- `dailyUsageTrackingService` - Analytics and usage tracking
- `eventsLogService` - Event logging

## License

Private - All rights reserved
