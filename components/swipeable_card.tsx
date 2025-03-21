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
                cursor: 'grab',
                // width: 'fit-content',  // Adapt to the EventCard's width
                // margin: '0 auto'       // Center the card horizontally
            }}
        >
            <EventCard event={event} />
        </div>
    );
};

export default SwipeableCard;