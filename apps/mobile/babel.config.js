const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin');

module.exports = function configureBabel(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [expoRouterBabelPlugin],
  };
};
