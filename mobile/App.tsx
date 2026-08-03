// Workora mobile app — a native wrapper around the Workora web app (PWA).
// Pattern: `happy` (slopus/happy) — a thin shell that loads the real app,
// so one codebase serves web + iOS + Android. When you register Apple/Google
// developer accounts, this is the project you build with EAS and publish.
// Edit WORKORA_URL to your instance (defaults to the live one).
import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";

const WORKORA_URL = "https://office.ramagiritharun.in";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <WebView
        source={{ uri: WORKORA_URL }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  webview: { flex: 1 },
});
