import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ImageBackground, Alert, Text } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { generateKeyPair } from './utils/cryptoUtils';

type Props = {
  navigation: StackNavigationProp<any, any>;
};

const Register: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const backgroundImage = require('./assets/splashscreen.png');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Registration Error', 'Passwords do not match!');
      return;
    }
  
    if (!isPasswordComplex(password)) {
      Alert.alert(
        'Registration Error',
        'Password must contain at least 2 numbers, 1 symbol, and 1 capital letter.'
      );
      return;
    }
  
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('User account created & signed in!');
  
      const { privateKey, publicKey } = generateKeyPair();
  
      await user.sendEmailVerification();
      console.log('Verification email sent!');
  
      await firestore().collection('Users').doc(user.uid).set({
        email: email,
        publicKey: publicKey, 
      });
  
      console.log('User data stored in Firestore!');
  
      Alert.alert(
        'Verification Email Sent',
        'A verification email has been sent to your email address. Please verify your email and then log in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
  
        switch (error.name) {
          case 'auth/email-already-in-use':
            errorMessage = 'That email address is already in use!';
            break;
          case 'auth/invalid-email':
            errorMessage = 'That email address is invalid!';
            break;
          default:
            break;
        }
      }
      Alert.alert('Registration Error', errorMessage);
    }
  };

  const isPasswordComplex = (password: string) => {
    const numberRegex = /\d{2,}/; // At least two numbers
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/; // At least one symbol
    const capitalLetterRegex = /[A-Z]/; // At least one capital letter

    return (
      numberRegex.test(password) &&
      symbolRegex.test(password) &&
      capitalLetterRegex.test(password)
    );
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <View style={styles.container}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          style={styles.input}
        />
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={true}
          style={styles.input}
        />
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <Button title="Register" onPress={handleRegister} />
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
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default Register;
