import Page from '@/components/page'
import Section from '@/components/section'
import React, { useContext, useState } from 'react';
import { RelayContext, KeyContext } from './_app';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils' // already an installed dependency


const Index = () => {
  const { relayUrls, setRelayUrls } = useContext(RelayContext);
  const { keys, activeKeyId, addKey, removeKey, setActiveKey, generateNewKey } = useContext(KeyContext);
  
  const [newRelayUrl, setNewRelayUrl] = useState('');
  const [newPrivateKey, setNewPrivateKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState<string | null>(null);

  // Function to add a new relay
  const addRelay = () => {
    if (newRelayUrl && !relayUrls.includes(newRelayUrl)) {
      setRelayUrls([...relayUrls, newRelayUrl]);
      setNewRelayUrl('');
    }
  };

  // Function to remove a relay
  const removeRelay = (urlToRemove: string) => {
    setRelayUrls(relayUrls.filter(url => url !== urlToRemove));
  };

  // Function to add new private key
  const handleAddKey = () => {
    if (newPrivateKey) {
      addKey(newPrivateKey, newKeyName || undefined);
      setNewPrivateKey('');
      setNewKeyName('');
    }
  };

  // Function to toggle visibility of a private key
  const toggleShowKey = (keyId: string) => {
    if (showPrivateKey === keyId) {
      setShowPrivateKey(null);
    } else {
      setShowPrivateKey(keyId);
    }
  };

  return (
    <Page>
      <Section>
        <h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
          Welcome to Objectify
        </h2>

        <div className='mt-2'>
          <p className='text-zinc-600 dark:text-zinc-400'>
            This is an open source project designed to allow a decentralized and permissionless exchange of objects.         
          </p>
        </div>
      </Section>

      {/* Key Management Section */}
      <Section>
        <h3 className='text-lg font-semibold text-zinc-800 dark:text-zinc-200'>
          Private Key Management
        </h3>
        
        {/* Add a new private key */}
        <div className='mt-4'>
          <h4 className='text-md font-semibold text-zinc-800 dark:text-zinc-200'>
            Add a Private Key:
          </h4>
          <div className='mt-2 grid gap-2'>
            <input 
              type="text" 
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key Name (optional)"
              className="w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
            />
            <div className='flex gap-2'>
              <input 
                type="password" 
                value={newPrivateKey}
                onChange={(e) => setNewPrivateKey(e.target.value)}
                placeholder="Enter private key"
                className="flex-grow p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
              />
              <button 
                onClick={handleAddKey}
                disabled={!newPrivateKey}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                Add
              </button>
            </div>
            <button 
              onClick={generateNewKey}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Generate New Key
            </button>
          </div>
        </div>
        
        {/* List and select from available keys */}
        <div className='mt-6'>
          <h4 className='text-md font-semibold text-zinc-800 dark:text-zinc-200'>
            Your Keys:
          </h4>
          {keys.length === 0 ? (
            <p className='mt-2 text-zinc-600 dark:text-zinc-400'>
              No keys added yet. Add or generate a key to get started.
            </p>
          ) : (
            <ul className='mt-2 space-y-3'>
              {keys.map((key) => (
                <li key={key.id} className='p-3 bg-zinc-100 dark:bg-zinc-800 rounded'>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-2'>
                      <input 
                        type="radio" 
                        id={`key-${key.id}`} 
                        name="activeKey" 
                        checked={activeKeyId === key.id}
                        onChange={() => setActiveKey(key.id)}
                        className="text-blue-500"
                      />
                      <label htmlFor={`key-${key.id}`} className='font-medium text-zinc-700 dark:text-zinc-300'>
                        {key.name}
                      </label>
                    </div>
                    <div className='flex gap-2'>
                      <button 
                        onClick={() => toggleShowKey(key.id)}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        {showPrivateKey === key.id ? 'Hide' : 'Show'}
                      </button>
                      <button 
                        onClick={() => removeKey(key.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {showPrivateKey === key.id && (
                    <div className='mt-2 p-2 bg-zinc-200 dark:bg-zinc-700 rounded overflow-x-auto'>
                      <code className='text-xs text-zinc-800 dark:text-zinc-200'>{bytesToHex(key.privateKey)}</code>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {/* Relay management section */}
      <Section>
        <h3 className='text-lg font-semibold text-zinc-800 dark:text-zinc-200'>
          Manage Relays
        </h3>
        
        {/* Add new relay */}
        <div className='mt-2 flex gap-2'>
          <input 
            type="text" 
            value={newRelayUrl}
            onChange={(e) => setNewRelayUrl(e.target.value)}
            placeholder="wss://relay.example.com"
            className="flex-grow p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
          />
          <button 
            onClick={addRelay}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>

        {/* Display current relays */}
        <div className='mt-4'>
          <h4 className='text-md font-semibold text-zinc-800 dark:text-zinc-200'>
            Connected Relays:
          </h4>
          <ul className='mt-2 space-y-2'>
            {relayUrls.map((url, index) => (
              <li key={index} className='flex justify-between items-center p-2 bg-zinc-100 dark:bg-zinc-800 rounded'>
                <span className='text-zinc-600 dark:text-zinc-400'>{url}</span>
                <button 
                  onClick={() => removeRelay(url)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </Page>
  )
}

export default Index