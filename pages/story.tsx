import Page from '@/components/page'
import Section from '@/components/section'
import React, { useState } from 'react';
import { FiCamera, FiMapPin, FiUpload, FiCheck, FiEdit3 } from 'react-icons/fi';

const CreatePostForm = () => {
  const [content, setContent] = useState('');
  const [pubkey, setPubkey] = useState('');
  const [images, setImages] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({ content, pubkey, images, description, location });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Upload Section */}
        <div className="col-span-full">
          <label className="flex flex-col items-center justify-center h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-blue-200 cursor-pointer hover:border-blue-300 transition-colors">
            <div className="text-center space-y-2">
              <FiCamera className="w-8 h-8 text-blue-400 mx-auto" />
              <span className="text-blue-600 font-medium">Add Photos</span>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </div>
            <input
              type="text"
              value={images}
              onChange={(e) => setImages(e.target.value)}
              className="hidden"
              placeholder="Paste image URLs here"
            />
          </label>
        </div>

        {/* Content Field */}
        <div className="col-span-full relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 bg-transparent border-2 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 peer placeholder-transparent"
            placeholder=" "
            required
          />
          <label className="absolute left-4 -top-3 px-1 bg-white dark:bg-zinc-900 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-blue-600">
            <FiEdit3 className="inline mr-2" /> Story Content
          </label>
        </div>

        {/* Description Field */}
        <div className="col-span-full relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-transparent border-2 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 peer placeholder-transparent"
            placeholder=" "
          />
          <label className="absolute left-4 -top-3 px-1 bg-white dark:bg-zinc-900 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-purple-600">
            ✨ Description
          </label>
        </div>

        {/* Location Field */}
        <div className="relative">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-transparent border-2 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 peer placeholder-transparent"
            placeholder=" "
          />
          <FiMapPin className="absolute left-3 top-4 text-gray-400 peer-focus:text-green-500" />
          <label className="absolute left-10 -top-3 px-1 bg-white dark:bg-zinc-900 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-green-600">
            Where was this?
          </label>
        </div>

        {/* Pubkey Field */}
        <div className="relative">
          <input
            type="text"
            value={pubkey}
            onChange={(e) => setPubkey(e.target.value)}
            className="w-full px-4 py-3 bg-transparent border-2 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 peer placeholder-transparent"
            placeholder=" "
            required
          />
          <label className="absolute left-4 -top-3 px-1 bg-white dark:bg-zinc-900 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-orange-600">
            🔑 Your Public Key
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
      >
        <FiUpload className="w-5 h-5" />
        <span>Publish to Nostr</span>
      </button>

      {/* Success Animation (Hidden by default) */}
      <div className="hidden items-center justify-center space-x-2 text-green-500">
        <FiCheck className="w-6 h-6" />
        <span className="font-semibold">Posted successfully!</span>
      </div>
    </form>
  );
};

const Story = () => (
  <Page>
    <Section>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
          Craft Your Story
        </h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300 max-w-md mx-auto">
          Share your moments with the world through Nostr's decentralized network. 
          Your story matters! 🌍✨
        </p>
      </div>
    </Section>
    
    <div className="p-4 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl p-6 md:p-8">
        <CreatePostForm />
      </div>
    </div>
  </Page>
);

export default Story;