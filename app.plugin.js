module.exports = function withCleartextTraffic(config) {
  config.android = config.android || {};
  config.android.manifest = config.android.manifest || {};
  config.android.manifest.application = config.android.manifest.application || {};
  config.android.manifest.application.$ = config.android.manifest.application.$ || {};

  config.android.manifest.application.$["android:usesCleartextTraffic"] = "true";
  return config;
};
