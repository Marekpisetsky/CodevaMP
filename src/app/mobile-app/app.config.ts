import type { ConfigContext, ExpoConfig } from "@expo/config";

const NAME = "CodevaMP Companion";
const SLUG = "codevamp-companion";

const createExpoConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: NAME,
  slug: SLUG,
  scheme: "codevamp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    resizeMode: "contain",
    backgroundColor: "#050513"
  },
  updates: {
    url: "https://u.expo.dev/placeholder-codevamp-companion",
    fallbackToCacheTimeout: 0
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.codevamp.companion",
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true
      }
    }
  },
  android: {
    package: "com.codevamp.companion",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#050513"
    },
    permissions: ["INTERNET"]
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
    eas: {
      projectId: "00000000-0000-4000-8000-000000000000"
    }
  },
  experiments: {
    tsconfigPaths: true
  }
});

export default createExpoConfig;