import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ImageBackground, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';

type Props = {
  navigation: StackNavigationProp<any, any>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const backgroundImage = require('./assets/splashscreen.png');

  const handleLogin = async () => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('User logged in:', user.uid);
      
      // Navigate to Enter screen after successful login
      navigation.navigate('Main', { screen: 'Upload' });
    } catch (error) {
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert('Login Error', errorMessage);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Reset Password', 'Please enter your email address.');
      return;
    }
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert('Reset Password', 'A password reset email has been sent to your email address.');
    } catch (error) {
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert('Reset Password Error', errorMessage);
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <View style={styles.container}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          style={styles.input}
        />
        <Button title="Login" onPress={handleLogin} />
        <Button title="Sign Up" onPress={() => navigation.navigate('Register')} />
        <Button title="Reset Password" onPress={handlePasswordReset} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    margin: 20,
    borderRadius: 10,
  },
  input: {
    height: 40,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

export default LoginScreen;
