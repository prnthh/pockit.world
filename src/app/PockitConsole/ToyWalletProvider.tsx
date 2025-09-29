import React, { useEffect, useState } from "react";
import { generatePrivateKey, privateKeyToAccount, signMessage } from "viem/accounts";
import { hexToBytes } from "viem";
import ToyWalletDebug from "./ToyWalletDebug";
import * as secp from '@noble/secp256k1';

const S = { ITER: 1_000_000, KEY: 256, IV: 16, PIN: 4 } as const;
const allowedOrigins = ['https://app.yourdomain.com', 'https://dashboard.anotherdomain.com', 'http://localhost:3000', window.location.origin];

const toBase64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromBase64 = (s: string) => new Uint8Array(atob(s).split('').map(c => c.charCodeAt(0)));

async function deriveKey(password: string) {
    // Intentionally do NOT use a salt: derive deterministically from the password alone.
    const emptySalt = new Uint8Array(0);
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: emptySalt as unknown as BufferSource, iterations: S.ITER, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: S.KEY }, false, ['encrypt', 'decrypt']);
}

interface EncryptedPrivateKey { iv: string; encrypted: string }
interface SecureAccount { address: `0x${string}` }

// ephemeral private key storage — never put this into React state or localStorage
// only keep bytes here and zero them on lock/unmount/reset
function zeroBytes(b: Uint8Array | null) {
    if (!b) return;
    for (let i = 0; i < b.length; i++) b[i] = 0;
}

function bytesToHex(bytes: Uint8Array) {
    return '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function formatAddressShort(addr?: string) {
    if (!addr) return '';
    // common short format: first 6 (0x + 4 chars) and last 4
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatPublicKeyShort(pk?: string) {
    if (!pk) return '';
    // common short display for long pubkeys: keep first 10 and last 6
    if (pk.length <= 24) return pk;
    return `${pk.slice(0, 10)}…${pk.slice(-6)}`;
}

async function encryptPrivateKey(pk: `0x${string}`, pwd: string): Promise<EncryptedPrivateKey> {
    // Deterministically derive IV from the corresponding public key so the
    // IV is bound to the account. This replaces the previous random-IV
    // approach for stored wallets. We still store the IV in the payload for
    // compatibility and ease of future migrations.
    // No salt per request; derive key deterministically from password alone
    const key = await deriveKey(pwd);

    // Derive public key from the provided private key and hash it to obtain
    // an IV of the configured length. Use the uncompressed secp256k1 public
    // key so the IV is stable and unique per account.
    const privBytes = hexToBytes(pk as `0x${string}`);
    const pubUncompressed = secp.getPublicKey(privBytes, false); // 65 bytes (0x04 | X | Y)
    const pubHash = new Uint8Array(await crypto.subtle.digest('SHA-256', toArrayBufferView(new Uint8Array(pubUncompressed))));
    const iv = pubHash.slice(0, S.IV);

    const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, key, new TextEncoder().encode(pk));
    return { iv: toBase64(iv), encrypted: toBase64(new Uint8Array(enc)) };
}

async function decryptPrivateKey({ iv, encrypted }: EncryptedPrivateKey, pwd: string): Promise<Uint8Array> {
    const i = fromBase64(iv), e = fromBase64(encrypted);
    const key = await deriveKey(pwd);
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: i as unknown as BufferSource }, key, e as unknown as BufferSource);
    const str = new TextDecoder().decode(dec);
    if (!str.startsWith('0x') || str.length !== 66) throw new Error('Invalid private key format');
    // convert to bytes and return
    const bytes = hexToBytes(str as `0x${string}`);
    return bytes;
}

function getPublicAddressFromBytes(pkBytes: Uint8Array) { return privateKeyToAccount(bytesToHex(pkBytes) as `0x${string}`).address }

// No legacy sealing. Use static ECDH for deterministic shared-secret derivation.

function toArrayBufferView(u: Uint8Array) {
    // Return a real ArrayBuffer (not SharedArrayBuffer) containing a copy of the bytes
    // to satisfy WebCrypto's BufferSource expectation and avoid SharedArrayBuffer types.
    return (new Uint8Array(u)).buffer as ArrayBuffer;
}

// Ephemeral sealing is used below. Static ECDH-based sealing was removed in favor
// of ephemeral sender keys which produce one-time shared secrets per message.

// --- ECIES-style sealing using X25519/secp256k1 ECDH via noble/secp256k1 + HKDF + AES-GCM ---
async function deriveAesKeyFromSharedSecret(sharedSecret: Uint8Array) {
    // Use HKDF-SHA256 to derive a 256-bit AES-GCM key from the shared secret.
    // We intentionally do NOT use an external salt — the shared secret alone
    // is the input to HKDF. Use an empty salt so both sides derive the same key
    // deterministically from the ECDH shared secret.
    const sharedBuf = toArrayBufferView(sharedSecret);
    const emptySalt = toArrayBufferView(new Uint8Array(0));
    const baseKey = await crypto.subtle.importKey('raw', sharedBuf, 'HKDF', false, ['deriveKey']);
    const derived = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: emptySalt, info: new Uint8Array(0) }, baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return derived as CryptoKey;
}

function normalizeHexKey(hex: string) {
    if (hex.startsWith('0x')) return hex.slice(2);
    return hex;
}

// Simple helper: generate a viem-compatible private key and corresponding
// uncompressed secp256k1 public key (0x04 + X + Y). This uses viem's
// generatePrivateKey for the private key and noble/secp256k1 for the pubkey.
async function generateKeypair(): Promise<{ privateKey: `0x${string}`, publicKey: string }> {
    const priv = generatePrivateKey(); // 0x-prefixed hex
    const privBytes = hexToBytes(priv as `0x${string}`);
    const pub = secp.getPublicKey(privBytes, false); // uncompressed
    return { privateKey: priv as `0x${string}`, publicKey: bytesToHex(new Uint8Array(pub)) };
}

// Static ECDH-based sealing: sender uses their private key and recipient public key to derive a shared secret deterministically.
async function sealWithPublicKeyECIES(msg: string, recipientPublicKeyHex: string, senderPrivBytes: Uint8Array) {
    const recipientPubHex = normalizeHexKey(recipientPublicKeyHex);
    const recipientPubBytes = hexToBytes(('0x' + recipientPubHex) as `0x${string}`);

    // Compute sender public key (uncompressed) to include in envelope
    const senderPub = secp.getPublicKey(senderPrivBytes, false); // 65 bytes (0x04 | X | Y)

    // Compute shared secret (static ECDH). Request uncompressed output so we can strip leading 0x04
    const shared = secp.getSharedSecret(senderPrivBytes, recipientPubBytes, false);
    const sharedRaw = shared[0] === 4 ? shared.slice(1) : shared;

    const aesKey = await deriveAesKeyFromSharedSecret(sharedRaw);
    const ivHash = new Uint8Array(await crypto.subtle.digest('SHA-256', toArrayBufferView(sharedRaw)));
    const iv = ivHash.slice(0, 12);

    const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, aesKey, new TextEncoder().encode(msg));

    return JSON.stringify({
        type: 'ecies',
        // include our uncompressed public key so the recipient can perform the same ECDH
        senderPublicKey: bytesToHex(new Uint8Array(senderPub)),
        data: toBase64(new Uint8Array(enc)),
    } as any);
}

async function unsealWithPrivateKeyECIES(sealed: string, pkBytes: Uint8Array) {
    const d = JSON.parse(sealed) as { type?: string; senderPublicKey?: string; data?: string };
    if (d.type !== 'ecies') throw new Error('Not an ECIES envelope');
    if (!d.senderPublicKey || !d.data) throw new Error('Malformed envelope');

    const senderPubHex = normalizeHexKey(d.senderPublicKey);
    const senderPubBytes = hexToBytes(('0x' + senderPubHex) as `0x${string}`);

    const shared = secp.getSharedSecret(pkBytes, senderPubBytes, false);
    const sharedRaw = shared[0] === 4 ? shared.slice(1) : shared;

    const aesKey = await deriveAesKeyFromSharedSecret(sharedRaw);
    const ivHash = new Uint8Array(await crypto.subtle.digest('SHA-256', toArrayBufferView(sharedRaw)));
    const iv = ivHash.slice(0, 12);

    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as unknown as BufferSource }, aesKey, fromBase64(d.data) as unknown as BufferSource);
    return new TextDecoder().decode(dec);
}

// Simple user-facing API: encrypt with recipient public key (requires sender private key), decrypt with recipient private key.
async function encryptWithPublicKey(message: string, recipientPublicKeyHex: string, senderPrivHex: `0x${string}`) {
    if (!senderPrivHex) throw new Error('senderPrivHex required for static ECDH');
    const senderPrivBytes = hexToBytes(senderPrivHex as `0x${string}`);
    return await sealWithPublicKeyECIES(message, recipientPublicKeyHex, senderPrivBytes);
}

// Decrypt: only support static ECIES envelopes (type 'ecies').
async function decryptWithPrivateKey(sealed: string, recipientPrivHex: `0x${string}`) {
    const parsed = JSON.parse(sealed) as { type?: string };
    if (parsed.type !== 'ecies') throw new Error('Unsupported envelope type');
    const recipBytes = hexToBytes(recipientPrivHex as `0x${string}`);
    return await unsealWithPrivateKeyECIES(sealed, recipBytes);
}

function ToyWallet() {
    // Consolidated wallet state to prevent inconsistencies
    const [walletState, setWalletState] = useState({
        pin: '',
        unlocked: false,
        account: null as SecureAccount | null,
        showPinInput: false,
        walletExists: false,
    });

    // UI state (non-sensitive, can be separate)
    const [uiState, setUiState] = useState({
        message: '',
        signature: '',
        error: '',
        sealedMessage: '',
        unsealedMessage: '',
        targetPublicKey: '',
        ourPublicKey: '',
        copyFeedback: false,
        showDebugPanel: false,
    });

    // Memoized wallet existence check
    // ephemeral private key bytes ref — never serialize this
    const privateKeyRef = React.useRef<Uint8Array | null>(null);

    const checkWalletExists = React.useCallback(() => {
        const stored = localStorage.getItem('encryptedWallet');
        return !!stored;
    }, []);

    // Check if wallet exists and clear sensitive data on unmount
    useEffect(() => {
        const exists = checkWalletExists();
        setWalletState(prev => ({ ...prev, walletExists: exists }));

        // ephemeral storage for private key bytes — not in state (use outer ref)

        return () => {
            // Clear all sensitive data on unmount
            setWalletState({
                pin: '',
                unlocked: false,
                account: null,
                showPinInput: false,
                walletExists: exists, // Keep this for UI consistency
            });
            setUiState(prev => ({
                ...prev,
                message: '',
                signature: '',
                error: '',
                sealedMessage: '',
                unsealedMessage: '',
                targetPublicKey: prev.targetPublicKey || '',
                ourPublicKey: '',
            }));
            // zero any private key bytes left in memory
            zeroBytes(privateKeyRef.current);
            privateKeyRef.current = null;
        };
    }, [checkWalletExists]);

    // Handle incoming postMessage
    useEffect(() => {
        interface PostMessageData {
            action: 'getAddress' | 'signMessage' | 'unsealMessage' | 'sealMessage';
            data?: {
                message?: string;
                sealedMessage?: string;
                targetAddress?: string; // legacy, not used for secure sealing
                targetPublicKey?: string; // hex public key for ECIES
            };
        }

        interface PostMessageResponse {
            type: 'response';
            result?: {
                address?: string;
                signature?: string;
                unsealedMessage?: string;
                sealedMessage?: string;
            };
            error?: string;
        }

        const handleMessage = async (event: MessageEvent<PostMessageData>) => {
            if (!allowedOrigins.includes(event.origin)) return;
            const { action, data } = event.data;
            if (!walletState.unlocked || !walletState.account) return (event.source as WindowProxy)?.postMessage({ type: 'response', error: 'Wallet not unlocked' } as PostMessageResponse, event.origin);
            try {
                if (action === 'getAddress') return (event.source as WindowProxy)?.postMessage({ type: 'response', result: { address: walletState.account.address } } as PostMessageResponse, event.origin);
                if (action === 'signMessage') { if (!data?.message) throw new Error('Message required'); if (!privateKeyRef.current) throw new Error('Private key not available'); const signature = await signMessage({ privateKey: bytesToHex(privateKeyRef.current) as `0x${string}`, message: data.message }); return (event.source as WindowProxy)?.postMessage({ type: 'response', result: { signature } } as PostMessageResponse, event.origin); }
                if (action === 'sealMessage') {
                    if (!data?.message) throw new Error('Message required');
                    // Secure sealing requires a target public key (ECIES).
                    const targetPub = data.targetPublicKey;
                    if (!targetPub) throw new Error('targetPublicKey required for secure sealing');
                    // Use static ECDH with our wallet private key as sender
                    if (!privateKeyRef.current) throw new Error('Private key not available for sealing');
                    const senderPrivHex = bytesToHex(privateKeyRef.current) as `0x${string}`;
                    const sealed = await encryptWithPublicKey(data.message, targetPub, senderPrivHex);
                    return (event.source as WindowProxy)?.postMessage({ type: 'response', result: { sealedMessage: sealed } } as PostMessageResponse, event.origin);
                }
                if (action === 'unsealMessage') { if (!data?.sealedMessage) throw new Error('Sealed message required'); if (!privateKeyRef.current) throw new Error('Private key not available'); const privHex = bytesToHex(privateKeyRef.current) as `0x${string}`; const unsealed = await decryptWithPrivateKey(data.sealedMessage, privHex); return (event.source as WindowProxy)?.postMessage({ type: 'response', result: { unsealedMessage: unsealed } } as PostMessageResponse, event.origin); }
            } catch (err: any) { (event.source as WindowProxy)?.postMessage({ type: 'response', error: err.message } as PostMessageResponse, event.origin); }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [walletState.unlocked, walletState.account]);

    // Simplified wallet unlock/creation
    const handleUnlock = async (pinToUse?: string) => {
        const currentPin = pinToUse || walletState.pin;

        if (!currentPin || currentPin.length !== 4) {
            setUiState(prev => ({ ...prev, error: 'Need 4-digit PIN' }));
            return;
        }

        setUiState(prev => ({ ...prev, error: '' }));

        try {
            // Check if generatePrivateKey function exists
            if (typeof generatePrivateKey !== 'function') {
                setUiState(prev => ({ ...prev, error: 'Import error' }));
                return;
            }

            let privateKeyHex: `0x${string}` | undefined;
            let privateKeyBytes: Uint8Array | null = null;

            // Check if wallet exists in storage
            const storedWallet = localStorage.getItem('encryptedWallet');

            if (storedWallet) {
                // Try to decrypt existing wallet
                try {
                    const encryptedData = JSON.parse(storedWallet);
                    privateKeyBytes = await decryptPrivateKey(encryptedData, currentPin);
                    // store bytes in ephemeral ref
                    zeroBytes(privateKeyRef.current);
                    privateKeyRef.current = privateKeyBytes;
                    privateKeyHex = bytesToHex(privateKeyBytes) as `0x${string}`;
                } catch (decryptError) {
                    setUiState(prev => ({ ...prev, error: 'Wrong PIN' }));
                    return;
                }
            } else {
                // Create new wallet
                privateKeyHex = generatePrivateKey();
                // convert to bytes and place in ephemeral ref
                const b = hexToBytes(privateKeyHex);
                zeroBytes(privateKeyRef.current);
                privateKeyRef.current = b;

                // Encrypt and save the new wallet
                try {
                    const encryptedWallet = await encryptPrivateKey(privateKeyHex!, currentPin);
                    localStorage.setItem('encryptedWallet', JSON.stringify(encryptedWallet));
                    setWalletState(prev => ({ ...prev, walletExists: true }));
                } catch (encryptError) {
                    setUiState(prev => ({ ...prev, error: 'Failed to save wallet' }));
                    return;
                }
            }

            const viemAccount = privateKeyToAccount((privateKeyHex ?? bytesToHex(privateKeyBytes!)) as `0x${string}`);

            const simpleAccount = {
                address: viemAccount.address,
            };

            setWalletState(prev => ({
                ...prev,
                account: simpleAccount,
                unlocked: true,
                showPinInput: false,
                pin: '',
            }));

            // Auto-fill the debug panel's target public key with our own public key (useful for tests)
            try {
                if (privateKeyRef.current) {
                    const ourPub = bytesToHex(new Uint8Array(secp.getPublicKey(privateKeyRef.current, false)));
                    setUiState(prev => ({ ...prev, targetPublicKey: ourPub, ourPublicKey: ourPub }));
                }
            } catch {
                // ignore if public key derivation fails
            }

        } catch (err) {
            setUiState(prev => ({ ...prev, error: 'Unlock failed' }));
        }
    };

    // Enhanced message signing with validation
    const handleSignMessage = async () => {
        if (!walletState.unlocked || !walletState.account || !uiState.message.trim()) {
            setUiState(prev => ({ ...prev, error: 'Unlock wallet and enter a message' }));
            return;
        }

        try {
            if (!privateKeyRef.current) throw new Error('Private key not available');
            const sig = await signMessage({ privateKey: bytesToHex(privateKeyRef.current) as `0x${string}`, message: uiState.message.trim() });
            setUiState(prev => ({ ...prev, signature: sig, error: '' }));
        } catch (err: any) {
            setUiState(prev => ({ ...prev, error: 'Failed to sign message' }));
        }
    };

    // Unseal/decrypt a message using the wallet's private key
    const handleUnsealMessage = async () => {
        if (!walletState.unlocked || !walletState.account || !uiState.sealedMessage.trim()) {
            setUiState(prev => ({ ...prev, error: 'Unlock wallet and enter a sealed message' }));
            return;
        }

        try {
            if (!privateKeyRef.current) throw new Error('Private key not available');
            const privHex = bytesToHex(privateKeyRef.current) as `0x${string}`;
            const unsealed = await decryptWithPrivateKey(uiState.sealedMessage, privHex);
            setUiState(prev => ({ ...prev, unsealedMessage: String(unsealed), error: '' }));
        } catch (err: any) {
            setUiState(prev => ({ ...prev, error: 'Failed to unseal message: ' + err.message, unsealedMessage: '' }));
        }
    };

    // Create a test sealed message (base64 encoded for testing)
    const handleCreateTestSeal = async () => {
        if (!walletState.unlocked || !walletState.account || !uiState.message.trim()) {
            setUiState(prev => ({ ...prev, error: 'Unlock wallet and enter a message to seal first' }));
            return;
        }

        if (!uiState.targetPublicKey) {
            setUiState(prev => ({ ...prev, error: 'Target public key required for secure sealing' }));
            return;
        }

        try {
            if (!privateKeyRef.current) throw new Error('Private key not available for sealing');
            const senderPrivHex = bytesToHex(privateKeyRef.current) as `0x${string}`;
            const sealed = await encryptWithPublicKey(uiState.message.trim(), uiState.targetPublicKey, senderPrivHex);
            setUiState(prev => ({ ...prev, sealedMessage: sealed, error: '' }));
        } catch (err: any) {
            setUiState(prev => ({ ...prev, error: 'Failed to create seal: ' + err.message }));
        }
    };

    // Lock wallet and clear sensitive data
    const handleLock = () => {
        setWalletState(prev => ({
            ...prev,
            unlocked: false,
            account: null,
            pin: '',
            showPinInput: false,
        }));
        setUiState(prev => ({
            ...prev,
            message: '',
            signature: '',
            error: '',
            sealedMessage: '',
            unsealedMessage: '',
            ourPublicKey: '',
        }));
        // zero and clear ephemeral private key
        zeroBytes(privateKeyRef.current);
        privateKeyRef.current = null;
    };

    // Reset wallet - clear all data and start fresh
    const handleResetWallet = () => {
        localStorage.removeItem('encryptedWallet');
        setWalletState({
            pin: '',
            unlocked: false,
            account: null,
            showPinInput: false,
            walletExists: false,
        });
        setUiState({
            message: '',
            signature: '',
            error: '',
            sealedMessage: '',
            unsealedMessage: '',
            targetPublicKey: '',
            ourPublicKey: '',
            copyFeedback: false,
            showDebugPanel: false,
        });
        // zero and clear ephemeral private key
        zeroBytes(privateKeyRef.current);
        privateKeyRef.current = null;
    };

    // Auto-import private key from file when selected
    const handleFileSelect = async (file: File | null) => {
        if (!file) {
            return;
        }

        try {
            const privateKeyText = await file.text();
            const trimmedKey = privateKeyText.trim();

            // Validate private key format
            if (!trimmedKey.startsWith('0x') || trimmedKey.length !== 66) {
                setUiState(prev => ({ ...prev, error: 'Invalid private key format in file' }));
                // Clear the file input
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                return;
            }

            // Validate it's a valid hex string
            try {
                hexToBytes(trimmedKey as `0x${string}`);
            } catch {
                setUiState(prev => ({ ...prev, error: 'Invalid hex format in file' }));
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                return;
            }

            // Create account to verify it's valid
            try {
                privateKeyToAccount(trimmedKey as `0x${string}`);
            } catch {
                setUiState(prev => ({ ...prev, error: 'Invalid private key in file' }));
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                return;
            }

            // Ask for PIN to encrypt the imported key
            const pinForImport = prompt('Enter a 4-digit PIN to encrypt the imported private key:');
            if (!pinForImport || pinForImport.length !== 4 || !/^\d{4}$/.test(pinForImport)) {
                setUiState(prev => ({ ...prev, error: 'Valid 4-digit PIN required' }));
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                return;
            }

            // Encrypt and save the imported wallet
            const encryptedWallet = await encryptPrivateKey(trimmedKey as `0x${string}`, pinForImport);
            localStorage.setItem('encryptedWallet', JSON.stringify(encryptedWallet));
            setWalletState(prev => ({ ...prev, walletExists: true }));
            setUiState(prev => ({ ...prev, error: '' }));

            // Clear the file input
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            // Automatically unlock the wallet with the PIN that was just set
            handleUnlock(pinForImport);

        } catch (err) {
            setUiState(prev => ({ ...prev, error: 'Failed to read or process file' }));
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    // Copy address to clipboard
    const handleCopyAddress = async () => {
        if (walletState.account?.address) {
            try {
                await navigator.clipboard.writeText(walletState.account.address);
                setUiState(prev => ({ ...prev, copyFeedback: true }));
                setTimeout(() => setUiState(prev => ({ ...prev, copyFeedback: false })), 2000);
            } catch (err) {
                console.error('Failed to copy address:', err);
            }
        }
    };

    // Download private key as file (debug only)
    const handleCopyPrivateKey = async () => {
        if (walletState.unlocked && privateKeyRef.current) {
            try {
                const hex = bytesToHex(privateKeyRef.current);
                const blob = new Blob([hex], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'pockit.key';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                setUiState(prev => ({ ...prev, copyFeedback: true }));
                setTimeout(() => setUiState(prev => ({ ...prev, copyFeedback: false })), 2000);
            } catch (err) {
                console.error('Failed to download private key:', err);
                setUiState(prev => ({ ...prev, error: 'Failed to download private key' }));
            }
        }
    };

    // Handle PIN input changes and auto-submit on 4 digits
    const handlePinChange = (value: string) => {
        // Only allow digits and max 4 characters
        const sanitized = value.replace(/\D/g, '').slice(0, 4);
        setWalletState(prev => ({ ...prev, pin: sanitized }));

        // Clear errors immediately on input
        if (uiState.error) setUiState(prev => ({ ...prev, error: '' }));

        // Auto-submit when 4 digits are entered
        if (sanitized.length === 4) {
            setTimeout(() => {
                handleUnlock(sanitized); // Pass the sanitized PIN directly
            }, 100); // Small delay for better UX
        }
    };

    // Optimized toggle function with state batching
    const togglePinInput = () => {
        if (walletState.unlocked) {
            handleLock();
        } else {
            setWalletState(prev => ({ ...prev, showPinInput: !prev.showPinInput }));
            if (uiState.error) setUiState(prev => ({ ...prev, error: '' }));
            if (walletState.pin) setWalletState(prev => ({ ...prev, pin: '' }));
        }
    };

    return (
        <div className="flex items-center justify-center relative">
            {/* Single Pill Design */}
            <div className={`bg-gray-800 rounded-full px-4 py-2 flex items-center space-x-3 min-w-0 ${walletState.showPinInput ? 'ring-2 ring-blue-400' : ''} transition-all`}>
                {/* Wallet State Icon */}
                <button
                    onClick={togglePinInput}
                    className="text-xl hover:scale-110 transition-transform cursor-pointer"
                    title={walletState.unlocked ? "Lock wallet" : "Unlock wallet"}
                >
                    {walletState.unlocked ? "🔓" : "🔒"}
                </button>

                {/* Content based on state */}
                {walletState.unlocked ? (
                    // Unlocked state - show public key (full) and allow copy
                    <button
                        onClick={async () => {
                            try {
                                const toCopy = uiState.ourPublicKey || walletState.account?.address || '';
                                if (!toCopy) return;
                                await navigator.clipboard.writeText(toCopy);
                                setUiState(prev => ({ ...prev, copyFeedback: true }));
                                setTimeout(() => setUiState(prev => ({ ...prev, copyFeedback: false })), 2000);
                            } catch (e) { /* ignore */ }
                        }}
                        className="text-white text-sm font-mono truncate max-w-64 hover:text-blue-300 transition-colors cursor-pointer"
                        title={uiState.ourPublicKey ? 'Click to copy full public key' : 'Click to copy address'}
                    >
                        {uiState.copyFeedback ? 'Copied!' : (uiState.ourPublicKey ? formatPublicKeyShort(uiState.ourPublicKey) : `id: ${formatAddressShort(walletState.account?.address)}`)}
                    </button>
                ) : walletState.showPinInput ? (
                    // PIN input state
                    <form
                        className="flex items-center space-x-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (walletState.pin.length === 4) {
                                handleUnlock();
                            }
                        }}
                    >
                        <input
                            type="password"
                            value={walletState.pin}
                            onChange={(e) => handlePinChange(e.target.value)}
                            className="bg-transparent text-white text-center text-sm font-mono border border-gray-600 rounded px-2 py-1 w-16 focus:outline-none focus:border-blue-400"
                            maxLength={4}
                            placeholder="Enter PIN or Create PIN"
                            autoFocus
                            autoComplete="new-password"
                        />
                        {uiState.error && (
                            <span className="text-red-400 text-xs">❌</span>
                        )}
                    </form>
                ) : (
                    // Default state - just the lock icon
                    <></>
                )}

                {/* Settings Icon for Debug Panel */}
                {process.env.NODE_ENV === 'development' && (
                    <button
                        onClick={() => setUiState(prev => ({ ...prev, showDebugPanel: !prev.showDebugPanel }))}
                        className="text-white hover:text-blue-300 transition-colors cursor-pointer ml-2"
                        title="Toggle debug panel"
                    >
                        ⚙️
                    </button>
                )}
            </div>

            {/* Debug/Development Panel - Palantir-style dense horizontal layout */}
            {process.env.NODE_ENV === 'development' && uiState.showDebugPanel && (
                <ToyWalletDebug
                    walletState={walletState}
                    uiState={uiState}
                    setUiState={setUiState}
                    handleCopyAddress={handleCopyAddress}
                    handleCopyPrivateKey={handleCopyPrivateKey}
                    handleSignMessage={handleSignMessage}
                    handleCreateTestSeal={handleCreateTestSeal}
                    handleUnsealMessage={handleUnsealMessage}
                    handleFileSelect={handleFileSelect}
                    handleResetWallet={handleResetWallet}
                />
            )}
        </div>
    );
}

// Export the component as default
export default ToyWallet;

// Export a provider version that can be used in React contexts
export { ToyWallet };
// Expose simple key utilities: generate a keypair and ephemeral ECIES helpers
export { generateKeypair, sealWithPublicKeyECIES, unsealWithPrivateKeyECIES, encryptWithPublicKey, decryptWithPrivateKey };
