import { webcrypto } from 'crypto';
try {
  globalThis.crypto = webcrypto as any;
} catch (e) {
  // crypto is read-only in some environments
}
try {
  global.crypto = webcrypto as any;
} catch (e) {
  // crypto is read-only in some environments
}