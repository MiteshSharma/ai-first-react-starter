const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@stores': path.resolve(__dirname, 'src/stores'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@auth': path.resolve(__dirname, 'src/auth'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
    configure: (webpackConfig, { env, paths }) => {
      // Production optimizations
      if (env === 'production') {
        // Bundle splitting for better caching
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                chunks: 'all',
              },
              common: {
                name: 'common',
                minChunks: 2,
                priority: 5,
                chunks: 'all',
                enforce: true,
              },
            },
          },
        };
      }
      return webpackConfig;
    },
  },
  jest: {
    configure: (jestConfig, { env, paths, resolve, rootDir }) => {
      // Add module name mapping for path aliases
      jestConfig.moduleNameMapper = {
        ...jestConfig.moduleNameMapper,
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@stores/(.*)$': '<rootDir>/src/stores/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@auth/(.*)$': '<rootDir>/src/auth/$1',
        '^@assets/(.*)$': '<rootDir>/src/assets/$1',
      };

      // Enhanced test setup
      jestConfig.setupFilesAfterEnv = [
        ...jestConfig.setupFilesAfterEnv,
        '<rootDir>/src/test/setupTests.ts',
      ];

      return jestConfig;
    },
  },
};