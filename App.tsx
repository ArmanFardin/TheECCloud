import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import Register from './screens/Register';
import UploadScreen from './screens/UploadScreen';
import ViewFilesScreen from './screens/ViewFilesScreen';
import { ImageBackground, StyleSheet } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const UploadIcon = require('./screens/assets/upload.png');
const ViewIcon = require('./screens/assets/view.png');

// Tab navigator
function MainContent() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconSource;
          if (route.name === 'Upload') {
            iconSource = UploadIcon;
          } else if (route.name === 'View Files') {
            iconSource = ViewIcon;
          }

          return (
            <ImageBackground
              source={iconSource}
              style={{ width: size, height: size }}
              imageStyle={{ tintColor: color, resizeMode: 'contain' }}
            />
          );
        },
        tabBarShowLabel: true, 
        tabBarStyle: {
          height: 40, 
        },
      })}
    >
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="View Files" component={ViewFilesScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 30,
    height: 30,
  },
});

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Main" component={MainContent} />
        <Stack.Screen name="Upload" component={UploadScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
