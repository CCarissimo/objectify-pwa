import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import '@/styles/globals.css'
import { NDKProvider } from "@nostr-dev-kit/ndk-react";
import { createContext, useState, useEffect } from 'react';
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { useNDK } from '@nostr-dev-kit/ndk-react';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils' // already an installed dependency
import { Hexpubkey } from '@nostr-dev-kit/ndk';


// Interface for stored keys
interface StoredKey {
  id: string;
  name: string;
  privateKey: Uint8Array;
  privateKeyHex: string;
  publicKey: string;
  nsec: string;
  npub: string;
}

// Create contexts for relay and key management
export const RelayContext = createContext<{
  relayUrls: string[];
  setRelayUrls: (urls: string[]) => void;
}>({
  relayUrls: [],
  setRelayUrls: () => {},
});

export const KeyContext = createContext<{
  keys: StoredKey[];
  activeKeyId: string | null;
  addKey: (key: string, name?: string) => void;
  removeKey: (id: string) => void;
  setActiveKey: (id: string | null) => void;
  generateRandomKey: () => Uint8Array;
}>({
  keys: [],
  activeKeyId: null,
  addKey: () => {},
  removeKey: () => {},
  setActiveKey: () => {},
  generateRandomKey: () => {},
});

// Default relay URLs to use if none are found in localStorage
const DEFAULT_RELAY_URLS = [
  "wss://relay.damus.io",
  "wss://relay.snort.social",
  "wss://purplepag.es",
  "wss://nostr.wine"
];

// Function to generate a random nostr secret key
const generateRandomKey = () => {
	let sk = generateSecretKey() // `sk` is a Uint8Array
  return sk;
};

export default function App({ Component, pageProps }: AppProps) {
  // Initialize relay state
  const [relayUrls, setRelayUrls] = useState<string[]>([]);
  const [isRelaysLoaded, setIsRelaysLoaded] = useState(false);
  
  // Initialize key management state
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [isKeysLoaded, setIsKeysLoaded] = useState(false);

  // Load saved relay URLs from localStorage on initial render
  useEffect(() => {
    try {
      const savedRelays = localStorage.getItem('relayUrls');
      // Use saved relays if available, otherwise use defaults
      const initialRelays = savedRelays ? JSON.parse(savedRelays) : DEFAULT_RELAY_URLS;
      setRelayUrls(initialRelays);
    } catch (error) {
      // Fallback to defaults if there's an error
      console.error("Error loading saved relays:", error);
      setRelayUrls(DEFAULT_RELAY_URLS);
    }
    setIsRelaysLoaded(true);
  }, []);

  // Load saved keys from localStorage on initial render
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem('storedKeys');
      const activeKey = localStorage.getItem('activeKeyId');
      
      console.log(JSON.parse(savedKeys))
      console.log(activeKey)
      if (savedKeys) {
        setKeys(JSON.parse(savedKeys));
        console.log("saved keys")
        console.log(keys)
      }
      if (activeKey) {
        setActiveKeyId(activeKey);
        console.log("active key true")
        console.log(activeKeyId);
      }
    } catch (error) {
      console.error("Error loading saved keys:", error);
    }
    setIsKeysLoaded(true);
  }, []);

  // Save relay URLs to localStorage whenever they change
  useEffect(() => {
    if (isRelaysLoaded && relayUrls.length > 0) {
      localStorage.setItem('relayUrls', JSON.stringify(relayUrls));
    }
  }, [relayUrls, isRelaysLoaded]);

  // Save keys to localStorage whenever they change
  useEffect(() => {
    if (isKeysLoaded) {
      localStorage.setItem('storedKeys', JSON.stringify(keys));
    }
  }, [keys, isKeysLoaded]);

  // Save active key ID to localStorage whenever it changes
  useEffect(() => {
    if (isKeysLoaded && activeKeyId !== null) {
      localStorage.setItem('activeKeyId', activeKeyId);
    }
  }, [activeKeyId, isKeysLoaded]);

  // Custom function to update relay URLs
  const updateRelayUrls = (newUrls: string[]) => {
    setRelayUrls(newUrls);
  };

  // Function to add a new key
  const addKey = (privateKey: Uint8Array, privateKeyHex: string , nickname: string) => {
    // console.log(privateKey)
    // console.log(nickname)
    const publicKey = getPublicKey(privateKey);
    let nsec = nip19.nsecEncode(privateKey);
    let npub = nip19.npubEncode(publicKey);
    const id = Date.now().toString();
    
    const newKey: StoredKey = {
      id,
      name: nickname,
      privateKey,
      privateKeyHex,
      publicKey,
      nsec,
      npub,
    };
    
    setKeys(prevKeys => [...prevKeys, newKey]);
    
    // If this is the first key, make it active
    if (keys.length === 0) {
      setActiveKeyId(id);
    }
  };

  // Function to remove a key
  const removeKey = (id: string) => {
    setKeys(prevKeys => prevKeys.filter(key => key.id !== id));
    
    // If we're removing the active key, set active to null or the first available key
    if (activeKeyId === id) {
      const remainingKeys = keys.filter(key => key.id !== id);
      setActiveKeyId(remainingKeys.length > 0 ? remainingKeys[0].id : null);
    }
  };

  // Function to generate a new random key
  const generateNewKey = () => {
    const newPrivateKey = generateRandomKey();
	  const publicKey = getPublicKey(newPrivateKey);
    let nsec = nip19.nsecEncode(newPrivateKey);
    let skHex = bytesToHex(newPrivateKey)
    // let backToBytes = hexToBytes(skHex)
    
    // addKey(skHex, nsec, publicKey, nickname);
  };

  // Get the active private key for the NDK provider
  const getActiveKey = () => {
    if (!activeKeyId) return undefined;
    const activeKey = keys.find(key => key.id === activeKeyId);
    return activeKey?.privateKey;
  };

  const isLoaded = isRelaysLoaded && isKeysLoaded;

  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      disableTransitionOnChange
    >
      <RelayContext.Provider value={{ relayUrls, setRelayUrls: updateRelayUrls }}>
        <KeyContext.Provider value={{
          keys,
          activeKeyId,
          addKey,
          removeKey,
          setActiveKey: setActiveKeyId,
          generateRandomKey
        }}>
          {isLoaded && (
            <NDKProvider 
              relayUrls={relayUrls}
            >
              <Component {...pageProps} />
            </NDKProvider>
          )}
        </KeyContext.Provider>
      </RelayContext.Provider>
    </ThemeProvider>
  )
}