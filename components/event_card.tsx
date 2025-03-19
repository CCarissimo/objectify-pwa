import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const EventCard = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const createdAt = new Date(event.created_at * 1000).toLocaleString();

  const handleCardClick = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white dark:bg-zinc-800 p-5 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all cursor-pointer ${
        isExpanded ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      {/* Event Content */}
      <div className="mb-3">
        <ReactMarkdown className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
          {event.content}
        </ReactMarkdown>
      </div>

      {/* Display images only before expanding */}
      <div className="space-y-3">
        {event.tags
          .filter((tag) => tag[0] === 'image')
          .map((tag, index) => (
            <TagRenderer key={index} tag={tag} />
          ))}
      </div>

      <div className="flex justify-between items-center mt-3">
        {event.tags
            .filter((tag) => tag[0] === 'nickname')
            .map((tag, index) => (
              <TagRenderer key={index} tag={tag} />
            ))}
      </div>

      {/* Reveal additional information on click */}
      {isExpanded && (
        <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <p>
            <strong>Created:</strong> {createdAt}
          </p>
          <p>
            <strong>ID:</strong> {event.id}
          </p>
          <p>
            <strong>Pubkey:</strong> {event.pubkey}
          </p>

          {/* Render Tags */}
          <div className="mt-3">
            <h4 className="text-gray-600 dark:text-gray-300 font-semibold text-sm mb-2">
              Tags:
            </h4>
            <div className="space-y-2">
              {event.tags
                .filter((tag) => tag[0] !== 'image')
                .map((tag, index) => (
                  <TagRenderer key={index} tag={tag} />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TagRenderer = ({ tag }) => {
  const tagKey = tag[0];
  const tagValue = tag[1];

  if (tagKey === 'image') {
    return (
      <div>
        <img
          src={tagValue}
          alt="Event Image"
          className="rounded-xl w-full max-h-60 object-cover shadow-md hover:shadow-lg transition-all"
        />
      </div>
    );
  }

  return (
    <p className="text-gray-500 dark:text-gray-400 text-xs">
      <strong>{tagKey}:</strong> {tag.slice(1).join(', ')}
    </p>
  );
};

export default EventCard;
