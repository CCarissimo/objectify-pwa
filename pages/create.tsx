import Page from '@/components/page'
import Section from '@/components/section'
import React, { useContext, useState, useEffect } from 'react';
import { KeyContext } from './_app';
import { useRouter } from 'next/router';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'; // already an installed dependency
import * as nip19 from 'nostr-tools/nip19';
import { finalizeEvent, verifyEvent } from 'nostr-tools/pure';
import { SimplePool } from 'nostr-tools/pool';
// import nip19 from 'nostr-tools';
import CameraCapture from '@/components/cameraCapture';
import NostrImageUploader from '@/components/nostrImageUploader';


// Interface for the form data
interface ListingFormData {
  title: string;
  summary: string;
  content: string;
  location: string;
  price: {
    amount: string;
    currency: string;
    frequency: string;
  };
  tags: string[];
  images: {
    url: string;
    dimensions: string;
  }[];
}

// Define the type for tags (arrays of strings)
type Tag = string[];

// Define the event interface
interface NostrEvent {
  kind: number;
  created_at: number;
  tags: string[];
  content: string;
}

const CreateListing = () => {
  const { keys, activeKeyId } = useContext(KeyContext);

  // Get active key
  const activeKey = keys.find(k => k.id === activeKeyId);
  
  // Set the default tags 
  const sampleTags = [
    "freezer", 
    "give-away", 
    "unknown"
  ];

  // State for the form data
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    summary: '',
    content: '',
    location: '',
    price: {
      amount: 'free',
      currency: '',
      frequency: '',
    },
    tags: [],
    images: []
  });

  const [newTag, setNewTag] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageDimensions, setNewImageDimensions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [eventId, setEventId] = useState<string | null>(null);

  // For tag input handling
  const addTag = (tag) => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    } else {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // For image handling
  const addImage = () => {
    if (newImageUrl) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, {
          url: newImageUrl,
          dimensions: newImageDimensions || 'unknown'
        }]
      }));
      setNewImageUrl('');
      setNewImageDimensions('');
    }
  };

  const removeImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.url !== url)
    }));
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('price.')) {
      const priceField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        price: {
          ...prev.price,
          [priceField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle Camera Capture
  const [capturedImage, setCapturedImage] = useState(null);  
  const handleImageCapture = (imageData) => {
    setCapturedImage(imageData);
    // Here you could upload the image to your server or process it further
    console.log('Image captured:', imageData.substring(0, 50) + '...');
  };

  // Add this state to track the upload result
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    url?: string;
    message?: string;
  } | null>(null);

  // Add this handler for upload completion
  const handleUploadComplete = (success: boolean, data?: any, error?: string) => {
    if (success) {
      console.log("setting image to form data")
      // Find the URL tag from the response
      const imageUrl = data.url;
      
      setUploadResult({
        success: true,
        url: imageUrl,
        message: 'Image uploaded successfully!'
      });
      
      // Add the uploaded image to your form data
      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, {
            url: imageUrl,
            dimensions: '800x600' // You might want to get the actual dimensions
          }]
        }));
        console.log(formData)
      }
    } else {
      setUploadResult({
        success: false,
        message: error || 'Upload failed'
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {

      console.log("active nsec");
      console.log(activeKey.nsec);
      console.log(activeKey.privateKey)
      // let { type, sk } = nip19.decode(activeKey.nsec)
      let sk = activeKey.privateKeyHex
      console.log(sk)
      
      let newEvent: NostrEvent = {
        kind: 30402,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: formData.content,
      };
  
      // Set the tags
      newEvent.tags = [
        ['d', formData.title.toLowerCase().replace(/\s+/g, '-')],
        ['title', formData.title],
        ['published_at', Math.floor(Date.now() / 1000).toString()],
        ['summary', formData.summary],
        ['location', formData.location],
        ['nickname', activeKey.name],
      ];
      
      // Add price tag
      if (formData.price.amount && formData.price.currency) {
        const priceTag = ['price', formData.price.amount, formData.price.currency];
        if (formData.price.frequency) {
          priceTag.push(formData.price.frequency);
        }
        newEvent.tags.push(priceTag);
      };
      
      // Add category/hashtags
      formData.tags.forEach(tag => {
        newEvent.tags.push(['t', tag]);
      });
      
      // Add images
      formData.images.forEach(image => {
        newEvent.tags.push(['image', image.url, image.dimensions]);
      });

      // Add status tag
      newEvent.tags.push(['status', 'active']);
      
      let signedEvent = finalizeEvent(newEvent, sk);
      let isGood = verifyEvent(signedEvent);

      console.log(signedEvent)
      console.log(isGood)

      // connect to relays and publish
      const pool = new SimplePool();
      let relays = [
        "wss://nostr.wine",
        "wss://relay.nostr.band",
        "wss://relay.damus.io",
        ];
      
      // await Promise.any(pool.publish(relays, signedEvent));
      try {
        await Promise.any(pool.publish(relays, signedEvent));
      } catch (error) {
        // AggregateError contains an array of the individual errors
        if (error instanceof AggregateError) {
          console.error("All promises rejected with the following errors:");
          error.errors.forEach((err, index) => {
            console.error(`Relay ${index}: ${err.message}`);
          });
        } else {
          console.error("Unexpected error:", error);
        }
      } 

      setSuccess(true);
      
    } catch (err) {
      console.error('Error publishing event:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.log(error)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Section>
        {/* <h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
          Create Classified Listing
        </h2>
        
        <div className='mt-2'>
          <p className='text-zinc-600 dark:text-zinc-400'>
            Create a new classified listing on the Nostr network
          </p>
        </div> */}
        
        {/* Success message */}
        {success && (
          <div className='mt-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded'>
            <p>Listing published successfully!</p>
            {eventId && (
              <p className='mt-2 text-sm'>
                Event ID: <span className='font-mono'>{eventId}</span>
              </p>
            )}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className='mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded'>
            <p>Error: {error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className='mt-6 space-y-6'>
          {/* Images */}
          <div className='p-4 bg-zinc-100 dark:bg-zinc-800 rounded'>
            <h3 className='text-md font-semibold text-zinc-800 dark:text-zinc-200'>
              Images
            </h3>
            
            <div className='mt-2 space-y-2'>
              {/* <div className='flex gap-2'>
                <input
                  type='text'
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className='flex-grow p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                  placeholder='Image URL'
                />
                <input
                  type='text'
                  value={newImageDimensions}
                  onChange={(e) => setNewImageDimensions(e.target.value)}
                  className='w-32 p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                  placeholder='Dimensions (e.g., 800x600)'
                />
                <button
                  type='button'
                  onClick={addImage}
                  className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                >
                  Add
                </button>
              </div> */}
              
              {/* <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                {formData.images.map((image, index) => (
                  <div key={index} className='border rounded dark:border-zinc-700 overflow-hidden'>
                    <div className='aspect-w-16 aspect-h-9 bg-zinc-200 dark:bg-zinc-700 relative'>
                      <img
                        src={image.url}
                        alt={`Listing image ${index + 1}`}
                        className='object-cover w-full h-full'
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Error')}
                      />
                      <button
                        type='button'
                        onClick={() => removeImage(image.url)}
                        className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600'
                      >
                        &times;
                      </button>
                    </div>
                    <div className='p-2 text-sm text-zinc-600 dark:text-zinc-400'>
                      Dimensions: {image.dimensions}
                    </div>
                  </div>
                ))}
                {formData.images.length === 0 && (
                  <div className='col-span-full text-zinc-500 dark:text-zinc-400 text-sm'>
                    No images added yet
                  </div>
                )}
              </div> */}
              <div className="container mx-auto p-4">
                <h3 className="text-2xl font-bold mb-4">Upload Image</h3>
                  <CameraCapture onCapture={handleImageCapture} />
                  {capturedImage && (
                    <div className="mt-4">
                      <h4 className="text-xl mb-2">Captured Image:</h4>
                      <img 
                        src={capturedImage} 
                        alt="Captured" 
                        className="max-w-full h-auto rounded border"
                      />
                      
                      {/* Add the uploader component */}
                      <NostrImageUploader
                        imageData={capturedImage}
                        pubkey={activeKey.name}
                        privateKey={activeKey.privateKey}
                        onComplete={handleUploadComplete}
                      />
                      
                      {/* Show upload result message */}
                      {uploadResult && (
                        <div className={`mt-2 p-2 rounded ${uploadResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {uploadResult.message}
                          {uploadResult.url && (
                            <div className="mt-1 text-sm">
                              <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" className="underline">
                                View uploaded image
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
          
          {/* Basic Information */}
          <div className='space-y-4'>
            <div>
              <label htmlFor='title' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Title
              </label>
              <input
                type='text'
                id='title'
                name='title'
                value={formData.title}
                onChange={handleChange}
                required
                className='mt-1 block w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                placeholder='What are you listing?'
              />
            </div>
            
            {/* <div>
              <label htmlFor='summary' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Summary
              </label>
              <input
                type='text'
                id='summary'
                name='summary'
                value={formData.summary}
                onChange={handleChange}
                // required
                className='mt-1 block w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                placeholder='Short description (tagline)'
              />
            </div> */}
            
            {/* <div>
              <label htmlFor='content' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Description (Markdown supported)
              </label>
              <textarea
                id='content'
                name='content'
                value={formData.content}
                onChange={handleChange}
                // required
                rows={6}
                className='mt-1 block w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                placeholder='Detailed description of what you are listing...'
              />
            </div> */}
            
            <div>
              <label htmlFor='location' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Location
              </label>
              <input
                type='text'
                id='location'
                name='location'
                value={formData.location}
                onChange={handleChange}
                className='mt-1 block w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                placeholder='Paradies, 8001'
              />
            </div>
          </div>
          
          {/* Price */}
          {/* <div className='p-4 bg-zinc-100 dark:bg-zinc-800 rounded'>
            <h3 className='text-md font-semibold text-zinc-800 dark:text-zinc-200'>
              Price
            </h3>
            
            <div className='mt-2 grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label htmlFor='price.amount' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                  Amount
                </label>
                <input
                  type='number'
                  id='price.amount'
                  name='price.amount'
                  value={formData.price.amount}
                  onChange={handleChange}
                  min='0'
                  step='any'
                  className='mt-1 block w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                  placeholder='0.00'
                />
              </div>
              
              <div>
                <label htmlFor='price.currency' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                  Currency
                </label>
                <select
                  id='price.currency'
                  name='price.currency'
                  value={formData.price.currency}
                  onChange={handleChange}
                  className='mt-1 block w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor='price.frequency' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                  Frequency (Optional)
                </label>
                <select
                  id='price.frequency'
                  name='price.frequency'
                  value={formData.price.frequency}
                  onChange={handleChange}
                  className='mt-1 block w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                >
                  {frequencies.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div> */}
          
          {/* Tags */}
          <div className='p-4 bg-zinc-100 dark:bg-zinc-800 rounded'>
            <h3 className='text-md font-semibold text-zinc-800 dark:text-zinc-200'>
              Tags/Categories
            </h3>

            {/* Sample Tags */}
            <div className='mt-2 flex flex-wrap gap-2'>
              {sampleTags.map((tag) => (
                <button
                  key={tag}
                  type='button'
                  onClick={() => addTag(tag)}
                  className='px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Input Field for Custom Tags */}
            <div className='mt-2 flex gap-2'>
              <input
                type='text'
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className='flex-grow p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                placeholder='Add a tag (e.g., electronics, furniture)'
              />
              <button
                type='button'
                onClick={() => addTag(newTag)}
                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
              >
                Add
              </button>
            </div>

            {/* Display Selected Tags */}
            <div className='mt-4 flex flex-wrap gap-2'>
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                >
                  {tag}
                  <button
                    type='button'
                    onClick={() => removeTag(tag)}
                    className='ml-2 inline-flex text-blue-400 hover:text-blue-600'
                  >
                    &times;
                  </button>
                </span>
              ))}
              {formData.tags.length === 0 && (
                <span className='text-zinc-500 dark:text-zinc-400 text-sm'>
                  No tags added yet
                </span>
              )}
            </div>
          </div>
          
          {/* User key selection */}
          <div className='p-4 bg-zinc-100 dark:bg-zinc-800 rounded'>
            <h3 className='text-md font-semibold text-zinc-800 dark:text-zinc-200'>
              Publishing Key
            </h3>
            
            <div className='mt-2'>
              {keys.length === 0 ? (
                <p className='text-red-500 dark:text-red-400'>
                  No keys available. Please add a key in the Settings page before publishing.
                </p>
              ) : activeKeyId ? (
                <div>
                  <p className='text-zinc-600 dark:text-zinc-400'>
                    Publishing with key: <span className='font-medium'>{keys.find(k => k.id === activeKeyId)?.name}</span>
                  </p>
                </div>
              ) : (
                <p className='text-yellow-500 dark:text-yellow-400'>
                  Please select an active key on the Settings before publishing.
                </p>
              )}
            </div>
          </div>
          
          {/* Submit button */}
          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={isSubmitting || !activeKeyId}
              className='px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 dark:disabled:bg-green-800'
            >
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </Section>
    </Page>
  );
};

export default CreateListing;