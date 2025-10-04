import { webcrypto } from 'crypto';
globalThis.crypto = webcrypto as any;
global.crypto = webcrypto as any;