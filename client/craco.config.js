module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source map warnings from node_modules
      webpackConfig.ignoreWarnings = [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource &&
            warning.module.resource.includes('node_modules') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ];
      return webpackConfig;
    },
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // This replaces the deprecated onBeforeSetupMiddleware and onAfterSetupMiddleware
      return middlewares;
    },
  },
};
