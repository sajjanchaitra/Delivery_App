const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Expo Config Plugin to enable cleartext (HTTP) traffic on Android
 * This is required for Android 9+ to allow HTTP connections
 */
const withCleartextTraffic = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Get the main application element
    const mainApplication = androidManifest.manifest.application[0];
    
    // Enable cleartext traffic for HTTP connections
    mainApplication.$["android:usesCleartextTraffic"] = "true";
    
    console.log("✅ Cleartext traffic enabled for Android");
    
    return config;
  });
};

module.exports = withCleartextTraffic;