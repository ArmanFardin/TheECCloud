// Enter.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Modal } from 'react-native';

const Enter = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [people, setPeople] = useState('');
  const [showModal, setShowModal] = useState(false);

  const enter = () => {
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={setFrom}
        value={from}
        placeholder="Leaving from"
      />
      <TextInput
        style={styles.input}
        onChangeText={setTo}
        value={to}
        placeholder="Going to"
      />
      <TextInput
        style={styles.input}
        onChangeText={setPeople}
        value={people}
        placeholder="People"
        keyboardType="number-pad"
      />
      <Button
        title="Enter"
        onPress={enter}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Trip Details:</Text>
          <Text>From: {from}</Text>
          <Text>To: {to}</Text>
          <Text>People: {people}</Text>
          <Button title="Close" onPress={() => setShowModal(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: '80%',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Enter;
