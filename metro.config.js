const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Use path.resolve to ensure we're using the project root directory
// This makes the configuration more portable across different environments
const projectRoot = path.resolve(__dirname);
const config = getDefaultConfig(projectRoot);

// Optimize Metro Bundler configuration
config.maxWorkers = 8; // Limit the number of workers
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true
    }
  },
  assetPlugins: ['expo-asset/tools/hashAssetFiles']
};

config.cacheStores = [];
config.resetCache = true;

module.exports = withNativeWind({
  ...config,
  resolver: {
    ...config.resolver,
    assetExts: [...config.resolver.assetExts, 'png', 'svg', 'jpg', 'jpeg']
  }
});