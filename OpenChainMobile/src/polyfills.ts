// React Native polyfills for Node.js modules
import 'react-native-get-random-values';
import { Buffer } from '@craftzdog/react-native-buffer';

// Make Buffer available globally
if (typeof global.Buffer === 'undefined') {
  // @ts-ignore - Buffer polyfill compatibility
  global.Buffer = Buffer;
}

// Polyfill for process
if (typeof global.process === 'undefined') {
  global.process = {
    env: {},
    version: '',
    platform: 'react-native',
  } as any;
}

// Polyfill for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
