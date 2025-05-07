module.exports = ({config}) => {
  return {
    expo: {
      name: "Roadbook",
      slug: "Roadbook",
      version: "3.0.0",
      orientation: "portrait",
      icon: "app/assets/images/icon.png",
      scheme: "myapp",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      splash: {
        image: "app/assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.roadbook.tracker",
        infoPlist: {
          NSLocationWhenInUseUsageDescription: "Cette application utilise votre position pour suivre vos trajets.",
          NSLocationAlwaysUsageDescription: "Cette application utilise votre position en arrière-plan pour le suivi GPS."
        }
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "app/assets/images/adaptive-icon.png",
          backgroundColor: "#ffffff"
        },
        permissions: [
          "ACCESS_FINE_LOCATION",
          "ACCESS_COARSE_LOCATION",
          "FOREGROUND_SERVICE",
          "POST_NOTIFICATIONS",
          "CAMERA",
          "RECORD_AUDIO",
          "android.permission.MODIFY_AUDIO_SETTINGS",
          "android.permission.CAMERA",
          "android.permission.RECORD_AUDIO"
        ],
        package: "com.roadbook.tracker",
        buildType: "apk"
      },
      web: {
        bundler: "metro",
        output: "static",
        favicon: "app/assets/images/favicon.png"
      },
      plugins: [
        "expo-router",
        "expo-secure-store",
        "expo-notifications",
        "sentry-expo",
        [
          "expo-camera",
          {
            cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
            microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
            recordAudioAndroid: true
          }
        ],
      ],
      sentry: {
        organization: "roadbookCorp",
        project: "roadbook"
      },
      hooks: {
        postPublish: [
          {
            file: "expo-hooks/disable-bundle-compression.js",
            config: {}
          },
          {
            file: "sentry-expo/upload-sourcemaps",
            config: {
              organization: "roadbookCorp",
              project: "roadbook"
            }
          }
        ]
      },
      experiments: {
        typedRoutes: true
      },
      extra: {
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY,
        GEOAPIFY_API_KEY2: process.env.GEOAPIFY_API_KEY2,
        WEATHER_API_KEY: process.env.WEATHER_API_KEY,
        SENTRY_DSN: process.env.SENTRY_DSN,
        router: {
          origin: false
        },
        eas: {
          projectId: "0bac486a-cff3-4d2d-a925-f202fc65f851"
        }
      },
      owner: "ajkll"
    }
  };
};