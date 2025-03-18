import React, { useState, useEffect } from 'react';
import { finalizeEvent, verifyEvent } from 'nostr-tools/pure';
import { nip19, type NostrEvent } from "nostr-tools"


// Props interface
interface NostrImageUploaderProps {
  imageData: string; // base64 image data from camera capture
  pubkey: string; // user's public key for authentication
  privateKey: Uint8Array; // user's private key for signing the upload request
  onComplete: (success: boolean, data?: any, error?: string) => void;
}

// Define the type for tags (arrays of strings)
type Tag = string[];

// // Define the event interface
// interface NostrEvent {
//     kind: number;
//     created_at: number;
//     tags: Tag[];
//     content: string;
//   }

// Supported upload servers
const UPLOAD_SERVERS = [
  {
    name: 'nostr.download',
    wellKnownUrl: 'https://nostr.download/.well-known/nostr/nip96.json'
  },
  {
    name: 'blossom.primal.net',
    wellKnownUrl: 'https://blossom.primal.net/.well-known/nostr/nip96.json'
  }
];

// Main component
const NostrImageUploader: React.FC<NostrImageUploaderProps> = ({ 
  imageData, 
  pubkey,
  privateKey,
  onComplete 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [blossomResponse, setBlossomResponse] = useState<string>('');

  // Convert base64 to blob
  const dataURItoBlob = (dataURI: string): Blob => {
    // Split the data URI to get the base64 data
    const byteString = dataURI.split(',')[1];

    // Get the MIME type
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    
    // Convert base64 to binary
    const byteCharacters = atob(byteString);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    return new Blob(byteArrays, { type: mimeString });
  };

  // Generate a SHA-256 hash of the file
  const calculateSHA256 = async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // Create NIP-98 authorization header
  const createNIP98AuthEvent = async (method: string, fileHash: string): Promise<NostrEvent> => {
    try {
      // Import necessary functions for NIP-98 from nostr-tools
      // This would typically be imported from a nostr library
      // For this example, we'll create a placeholder
      // const event: NostrEvent = {
      //   kind: 27235, // NIP-98 authorization event kind
      //   created_at: Math.floor(Date.now() / 1000),
      //   tags: [
      //     ["u", url],
      //     ["method", method],
      //   //   ["payload", fileHash]
      //   ],
      //   content: "",
      // };
      const unixNow = () => Math.floor(Date.now() / 1000)
      const newExpirationValue = () => (unixNow() + 60 * 5).toString()
      const createdAt = Math.floor(Date.now() / 1000)

      // Create auth event for blossom auth via nostr
      const authEvent: NostrEvent = {
        kind: 24242,
        content: "Upload Test Image",
        created_at: createdAt,
        tags: [
          ["t", "upload"],
          ["x", fileHash],
          ["expiration", newExpirationValue()],
        ],
        pubkey: pubkey, // Add a placeholder for pubkey
        id: "", // Add a placeholder for id
        sig: "", // Add a placeholder for sig
      }
      
      return authEvent;
    } catch (error) {
      console.error("Error creating NIP-98 auth event:", error);
      throw error;
    }
  };

  // Fetch server configuration
  const fetchServerConfig = async (serverIndex: number) => {
    try {
      const response = await fetch(UPLOAD_SERVERS[serverIndex].wellKnownUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch server config: ${response.statusText}`);
      }
      
      const config = await response.json();
      setSelectedServer({
        ...UPLOAD_SERVERS[serverIndex],
        config
      });
      return config;
    } catch (error) {
      console.error(`Error fetching server config for ${UPLOAD_SERVERS[serverIndex].name}:`, error);
      throw error;
    }
  };

  // Upload the image
  const uploadImage = async () => {
    if (isUploading || !imageData) return;
    
    setIsUploading(true);
    setUploadStatus('Preparing image for upload...');
    
    try {
      // // Try the first server by default
      // console.log("fetching server config")
      // const serverConfig = await fetchServerConfig(0);
      
      // // Get the upload URL from the server config
      // const uploadUrl = serverConfig.api_url;
      // if (!uploadUrl) {
      //   throw new Error('No upload URL found in server configuration');
      // }
      
      // Convert the image to a blob
      const blob = dataURItoBlob(imageData);
      
      // Calculate the file hash
      const fileHash = await calculateSHA256(blob);
      
      // Create a file object with timestamp in the name
      const file = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', 'Image captured from camera');
      formData.append('alt', 'Camera captured image');
      formData.append('content_type', 'image/jpeg');
      formData.append('size', file.size.toString());
      
      // Get auth header for NIP-98
      setUploadStatus('Creating authentication...');
      const authEvent = await createNIP98AuthEvent('PUT', fileHash);
      
      // Sing AuthEvent
      console.log(privateKey)
      let signedEvent = finalizeEvent(authEvent, privateKey);
      let isGood = verifyEvent(signedEvent);
      console.log(signedEvent)
      console.log(isGood)

      // authEventSigned as base64 encoded string
      let authString = Buffer.from(JSON.stringify(signedEvent)).toString('base64')

      // server to upload file
      const blossomServer = "https://" + "blossom.primal.net" + "/upload"

      // Upload the file
      setUploadStatus('Uploading image...');
      const uploadResponse = await fetch(blossomServer, {
        method: 'PUT',
        headers: { authorization: "Nostr " + authString },
        body: file
      });

      console.log("upload response:")
      console.log(uploadResponse)
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
      
      const responseData = await uploadResponse.json();
      console.log(responseData.url)
      setBlossomResponse(responseData)

      console.log('onComplete')
      onComplete(true, responseData, undefined);

      // if (responseData.status === 200) {
      //   setUploadStatus('Upload successful!');
        
      // } else {
      //   throw new Error(responseData.message || 'Upload failed');
      // }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed');
    } finally {
      setIsUploading(false);
      console.log("success");
    }
  };

  // Start upload when component mounts
  useEffect(() => {
    if (imageData && pubkey && privateKey) {
      uploadImage();
    } else {
      onComplete(false, undefined, 'Missing required data for upload');
    }
  }, [imageData, pubkey, privateKey]);  // whenever these variables change use effect runs

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 mb-4" style={{ display: isUploading ? 'block' : 'none' }}>
      <div className="flex items-center space-x-3">
        {isUploading && (
          <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
        )}
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {uploadStatus || 'Preparing upload...'}
        </p>
      </div>
    </div>
  );
};

export default NostrImageUploader;