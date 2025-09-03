module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            // Alias the problematic vector-icons path
            './vendor/react-native-vector-icons/Fonts/AntDesign.ttf': './empty.js'
          }
        }
      ],
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: [
          'EXPO_PUBLIC_SUPABASE_URL',
          'EXPO_PUBLIC_SUPABASE_ANON_KEY',
          'EXPO_PUBLIC_VOICE_API_URL',
          'EXPO_PUBLIC_BACKEND_API_URL',
          'EXPO_PUBLIC_USE_DEMO_MODE'
        ],
        safe: true,
        allowUndefined: false,
      }],
      // Added reanimated plugin - MUST BE LAST
      'react-native-reanimated/plugin',
    ],
  };
}; 