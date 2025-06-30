import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface TavusCallModalProps {
  visible: boolean;
  callUrl: string | null;
  topicName: string;
  onClose: () => void;
  isLoading: boolean;
}

export default function TavusCallModal({
  visible,
  callUrl,
  topicName,
  onClose,
  isLoading,
}: TavusCallModalProps) {
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleClose = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end the tutoring session?',
      [
        { text: 'Continue Call', style: 'cancel' },
        { 
          text: 'End Call', 
          style: 'destructive',
          onPress: onClose
        }
      ]
    );
  };

  const handleWebViewLoad = () => {
    setWebViewLoading(false);
    setWebViewError(false);
  };

  const handleWebViewError = () => {
    setWebViewLoading(false);
    setWebViewError(true);
  };

  const retryConnection = () => {
    setWebViewError(false);
    setWebViewLoading(true);
    webViewRef.current?.reload();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.statusIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.topicText}>{topicName}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color={theme.colors.base} />
          </TouchableOpacity>
        </View>

        {/* Call Content */}
        <View style={styles.callContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Connecting to AI Tutor...</Text>
              <Text style={styles.loadingSubtext}>
                Setting up your personalized learning session
              </Text>
            </View>
          ) : webViewError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
              <Text style={styles.errorTitle}>Connection Failed</Text>
              <Text style={styles.errorText}>
                Unable to connect to the AI tutor. Please check your internet connection and try again.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={retryConnection}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color={theme.colors.base} />
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          ) : callUrl ? (
            <>
              {webViewLoading && (
                <View style={styles.webViewLoadingOverlay}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.webViewLoadingText}>Loading video call...</Text>
                </View>
              )}
              
              <WebView
                ref={webViewRef}
                source={{ uri: callUrl }}
                style={styles.webView}
                onLoad={handleWebViewLoad}
                onError={handleWebViewError}
                onHttpError={handleWebViewError}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={false}
                mixedContentMode="compatibility"
                allowsFullscreenVideo={true}
                userAgent={Platform.select({
                  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                  android: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
                  default: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36'
                })}
                onMessage={(event) => {
                  // Handle messages from the WebView if needed
                  console.log('WebView message:', event.nativeEvent.data);
                }}
                injectedJavaScript={`
                  // Inject JavaScript to improve the video call experience
                  (function() {
                    // Hide any unnecessary UI elements
                    const style = document.createElement('style');
                    style.textContent = \`
                      body { margin: 0; padding: 0; }
                      .tavus-header, .tavus-footer { display: none !important; }
                    \`;
                    document.head.appendChild(style);
                    
                    // Send ready message
                    window.ReactNativeWebView?.postMessage('webview-ready');
                  })();
                  true;
                `}
              />
            </>
          ) : (
            <View style={styles.noUrlContainer}>
              <Ionicons name="videocam-off" size={64} color={theme.colors.secondary} />
              <Text style={styles.noUrlText}>No call URL available</Text>
              <Text style={styles.noUrlSubtext}>
                Please try starting the call again
              </Text>
            </View>
          )}
        </View>

        {/* Call Controls */}
        {callUrl && !webViewError && !isLoading && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => webViewRef.current?.reload()}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={24} color={theme.colors.base} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={24} color={theme.colors.base} />
              <Text style={styles.endCallText}>End Call</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.base,
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.base,
  },
  topicText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.base,
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  webViewLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  webViewLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.base,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.base,
    marginTop: 24,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.base,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.base,
  },
  noUrlContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  noUrlText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.base,
    marginTop: 16,
    marginBottom: 8,
  },
  noUrlSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    paddingHorizontal: 20,
    width: 'auto',
    gap: 8,
  },
  endCallText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.base,
  },
});