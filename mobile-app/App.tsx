import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar, Platform } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/components/LoadingScreen';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { NotificationProvider } from './src/context/NotificationContext';

const App = () => {
  useEffect(() => {
    // Hide splash screen after app loads
    if (Platform.OS === 'android') {
      SplashScreen.hide();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <ThemeProvider>
            <AuthProvider>
              <LocationProvider>
                <NotificationProvider>
                  <NavigationContainer>
                    <StatusBar
                      barStyle="light-content"
                      backgroundColor="#1a1a2e"
                      translucent={false}
                    />
                    <AppNavigator />
                    <Toast />
                  </NavigationContainer>
                </NotificationProvider>
              </LocationProvider>
            </AuthProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
