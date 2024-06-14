import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, FlatList, StyleSheet, RefreshControl, Alert, TextInput } from 'react-native';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { decryptFile, encryptFile, generateKeyPair } from './utils/cryptoUtils';
import auth from '@react-native-firebase/auth';
import RNFS from 'react-native-fs';
import * as Keychain from 'react-native-keychain';
import { openFile, requestStoragePermissions } from './utils/fileUtils';
import crypto from 'crypto';

/**
 * This screen allows users to view, share and delete their files
 * stored in Firebase
 */
const ViewFilesScreen: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  /**
   * Fetches the files from Firestore and Storage for the authenticated user
   */
  const fetchFiles = async () => {
    const user = auth().currentUser;
    if (user) {
      const querySnapshot = await firestore().collection('files').where('userId', '==', user.uid).get();
      const fileList: any[] = [];
      querySnapshot.forEach((doc) => {
        fileList.push({ id: doc.id, ...doc.data() });
      });

      const sharedQuerySnapshot = await firestore().collection('sharedFiles').where('filePath', '>=', `${user.email}/`).get();
      sharedQuerySnapshot.forEach((doc) => {
        fileList.push({ id: doc.id, ...doc.data(), shared: true });
      });
      setFiles(fileList);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);
  /**
   * Refresh the list of files by re-fetching
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFiles().then(() => setRefreshing(false));
  }, []);
  /**
   * Handles viewing files by downloading and decrypting them
   * @param filePath - THe path of the encrypted file in Storage
   * @param publicKey - The public key 
   * @param encryptedKey - The encrypted AES key
   * @param originalName - The original name of the file
   * @returns 
   */
  const handleViewFile = async (filePath: string, publicKey: string, encryptedKey: string, originalName: string) => {
    try {
      const keychainData = await Keychain.getGenericPassword();
      if (!keychainData) {
        throw new Error('No keys stored in keychain');
      }
      const { password: privateKey } = keychainData;  
      console.log('Downloading file with metadata:', { filePath, publicKey, encryptedKey });
      const reference = storage().ref(filePath);
      const downloadUrl = await reference.getDownloadURL();
      const downloadFilePath = `${RNFS.DocumentDirectoryPath}/${filePath.split('/').pop()}`;
      await RNFS.downloadFile({ fromUrl: downloadUrl, toFile: downloadFilePath }).promise;
  
      let decryptedKey;
      if (encryptedKey.includes('key')) {
        decryptedKey = decryptMetadata(encryptedKey);
      } else {
        decryptedKey = encryptedKey;
      }
  
      const parsedEncryptedKey = JSON.parse(decryptedKey);
      const decryptedFilePath = await decryptFile(downloadFilePath, privateKey, parsedEncryptedKey);
      console.log('File downloaded and decrypted successfully!', decryptedFilePath);
  
      const originalFilePath = decryptedFilePath.replace('.dec', '');
      await RNFS.moveFile(decryptedFilePath, originalFilePath);
  
      console.log('File renamed to:', originalFilePath);
  
      const permissionsGranted = await requestStoragePermissions();
      if (!permissionsGranted) return;
  
      openFile(originalFilePath);
    } catch (err) {
      console.error('Error downloading file:', err);
      Alert.alert('Error', 'An error occurred while trying to view the file.');
    }
  };
  /**
   * Handles deleting files from Storage and Firestore
   * @param fileId - The ID of the file to be deleted
   * @param filePath - The path of the file to be deleted
   */
  const handleDeleteFile = async (fileId: string, filePath: string) => {
    try {
      const reference = storage().ref(filePath);
      await reference.delete();

      await firestore().collection('files').doc(fileId).delete();

      setFiles(files.filter(file => file.id !== fileId));

      Alert.alert('Success', 'File deleted successfully.');
    } catch (err) {
      console.error('Error deleting file:', err);
      Alert.alert('Error', 'An error occurred while trying to delete the file.');
    }
  };
  /**
   * Retrieves user information via email address
   * @param email - The email of the user
   * @returns - The user data or null
   */
  const getUserByEmail = async (email: string) => {
    const querySnapshot = await firestore().collection('Users').where('email', '==', email).get();
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  };
  /**
   * Handles sharing files
   * @param fileID - The ID of the file
   * @param filePath - The path of the file
   * @param encryptedKey - The encrypted AES key
   */
  const handleShareFile = async (fileId: string, filePath: string, encryptedKey: string) => {
    try {
      const recipient = await getUserByEmail(recipientEmail);
      if (!recipient) {
        Alert.alert('Error', 'Recipient not found.');
        return;
      }

      const keychainData = await Keychain.getGenericPassword();
      if (!keychainData) {
        throw new Error('No keys stored in keychain');
      }
      const { password: privateKey } = keychainData;
      const reference = storage().ref(filePath);
      const downloadUrl = await reference.getDownloadURL();
      const downloadFilePath = `${RNFS.DocumentDirectoryPath}/${filePath.split('/').pop()}`;
      await RNFS.downloadFile({ fromUrl: downloadUrl, toFile: downloadFilePath }).promise;

      const decryptedKey = decryptMetadata(encryptedKey);
      const parsedEncryptedKey = JSON.parse(decryptedKey);
      const decryptedFilePath = await decryptFile(downloadFilePath, privateKey, parsedEncryptedKey);
      const originalFilePath = decryptedFilePath.replace('.dec', '');
      await RNFS.moveFile(decryptedFilePath, originalFilePath);

      const uploadReference = storage().ref(`${recipient.email}/${filePath.split('/').pop()?.replace('.enc', '')}`);
      await uploadReference.putFile(originalFilePath);

      console.log('Adding to Firestore:', {
        fileName: filePath.split('/').pop() ?? '',
        filePath: uploadReference.fullPath ?? '',
        sharedBy: auth().currentUser?.uid ?? '',
        sharedAt: firestore.FieldValue.serverTimestamp(),
      });

      await firestore().collection('sharedFiles').add({
        fileName: filePath.split('/').pop()?.replace('.enc', '') ?? '',
        filePath: uploadReference.fullPath ?? '',
        sharedBy: auth().currentUser?.uid ?? '',
        sharedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'File shared successfully.');
    } catch (err) {
      console.error('Error sharing file:', err);
      Alert.alert('Error', 'An error occurred while trying to share the file.');
    }
  };
  /**
   * Handles encrypting files
   * @param fileId - The ID of the file
   * @param filePath - The path of the file
   */
  const handleEncryptFile = async (fileId: string, filePath: string) => {
    try {
      const keychainData = await Keychain.getGenericPassword();
      if (!keychainData) {
        throw new Error('No keys stored in keychain');
      }
      const { password: privateKey } = keychainData;
      const reference = storage().ref(filePath);
      const downloadUrl = await reference.getDownloadURL();
      const downloadFilePath = `${RNFS.DocumentDirectoryPath}/${filePath.split('/').pop()}`;
      await RNFS.downloadFile({ fromUrl: downloadUrl, toFile: downloadFilePath }).promise;
  
      if (downloadFilePath.endsWith('.enc')) {
        Alert.alert('Error', 'File is already encrypted.');
        return;
      }
  
      const user = auth().currentUser;
      const userIdPrefix = user?.uid.substring(0, 2) ?? 'xx'; 
      const newFileName = `${userIdPrefix}_${filePath.split('/').pop()}`; 
      const newFilePath = `${RNFS.DocumentDirectoryPath}/${newFileName}`;
  
      await RNFS.moveFile(downloadFilePath, newFilePath);
  
      const keyPair = generateKeyPair();
      await Keychain.setGenericPassword(fileId, keyPair.privateKey);
  
      const { encryptedFilePath, encryptedKey: newEncryptedKey } = await encryptFile(newFilePath, keyPair.publicKey);
  
      const uploadReference = storage().ref(`${newFileName}.enc`);
      await uploadReference.putFile(encryptedFilePath);
  
      const fileData = {
        userId: user?.uid ?? '',
        fileName: newFileName,
        filePath: uploadReference.fullPath ?? '',
        publicKey: keyPair.publicKey,
        encryptedKey: JSON.stringify(newEncryptedKey),
        uploadedAt: firestore.FieldValue.serverTimestamp(),
      };
  
      const fileDoc = await firestore().collection('files').doc(fileId).get();
      if (fileDoc.exists) {
        await firestore().collection('files').doc(fileId).update(fileData);
      } else {
        await firestore().collection('files').doc(fileId).set(fileData);
      }
  
      await reference.delete();
  
      Alert.alert('Success', 'File encrypted and stored successfully.');
      fetchFiles(); 
    } catch (err) {
      console.error('Error encrypting file:', err);
      Alert.alert('Error', 'An error occurred while trying to encrypt the file.');
    }
  };
  
  /**
   * Renders each file item from the list of files
   */
  const renderItem = ({ item }: { item: any }) => {
    const isRecipient = item.sharedBy && item.sharedBy !== auth().currentUser?.uid;
    const user = auth().currentUser;
    const userIdPrefix = user?.uid.substring(0, 2) ?? 'xx'; 
    const modifiedFileName = `${userIdPrefix}_${item.fileName}`; 
    return (
      <View style={styles.fileItem}>
        <Text>{modifiedFileName}</Text>
        {isRecipient ? (
          <Button title="Encrypt" onPress={() => handleEncryptFile(item.id, item.filePath)} />
        ) : (
          <>
            <TextInput
              placeholder="Recipient Email (optional)"
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              style={styles.input}
            />
            <Button title="View" onPress={() => handleViewFile(item.filePath, item.publicKey, item.encryptedKey, item.fileName)} />
            <Button title="Delete" onPress={() => handleDeleteFile(item.id, item.filePath)} />
            <Button title="Share" onPress={() => handleShareFile(item.id, item.filePath, item.encryptedKey)} />
          </>
        )}
      </View>
    );
  };
  

  return (
    <View style={styles.container}>
      <Button title="Refresh" onPress={onRefresh} />
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};
/**
 * Decrypts the metadata using AES-256-CBC
 * @param encryptedMetadata - The encrypted metadata
 * @returns - The decrypted metadata
 */
const decryptMetadata = (encryptedMetadata: string) => {
  const parsedData = JSON.parse(encryptedMetadata);
  const key = Buffer.from(parsedData.key, 'base64');
  const iv = Buffer.from(parsedData.iv, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(parsedData.data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  fileItem: {
    marginVertical: 10,
  },
  input: {
    height: 40,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

export default ViewFilesScreen;
