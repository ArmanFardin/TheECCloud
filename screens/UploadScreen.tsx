import React, { useState } from 'react';
import { View, Button, StyleSheet, Text, Alert, FlatList } from 'react-native';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { generateKeyPair, encryptFile } from './utils/cryptoUtils';
import * as Keychain from 'react-native-keychain';
import auth from '@react-native-firebase/auth';
import RNFS from 'react-native-fs';
import { ProgressBar } from '@react-native-community/progress-bar-android';
import crypto from 'crypto';

type FileInfo = DocumentPickerResponse & {
  localUri: string;
};

type FileUploadProgress = {
  name: string;
  stage: string;
  progress: number;
};
/**
 * Upload screen allows users to select files, enrypt them and upload
 * to Firebase.
 */
const UploadScreen: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);

  /**
   * Opens the device file picker to allow users to select files
   */
  const handleSelectFiles = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      const filesWithLocalPath = await Promise.all(
        res.map(async (file: DocumentPickerResponse) => {
          const localFilePath = `${RNFS.TemporaryDirectoryPath}/${file.name}`;
          await RNFS.copyFile(file.uri, localFilePath);
          return { ...file, localUri: localFilePath };
        })
      );

      setFiles(filesWithLocalPath);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.error('Error selecting files:', err);
      }
    }
  };
  /**
   * Initiates the file upload process
   */
  const handleUploadFiles = async () => {
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        await uploadFile(files[i], setUploadProgress);
      }
      setCurrentFileIndex(null);
    }
  };
  /**
   * Renders the progress of each individual file upload
   */
  const renderItem = ({ item }: { item: FileUploadProgress }) => (
    <View style={styles.progressContainer}>
      <Text>{item.name} - {item.stage}</Text>
      <ProgressBar styleAttr="Horizontal" progress={item.progress / 100} indeterminate={false} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="Select Files" onPress={handleSelectFiles} />
      {files.length > 0 && <Button title="Upload Files" onPress={handleUploadFiles} />}
      <FlatList
        data={uploadProgress}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
      />
      {currentFileIndex !== null && (
        <Text>Uploading file {currentFileIndex + 1} of {files.length}</Text>
      )}
    </View>
  );
};
/**
 * Encrypts files and uploads them to Firebase
 * @param file - The file being uploaded
 * @param setUploadProgress - Updates the upload progress
 */
export const uploadFile = async (file: FileInfo, setUploadProgress: React.Dispatch<React.SetStateAction<FileUploadProgress[]>>) => {
  const fileName = file.name ?? 'unknown';
  const progress: FileUploadProgress = { name: fileName, stage: 'Encrypting', progress: 0 };
  setUploadProgress((prev) => [...prev, progress]);

  try {
    const keyPair = generateKeyPair();
    console.log('Generated Key Pair:', keyPair);

    await Keychain.setGenericPassword(fileName, keyPair.privateKey);

    const { encryptedFilePath, encryptedKey } = await encryptFile(file.localUri, keyPair.publicKey);
    console.log('Encrypted File Path:', encryptedFilePath);

    const uploadUri = encryptedFilePath;
    const reference = storage().ref(`${fileName}.enc`);

    const serializedEncryptedKey = JSON.stringify(encryptedKey);
    const encryptedSerializedKey = encryptMetadata(serializedEncryptedKey);

    const user = auth().currentUser;
    const metadata = {
      customMetadata: {
        userId: user?.uid ?? 'unknown',
        originalName: fileName,
      }
    };

    setUploadProgress((prev) =>
      prev.map((item) =>
        item.name === fileName ? { ...item, stage: 'Uploading', progress: 0 } : item
      )
    );

    const task = reference.putFile(uploadUri, metadata);

    task.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress((prev) =>
        prev.map((item) =>
          item.name === fileName ? { ...item, progress } : item
        )
      );
    });

    await task;

    console.log('File uploaded and encrypted successfully!');

    if (user) {
      console.log('Authenticated user:', user.uid);
      await firestore().collection('files').add({
        userId: user.uid,
        fileName: fileName,
        filePath: reference.fullPath,
        publicKey: keyPair.publicKey,
        encryptedKey: encryptedSerializedKey,
        uploadedAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('File metadata added to Firestore');
    }

    setUploadProgress((prev) =>
      prev.map((item) =>
        item.name === fileName ? { ...item, stage: 'Completed', progress: 100 } : item
      )
    );
  } catch (err) {
    console.error('Error uploading file:', err);
    setUploadProgress((prev) =>
      prev.map((item) =>
        item.name === fileName ? { ...item, stage: 'Failed' } : item
      )
    );
  }
};
/**
 * Encrypts the metadata using AES-256-CBC
 * @param data - The metadata getting encrypted
 * @returns - The encrypted metadata
 */
const encryptMetadata = (data: string) => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return JSON.stringify({ key: key.toString('base64'), iv: iv.toString('base64'), data: encrypted });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressContainer: {
    marginVertical: 10,
    width: '100%',
  },
});

export default UploadScreen;
