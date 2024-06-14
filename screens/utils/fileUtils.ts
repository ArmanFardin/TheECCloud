import FileViewer from 'react-native-file-viewer';
import { Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

/**
 * Shows a rationale dialog requesting permissions
 * @param message The message that will be displayed in the rationale dialog
 * @returns A promise that is a boolean indicating acceptance or rejection
 */
const showRationale = (message: string) => {
  return new Promise((resolve) => {
    Alert.alert(
      'Permission Required',
      message,
      [
        {
          text: 'Cancel',
          onPress: () => resolve(false),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false }
    );
  });
};
/**
 * Checks and requests specific permissions
 * @param permission The permission to be checked and requested
 * @param rationale The rationale message to be displayed
 * @returns A promise that is a boolean indicating acceptance or rejection
 */
const checkAndRequestPermission = async (permission: Permission, rationale: string) => {
  try {
    const result = await check(permission);
    if (result === RESULTS.GRANTED) {
      return true;
    } else if (result === RESULTS.DENIED) {
      const shouldShowRationale = await shouldShowRequestPermissionRationale(permission);
      if (shouldShowRationale) {
        const userAccepted = await showRationale(rationale);
        if (!userAccepted) {
          return false;
        }
      }
      const granted = await request(permission);
      return granted === RESULTS.GRANTED;
    } else {
      const granted = await request(permission);
      return granted === RESULTS.GRANTED;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
};
// Determines if the permission rationale dialog should be presented
const shouldShowRequestPermissionRationale = async (permission: Permission) => {
  const result = await check(permission);
  return result === RESULTS.GRANTED;
};

export const requestStoragePermissions = async () => {
  if (Platform.OS === 'android') {
    const readGranted = await checkAndRequestPermission(
      PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      'This app needs access to your storage to open and read files.'
    );
    const writeGranted = await checkAndRequestPermission(
      PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      'This app needs access to your storage to save and write files.'
    );
    const mediaImagesGranted = await checkAndRequestPermission(
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
      'This app needs access to your media images to read and display your images.'
    );

    return true;
  }
  return true;
};
/**
 * Opens the requested file by using the native file viewer after ensuring permissions are granted
 * @param filePath 
 * @returns 
 */
export const openFile = async (filePath: string) => {
  try {
    const permissionsGranted = await requestStoragePermissions();
    if (!permissionsGranted) return;

    const mimeType = getMimeType(filePath);

    await FileViewer.open(filePath, { showOpenWithDialog: true, displayName: filePath.split('/').pop() })
      .then(() => {
        console.log('Success');
      })
      .catch((error) => {
        console.error('Error opening file:', error);
        Alert.alert('Error', 'An error occurred while trying to view the file.');
      });
  } catch (error) {
    console.error('Error opening file:', error);
    Alert.alert('Error', 'An error occurred while trying to view the file.');
  }
};

/**
 * Determines the MIME type based on the file extension
 * @param filePath The file path to determine the MIME type for
 * @returns The MIME type as a string
 */
const getMimeType = (filePath: string) => {
  const extension = filePath.split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'pdf':
      return 'application/pdf';
    case 'txt':
      return 'text/plain';
    default:
      return '*/*'; 
  }
};