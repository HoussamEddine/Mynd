// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enhanced configuration for better networking
config.server = {
  port: 8081, // Standard Metro port
};

// Force the hostname to be accessible from all network interfaces
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = '0.0.0.0';

// Use FSEvents instead of Watchman on macOS
config.watchFolders = [path.resolve(__dirname)];
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'cjs'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ttf'];

// Performance optimizations
config.maxWorkers = 4;
config.transformer = {
  ...config.transformer,
  workerPath: require.resolve('metro/src/DeltaBundler/Worker'),
  useBabel: true,
  experimentalImportSupport: false,
  unstable_disableModuleWrapping: true,
  optimizationSizeLimit: 160000,
  useTransformCache: true
};

// Disable Watchman
config.watcher = {
  watchman: false
};

module.exports = config; 