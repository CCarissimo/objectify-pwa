import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import EventCard from './event_card';


const SwipeableCard = ({ event, active, onSwipe }) => {
    const [position, setPosition] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const handlers = useSwipeable({
        onSwiping: (e) => {
            if (active && !isAnimating) {
                setPosition(e.deltaX);
            }
        },
        onSwiped: (e) => {
            if (!active || isAnimating) return;
            
            const swipeThreshold = 100;
            if (Math.abs(e.deltaX) > swipeThreshold) {
                setIsAnimating(true);
                setPosition(e.deltaX > 0 ? 500 : -500);
                setTimeout(() => {
                    onSwipe(e.deltaX > 0 ? 'right' : 'left');
                    setIsAnimating(false);
                    setPosition(0);
                }, 300);
            } else {
                setPosition(0);
            }
        },
        trackMouse: true
    });

    const cardStyle = {
        transform: `translateX(${position}px) rotate(${position * 0.1}deg)`,
        transition: isAnimating ? 'all 0.3s ease' : 'none',
        zIndex: active ? 10 : 9,
        opacity: active ? 1 : 0.95,
        scale: active ? 1 : 0.95,
    };

    return (
        <div
            {...handlers}
            className="absolute top-0 left-0 right-0 bg-white p-5 rounded-2xl shadow-md border border-gray-200"
            style={{
                ...cardStyle,
                touchAction: 'pan-y',
                cursor: 'grab'
            }}
        >
            <EventCard event={event} />
        </div>
    );
};

// const EventCard = ({ event }) => {
//     const createdAt = new Date(event.created_at * 1000).toLocaleString();
  
//     return (
//       <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6 space-y-4 hover:shadow-xl transition-shadow">
//         {/* Event Content */}
//         <div className="mb-3">
//           <ReactMarkdown className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
//             {event.content}
//           </ReactMarkdown>
//         </div>
  
//         {/* Event Timestamp */}
//         <p className="text-gray-500 dark:text-gray-400 text-xs">
//           <strong>Created:</strong> {createdAt}
//         </p>
  
//         {/* Event Tags */}
//         <div className="mt-3 flex flex-wrap gap-2">
//           {event.tags.map((tag, index) => (
//             <TagRenderer key={index} tag={tag} />
//           ))}
//         </div>
//       </div>
//     );
//   };
  
//   const TagRenderer = ({ tag }) => {
//     const tagKey = tag[0];
//     const tagValue = tag[1];
  
//     if (tagKey === 'image') {
//       return (
//         <div className="w-full mt-2">
//           <img
//             src={tagValue}
//             alt="Event"
//             className="rounded-xl w-full h-48 object-cover shadow-md hover:shadow-lg transition-all"
//           />
//         </div>
//       );
//     }
  
//     return (
//       <p className="text-xs text-gray-600 dark:text-gray-400 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-800 dark:to-purple-800 px-3 py-1 rounded-full shadow-sm">
//         <strong className="text-blue-600 dark:text-blue-300">{tagKey}:</strong>{' '}
//         {tag.slice(1).join(', ')}
//       </p>
//     );
//   };

// const EventCard = ({ event }) => {
//     const createdAt = new Date(event.created_at * 1000).toLocaleString();

//     return (
//         <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6 space-y-4 hover:shadow-xl transition-shadow">
//             <div className="mb-3">
//                 <ReactMarkdown className="text-gray-800 text-sm">{event.content}</ReactMarkdown>
//             </div>
//             <p className="text-gray-500 text-xs">
//                 <strong>Created:</strong> {createdAt}
//             </p>
//             <div className="mt-3">
//                 {event.tags.map((tag, index) => (
//                     <TagRenderer key={index} tag={tag} />
//                 ))}
//             </div>
//         </div>
//     );
// };

// const TagRenderer = ({ tag }) => {
//     const tagKey = tag[0];
//     const tagValue = tag[1];

//     if (tagKey === "image") {
//         return (
//             <div className="mt-2">
//                 <img src={tagValue} alt="Event" className="rounded-xl w-full h-48 object-cover shadow-md hover:shadow-lg transition-all" />
//             </div>
//         );
//     }

//     return (
//         <p className="text-gray-500 text-xs">
//             <strong>{tagKey}:</strong> {tag.slice(1).join(", ")}
//         </p>
//     );
// };

export default SwipeableCard;