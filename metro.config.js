const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'png', 'jpg', 'jpeg', 'webp'],
    sourceExts: [...defaultConfig.resolver.sourceExts, 'js', 'jsx', 'ts', 'tsx'],
    extraNodeModules: {
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('react-native-crypto'),
      buffer: require.resolve('buffer'),
      assert: require.resolve('assert'),
      events: require.resolve('events'),
      process: require.resolve('process/browser'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
