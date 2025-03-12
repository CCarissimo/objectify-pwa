import Page from '@/components/page'
import Section from '@/components/section'
import React, { useContext, useState, useEffect } from 'react';
import { KeyContext } from './_app';
import { useRouter } from 'next/router';
import { useNDK } from '@nostr-dev-kit/ndk-react';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils' // already an installed dependency
import * as nip19 from 'nostr-tools/nip19'

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

// Currency options
const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'BTC', name: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum' },
  { code: 'SATS', name: 'Satoshis' },
];

// Frequency options for recurring prices
const frequencies = [
  { value: '', label: 'One-time payment' },
  { value: 'hour', label: 'Per hour' },
  { value: 'day', label: 'Per day' },
  { value: 'week', label: 'Per week' },
  { value: 'month', label: 'Per month' },
  { value: 'year', label: 'Per year' },
];

const CreateListing = () => {
  const { keys, activeKeyId } = useContext(KeyContext);
  const router = useRouter();
  const { ndk, loginWithSecret, signPublishEvent } = useNDK();

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
  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Get active key
      const activeKey = keys.find(k => k.id === activeKeyId);
      if (!activeKey) {
        throw new Error('No active key selected. Please select a key before publishing.');
      }
      
      if (!ndk) {
        throw new Error('NDK not initialized. Please check your connection.');
      }

      // Create new Nostr event
      const event = new NDKEvent(ndk);
      
      // Set the kind
      event.kind = 30402;
      
      // Set the content
      event.content = formData.content;
      
      // Set the tags
      event.tags = [
        ['d', formData.title.toLowerCase().replace(/\s+/g, '-')], // d tag for unique identifier
        ['title', formData.title],
        ['published_at', Math.floor(Date.now() / 1000).toString()],
        ['summary', formData.summary],
        ['location', formData.location],
      ];
      
      // Add price tag
      if (formData.price.amount && formData.price.currency) {
        const priceTag = ['price', formData.price.amount, formData.price.currency];
        if (formData.price.frequency) {
          priceTag.push(formData.price.frequency);
        }
        event.tags.push(priceTag);
      }
      
      // Add category/hashtags
      formData.tags.forEach(tag => {
        event.tags.push(['t', tag]);
      });
      
      // Add images
      formData.images.forEach(image => {
        event.tags.push(['image', image.url, image.dimensions]);
      });

      // Add status tag
      event.tags.push(['status', 'active']);
      
      // Set pubkey (note: in a real app, you'd use NDK's signer)
      // For this example, we'll just set it directly
      // event.pubkey = activeKey.privateKey;
      console.log("active pk")
      console.log(activeKey.privateKey);
      // console.log(bytesToHex(activeKey.privateKey));
      // let nsec = nip19.nsecEncode(activeKey.privateKey);
      // const user = await loginWithSecret(activeKey.privateKey);
      // console.log("signer result")
      // console.log(user)
      // console.log(ndk.signer)
      // console.log(ndk)
      // Sign and publish the event
      const publishedEvent = await signPublishEvent(event);

      // setEventId(publishedEvent.id);
      setSuccess(true);
      
      // Optional: Navigate to a success page or listing detail
      // setTimeout(() => router.push('/listings'), 2000);
      
    } catch (err) {
      console.error('Error publishing event:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Section>
        <h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
          Create Classified Listing
        </h2>
        
        <div className='mt-2'>
          <p className='text-zinc-600 dark:text-zinc-400'>
            Create a new classified listing on the Nostr network
          </p>
        </div>
        
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
            
            <div>
              <label htmlFor='summary' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Summary
              </label>
              <input
                type='text'
                id='summary'
                name='summary'
                value={formData.summary}
                onChange={handleChange}
                required
                className='mt-1 block w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                placeholder='Short description (tagline)'
              />
            </div>
            
            <div>
              <label htmlFor='content' className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Description (Markdown supported)
              </label>
              <textarea
                id='content'
                name='content'
                value={formData.content}
                onChange={handleChange}
                required
                rows={6}
                className='mt-1 block w-full p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700'
                placeholder='Detailed description of what you are listing...'
              />
            </div>
            
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
                placeholder='City, Country'
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
                onClick={addTag}
                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
              >
                Add
              </button>
            </div>
            
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
          
          {/* Images */}
          <div className='p-4 bg-zinc-100 dark:bg-zinc-800 rounded'>
            <h3 className='text-md font-semibold text-zinc-800 dark:text-zinc-200'>
              Images
            </h3>
            
            <div className='mt-2 space-y-2'>
              <div className='flex gap-2'>
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
              </div>
              
              <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
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
              </div>
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
                  No keys available. Please add a key in the Home page before publishing.
                </p>
              ) : activeKeyId ? (
                <div>
                  <p className='text-zinc-600 dark:text-zinc-400'>
                    Publishing with key: <span className='font-medium'>{keys.find(k => k.id === activeKeyId)?.name}</span>
                  </p>
                </div>
              ) : (
                <p className='text-yellow-500 dark:text-yellow-400'>
                  Please select an active key on the Home page before publishing.
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

// import Page from '@/components/page'
// import Section from '@/components/section'
// import React, { useState } from 'react';
// import { FiCamera, FiMapPin, FiUpload, FiCheck, FiEdit3 } from 'react-icons/fi';

// const CreatePostForm = () => {
//   const [content, setContent] = useState('');
//   const [pubkey, setPubkey] = useState('');
//   const [images, setImages] = useState('');
//   const [description, setDescription] = useState('');
//   const [location, setLocation] = useState('');

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     // Handle form submission logic here
//     console.log({ content, pubkey, images, description, location });
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Image Upload Section */}
//         <div className="col-span-full">
//           <label className="flex flex-col items-center justify-center h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-blue-200 cursor-pointer hover:border-blue-300 transition-colors">
//             <div className="text-center space-y-2">
//               <FiCamera className="w-8 h-8 text-blue-400 mx-auto" />
//               <span className="text-blue-600 font-medium">Add Photos</span>
//               <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
//             </div>
//             <input
//               type="text"
//               value={images}
//               onChange={(e) => setImages(e.target.value)}
//               className="hidden"
//               placeholder="Paste image URLs here"
//             />
//           </label>
//         </div>

//         {/* Content Field */}
//         <div className="col-span-full relative">
//           <textarea
//             value={content}
//             onChange={(e) => setContent(e.target.value)}
//             className="w-full px-4 py-3 bg-transparent border-2 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 peer placeholder-transparent"
//             placeholder=" "
//             required
//           />
//           <label className="absolute left-4 -top-3 px-1 bg-white dark:bg-zinc-900 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-blue-600">
//             <FiEdit3 className="inline mr-2" /> Story Content
//           </label>
//         </div>

//         {/* Description Field */}
//         <div className="col-span-full relative">
//           <textarea
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             className="w-full px-4 py-3 bg-transparent border-2 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 peer placeholder-transparent"
//             placeholder=" "
//           />
//           <label className="absolute left-4 -top-3 px-1 bg-white dark:bg-zinc-900 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-purple-600">
//             ✨ Description
//           </label>
//         </div>

//         {/* Location Field */}
//         <div className="relative">
//           <input
//             type="text"
//             value={location}
//             onChange={(e) => setLocation(e.target.value)}
//             className="w-full px-4 py-3 pl-10 bg-transparent border-2 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 peer placeholder-transparent"
//             placeholder=" "
//           />
//           <FiMapPin className="absolute left-3 top-4 text-gray-400 peer-focus:text-green-500" />
//           <label className="absolute left-10 -top-3 px-1 bg-white dark:bg-zinc-900 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-green-600">
//             Where was this?
//           </label>
//         </div>

//         {/* Pubkey Field */}
//         <div className="relative">
//           <input
//             type="text"
//             value={pubkey}
//             onChange={(e) => setPubkey(e.target.value)}
//             className="w-full px-4 py-3 bg-transparent border-2 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 peer placeholder-transparent"
//             placeholder=" "
//             required
//           />
//           <label className="absolute left-4 -top-3 px-1 bg-white dark:bg-zinc-900 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-orange-600">
//             🔑 Your Public Key
//           </label>
//         </div>
//       </div>

//       <button
//         type="submit"
//         className="w-full py-4 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
//       >
//         <FiUpload className="w-5 h-5" />
//         <span>Publish to Nostr</span>
//       </button>

//       {/* Success Animation (Hidden by default) */}
//       <div className="hidden items-center justify-center space-x-2 text-green-500">
//         <FiCheck className="w-6 h-6" />
//         <span className="font-semibold">Posted successfully!</span>
//       </div>
//     </form>
//   );
// };

// const CreateItemPage = () => (
//   <Page>
//     <Section>
//       <div className="text-center mb-8">
//         <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
//           Craft Your Story
//         </h2>
//         <p className="mt-3 text-zinc-600 dark:text-zinc-300 max-w-md mx-auto">
//           Share your moments with the world through Nostr's decentralized network. 
//           Your story matters! 🌍✨
//         </p>
//       </div>
//     </Section>
    
//     <div className="p-4 max-w-2xl mx-auto">
//       <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl p-6 md:p-8">
//         <CreatePostForm />
//       </div>
//     </div>
//   </Page>
// );

// export default CreateItemPage;