module.exports = ({ config }) => {
  return {
    ...config,
    updates: {
      ...config.updates,
      url: "https://u.expo.dev/0bac486a-cff3-4d2d-a925-f202fc65f851"
    },
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        projectId: "0bac486a-cff3-4d2d-a925-f202fc65f851"
      }
    },
    plugins: [
      ...config.plugins || [],
      ["expo-build-properties", {
        "android": {
          "enableProguardInReleaseBuilds": true,
          "extraProguardRules": "-keep class com.facebook.react.devsupport.** { *; }\n-dontwarn com.facebook.react.devsupport.**"
        }
      }]
    ]
  };
};