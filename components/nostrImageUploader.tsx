import React, { useState, useEffect, useRef } from 'react';
import { finalizeEvent, verifyEvent } from 'nostr-tools/pure';
import { nip19, type NostrEvent } from "nostr-tools"


// Props interface
interface NostrImageUploaderProps {
  imageData: string; // base64 image data from camera capture
  pubkey: string; // user's public key for authentication
  privateKey: Uint8Array; // user's private key for signing the upload request
  onComplete: (success: boolean, data?: any, error?: string) => void;
  isComplete: boolean;
}

// Main component
const NostrImageUploader: React.FC<NostrImageUploaderProps> = ({ 
  imageData, 
  pubkey,
  privateKey,
  onComplete,
  isComplete
}) => {
  let isUploading = useRef(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [blossomResponse, setBlossomResponse] = useState<string>('');

  console.log("isComplete: boolean from createObject")
  console.log(isComplete)

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
  const createNIP98AuthEvent = (method: string, fileHash: string) => {
    try {

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

  // Upload the image
  const uploadImage = async () => {
    if (!imageData) {
      console.log('no image data')
      return
    }
    
    isUploading.current = true;
    // setUploadStatus('Preparing image for upload...');
    console.log('Preparing image for upload...')
    
    try {
      
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
      // setUploadStatus('Creating authentication...');
      const authEvent = createNIP98AuthEvent('PUT', fileHash);
      
      // Sing AuthEvent
      let signedEvent = finalizeEvent(authEvent, privateKey);
      let isGood = verifyEvent(signedEvent);
      console.log("Auth Event Signed")
      console.log(isGood)
      console.log(signedEvent)
      
      // authEventSigned as base64 encoded string
      let authString = Buffer.from(JSON.stringify(signedEvent)).toString('base64')

      // server to upload file
      const blossomServer = "https://" + "blossom.primal.net" + "/upload"

      // Upload the file
      // setUploadStatus('Uploading image...');
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
      setBlossomResponse(responseData)
      console.log(responseData.url)

      console.log('uploadImage: onComplete')
      onComplete(true, responseData, undefined);

    } catch (error) {
      console.error('Upload error:', error);
      // setUploadStatus('Upload failed');
    } finally {
      isUploading.current = false;
    }
  };

  // Start upload when component mounts
  useEffect(() => {
    if (!isComplete && imageData && pubkey && privateKey) {
      uploadImage();
    } else {
      onComplete(false, undefined, 'Missing required data for upload');
    }
  }, [ ]);  // whenever these variables change use effect runs

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