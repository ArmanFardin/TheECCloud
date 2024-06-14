import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

const splashScreenImage = require('./assets/splashscreen.png');
type Props = {
  navigation: StackNavigationProp<any, any>;
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Login');
    }, 3000); // 3 seconds delay
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={splashScreenImage} style={styles.image} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default SplashScreen;
