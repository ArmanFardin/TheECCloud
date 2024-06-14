import { PermissionsAndroid, Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 30) {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permissions Denied', 'You need to grant storage permissions to use this feature.');
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    } else {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        if (
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          Alert.alert('Permissions Denied', 'You need to grant storage permissions to use this feature.');
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    }
  }
};
