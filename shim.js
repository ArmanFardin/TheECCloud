// Import necessary polyfills and modules to ensure compatibility in React Native environment
import 'react-native-get-random-values'; // Ensures the global 'crypto.getRandomValues' function is available in React Native
import 'react-native-url-polyfill/auto'; // Ensures the global 'URL' and 'URLSearchParams' classes are available in React Native

import { Buffer } from 'buffer'; // Import the 'Buffer' class from the 'buffer' module for binary data handling
import { randomBytes } from 'react-native-randombytes'; // Import 'randomBytes' function for generating cryptographically secure random bytes

// Assign 'Buffer' to global scope to ensure it's available globally
global.Buffer = Buffer;

/**
 * Polyfill for the 'crypto' module's 'getRandomValues' method.
 * Generates cryptographically secure random values.
 * 
 * @param {Uint8Array} byteArray - The array to populate with random values.
 * @throws {Error} - If more than 65536 random bytes are requested.
 */
global.crypto = {
  getRandomValues: (byteArray) => {
    if (byteArray.length > 65536) {
      throw new Error('Requested too many random bytes');
    }
    const randomBytesArray = randomBytes(byteArray.length); // Generate random bytes
    byteArray.set(randomBytesArray); // Populate the byte array with random values
  },
};

// Polyfills to ensure compatibility with Node.js modules in React Native
global.process = require('process'); // Ensures the 'process' global is available, typically used for process-related information
global.stream = require('stream-browserify'); // Ensures the 'stream' global is available, used for stream handling
global.assert = require('assert'); // Ensures the 'assert' global is available, used for assertions in code
global.events = require('events'); // Ensures the 'events' global is available, used for event handling
