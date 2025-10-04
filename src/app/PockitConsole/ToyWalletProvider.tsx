import React, { useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { hexToBytes } from "viem";
import ToyWalletDebug from "./ToyWalletDebug";
import * as secp from '@noble/secp256k1';

// ==================== SIMPLE UTILITIES ====================
const toBase64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromBase64 = (s: string) => new Uint8Array(atob(s).split('').map(c => c.charCodeAt(0)));

function bytesToHex(bytes: Uint8Array): `0x${string}` {
    return ('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')) as `0x${string}`;
}

function formatAddressShort(addr?: string) {
    if (!addr || addr.length <= 12) return addr || '';
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatPublicKeyShort(pk?: string) {
    if (!pk || pk.length <= 24) return pk || '';
    return `${pk.slice(0, 10)}…${pk.slice(-6)}`;
}

// ==================== SIMPLE SEAL/UNSEAL ====================
async function sealMessage(
    message: string,
    recipientPublicKeyHex: string,
    senderPrivateKeyHex: `0x${string}`,
    usePrivacyMode: boolean
): Promise<string> {
    const recipientPubKey = hexToBytes(recipientPublicKeyHex.startsWith('0x') ? recipientPublicKeyHex as `0x${string}` : `0x${recipientPublicKeyHex}` as `0x${string}`);

    let senderPrivKey: Uint8Array;
    let senderPubKeyForEnvelope: Uint8Array;

    if (usePrivacyMode) {
        // Privacy mode: use ephemeral key
        senderPrivKey = hexToBytes(generatePrivateKey());
        senderPubKeyForEnvelope = new Uint8Array(secp.getPublicKey(senderPrivKey, false));
    } else {
        // Identity mode: use your actual key
        senderPrivKey = hexToBytes(senderPrivateKeyHex);
        senderPubKeyForEnvelope = new Uint8Array(secp.getPublicKey(senderPrivKey, false));
    }

    // Get shared secret
    const sharedSecret = secp.getSharedSecret(senderPrivKey, recipientPubKey, false);
    const sharedKey = sharedSecret[0] === 4 ? sharedSecret.slice(1, 33) : sharedSecret.slice(0, 32);

    // Derive AES key from shared secret
    const aesKey = await crypto.subtle.importKey(
        'raw',
        sharedKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    // Create IV from hash of shared key
    const ivHash = await crypto.subtle.digest('SHA-256', sharedKey);
    const iv = new Uint8Array(ivHash).slice(0, 12);

    // Encrypt message
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        new TextEncoder().encode(message)
    );

    // Return envelope with sender's public key and encrypted data
    return JSON.stringify({
        mode: usePrivacyMode ? 'privacy' : 'identity',
        senderPubKey: bytesToHex(senderPubKeyForEnvelope),
        data: toBase64(new Uint8Array(encrypted))
    });
}

async function unsealMessage(
    sealedMessage: string,
    myPrivateKeyHex: `0x${string}`
): Promise<string> {
    const envelope = JSON.parse(sealedMessage);
    const senderPubKey = hexToBytes(envelope.senderPubKey as `0x${string}`);
    const myPrivKey = hexToBytes(myPrivateKeyHex);

    // Get shared secret (same as sender calculated)
    const sharedSecret = secp.getSharedSecret(myPrivKey, senderPubKey, false);
    const sharedKey = sharedSecret[0] === 4 ? sharedSecret.slice(1, 33) : sharedSecret.slice(0, 32);

    // Derive same AES key
    const aesKey = await crypto.subtle.importKey(
        'raw',
        sharedKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    // Derive same IV
    const ivHash = await crypto.subtle.digest('SHA-256', sharedKey);
    const iv = new Uint8Array(ivHash).slice(0, 12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        fromBase64(envelope.data)
    );

    return new TextDecoder().decode(decrypted);
}

// ==================== SIMPLE STORAGE ====================
function saveKey(privateKeyHex: `0x${string}`, pin: string) {
    localStorage.setItem('wallet', JSON.stringify({
        key: privateKeyHex,
        pin: pin
    }));
}

function loadKey(pin: string): `0x${string}` | null {
    const stored = localStorage.getItem('wallet');
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (data.pin !== pin) return null;
    return data.key;
}

function keyExists(): boolean {
    return !!localStorage.getItem('wallet');
}

function removeKey() {
    localStorage.removeItem('wallet');
}

// ==================== MAIN COMPONENT ====================
function ToyWallet() {
    const [pin, setPin] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [privateKey, setPrivateKey] = useState<`0x${string}` | null>(null);
    const [address, setAddress] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [showPinInput, setShowPinInput] = useState(false);
    const [privacyMode, setPrivacyMode] = useState(false);
    const [error, setError] = useState('');

    // UI state
    const [message, setMessage] = useState('');
    const [targetPublicKey, setTargetPublicKey] = useState('');
    const [sealedMessage, setSealedMessage] = useState('');
    const [unsealedMessage, setUnsealedMessage] = useState('');
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(false);

    const unlock = () => {
        if (pin.length !== 4) {
            setError('Need 4-digit PIN');
            return;
        }

        setError('');
        let key = loadKey(pin);

        if (!key) {
            // Create new wallet
            key = generatePrivateKey();
            saveKey(key, pin);
        }

        const account = privateKeyToAccount(key);
        const pubKey = bytesToHex(new Uint8Array(secp.getPublicKey(hexToBytes(key), false)));

        setPrivateKey(key);
        setAddress(account.address);
        setPublicKey(pubKey);
        setTargetPublicKey(pubKey); // Default to self
        setUnlocked(true);
        setShowPinInput(false);
        setPin('');
    };

    const lock = () => {
        setPrivateKey(null);
        setAddress('');
        setPublicKey('');
        setUnlocked(false);
        setPin('');
        setShowPinInput(false);
        setMessage('');
        setSealedMessage('');
        setUnsealedMessage('');
    };

    const handleSeal = async () => {
        if (!unlocked || !privateKey || !message.trim()) {
            setError('Unlock wallet and enter a message');
            return;
        }
        if (!targetPublicKey) {
            setError('Enter target public key');
            return;
        }

        try {
            const sealed = await sealMessage(message, targetPublicKey, privateKey, privacyMode);
            setSealedMessage(sealed);
            setError('');
        } catch (err: any) {
            setError('Failed to seal: ' + err.message);
        }
    };

    const handleUnseal = async () => {
        if (!unlocked || !privateKey || !sealedMessage.trim()) {
            setError('Unlock wallet and enter sealed message');
            return;
        }

        try {
            const unsealed = await unsealMessage(sealedMessage, privateKey);
            setUnsealedMessage(unsealed);
            setError('');
        } catch (err: any) {
            setError('Failed to unseal: ' + err.message);
        }
    };

    const handleReset = () => {
        removeKey();
        lock();
    };

    const handlePinChange = (value: string) => {
        const sanitized = value.replace(/\D/g, '').slice(0, 4);
        setPin(sanitized);
        if (error) setError('');

        if (sanitized.length === 4) {
            setTimeout(() => {
                const tempPin = sanitized;
                setPin('');
                if (tempPin.length === 4) {
                    let key = loadKey(tempPin);
                    if (!key) {
                        key = generatePrivateKey();
                        saveKey(key, tempPin);
                    }
                    const account = privateKeyToAccount(key);
                    const pubKey = bytesToHex(new Uint8Array(secp.getPublicKey(hexToBytes(key), false)));
                    setPrivateKey(key);
                    setAddress(account.address);
                    setPublicKey(pubKey);
                    setTargetPublicKey(pubKey);
                    setUnlocked(true);
                    setShowPinInput(false);
                }
            }, 100);
        }
    };

    const copyAddress = async () => {
        if (!address) return;
        try {
            await navigator.clipboard.writeText(address);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        } catch { }
    };

    const copyPublicKey = async () => {
        if (!publicKey) return;
        try {
            await navigator.clipboard.writeText(publicKey);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        } catch { }
    };

    return (
        <div className="flex items-center justify-center relative">
            <div className={`bg-gray-800 rounded-full px-4 py-2 flex items-center space-x-3 min-w-0 ${showPinInput ? 'ring-2 ring-blue-400' : ''} transition-all`}>
                <button
                    onClick={() => {
                        if (unlocked) {
                            lock();
                        } else {
                            setShowPinInput(!showPinInput);
                            setPin('');
                            setError('');
                        }
                    }}
                    className="text-xl hover:scale-110 transition-transform cursor-pointer"
                    title={unlocked ? "Lock wallet" : "Unlock wallet"}
                >
                    {unlocked ? "🔓" : "🔒"}
                </button>

                {unlocked ? (
                    <>
                        <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className="text-lg hover:scale-110 transition-transform cursor-pointer"
                            title={privacyMode ? "Privacy mode: ephemeral key" : "Identity mode: your public key"}
                        >
                            {privacyMode ? "🥷" : "👤"}
                        </button>

                        <button
                            onClick={copyPublicKey}
                            className="text-white text-sm font-mono truncate max-w-64 hover:text-blue-300 transition-colors cursor-pointer"
                            title="Copy public key"
                        >
                            {copyFeedback ? 'Copied!' : formatPublicKeyShort(publicKey)}
                        </button>
                    </>
                ) : showPinInput ? (
                    <form
                        className="flex items-center space-x-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (pin.length === 4) unlock();
                        }}
                    >
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => handlePinChange(e.target.value)}
                            className="bg-transparent text-white text-center text-sm font-mono border border-gray-600 rounded px-2 py-1 w-16 focus:outline-none focus:border-blue-400"
                            maxLength={4}
                            placeholder="PIN"
                            autoFocus
                        />
                        {error && <span className="text-red-400 text-xs">❌</span>}
                    </form>
                ) : null}

                <button
                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                    className="text-white hover:text-blue-300 transition-colors cursor-pointer ml-2"
                    title="Toggle debug panel"
                >
                    ⚙️
                </button>
            </div>

            {showDebugPanel && (
                <ToyWalletDebug
                    walletState={{
                        unlocked,
                        account: address ? { address: address as `0x${string}` } : null,
                        pin: '',
                        showPinInput,
                        walletExists: keyExists()
                    }}
                    uiState={{
                        message,
                        signature: '',
                        error,
                        sealedMessage,
                        unsealedMessage,
                        targetPublicKey,
                        ourPublicKey: publicKey,
                        copyFeedback,
                        showDebugPanel,
                        privacyMode
                    }}
                    setUiState={(updater) => {
                        const newState = typeof updater === 'function'
                            ? updater({
                                message,
                                signature: '',
                                error,
                                sealedMessage,
                                unsealedMessage,
                                targetPublicKey,
                                ourPublicKey: publicKey,
                                copyFeedback,
                                showDebugPanel,
                                privacyMode
                            })
                            : updater;

                        setMessage(newState.message);
                        setError(newState.error);
                        setSealedMessage(newState.sealedMessage);
                        setUnsealedMessage(newState.unsealedMessage);
                        setTargetPublicKey(newState.targetPublicKey);
                        setCopyFeedback(newState.copyFeedback);
                        setShowDebugPanel(newState.showDebugPanel);
                        setPrivacyMode(newState.privacyMode);
                    }}
                    handleCopyAddress={copyAddress}
                    handleCopyPrivateKey={async () => {
                        if (!privateKey) return;
                        try {
                            const blob = new Blob([privateKey], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'pockit.key';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            setCopyFeedback(true);
                            setTimeout(() => setCopyFeedback(false), 2000);
                        } catch { }
                    }}
                    handleSignMessage={async () => {
                        setError('Sign message not implemented in simple version');
                    }}
                    handleCreateTestSeal={handleSeal}
                    handleUnsealMessage={handleUnseal}
                    handleFileSelect={async (file: File | null) => {
                        if (!file) return;
                        try {
                            const text = await file.text();
                            const key = text.trim();
                            if (!key.startsWith('0x') || key.length !== 66) throw new Error('Invalid format');
                            const newPin = prompt('Enter a 4-digit PIN:');
                            if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) throw new Error('Invalid PIN');
                            saveKey(key as `0x${string}`, newPin);
                            setError('');
                        } catch (err: any) {
                            setError(err.message);
                        }
                    }}
                    handleResetWallet={handleReset}
                />
            )}
        </div>
    );
}

export default ToyWallet;
