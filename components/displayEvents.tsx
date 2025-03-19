import React, { useEffect, useState } from 'react';
import EventCard from '@/components/event_card';
import SwipeableCard from '@/components/swipeable_card';
import { SimplePool } from 'nostr-tools/pool';

interface DisplayEventsProps {
    authors: string[];
}

const sampleTags = ["freezer", "give-away", "unknown"];

const DisplayEvents: React.FC<DisplayEventsProps> = ({ authors }) => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewDeck, setViewDeck] = useState(true);
    const [activeTags, setActiveTags] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const pool = new SimplePool();
                let relays = [
                    "wss://nostr.wine",
                    "wss://relay.nostr.band",
                    "wss://relay.damus.io",
                ];
                let kinds = [30402];
                
                let queryOptions = {
                    kinds: kinds,
                    limit: 100,
                    ...(authors && { authors })
                };
                
                let events = await pool.querySync(relays, queryOptions);
                setEvents(events);
                setFilteredEvents(events);
            } catch (error) {
                console.error("Error fetching events:", error);
            }
        };
        fetchData();
    }, []);

    const toggleTag = (tag: string) => {
        let updatedTags = activeTags.includes(tag)
            ? activeTags.filter(t => t !== tag)
            : [...activeTags, tag];
        setActiveTags(updatedTags);
        filterEventsByTags(updatedTags);
    };

    const filterEventsByTags = (tags: string[]) => {
        if (tags.length === 0) {
            setFilteredEvents(events);
        } else {
            setFilteredEvents(events.filter(event =>
                event.tags.some(tagArray => tagArray[0] === 't' && tags.includes(tagArray[1]))
            ));
        }
    };

    const handleSwipe = (direction: 'left' | 'right') => {
        setCurrentIndex(prev => Math.min(prev + 1, filteredEvents.length - 1));
    };

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6">
            <div className="flex space-x-2">
                {sampleTags.map(tag => (
                    <button
                        key={tag}
                        className={`px-4 py-2 rounded-md ${activeTags.includes(tag) ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                        onClick={() => toggleTag(tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            
            {filteredEvents.length === 0 ? (
                <div className="p-4 text-center">No events found.</div>
            ) : viewDeck ? (
                <>
                    <button
                        className="bg-zinc-500 text-white px-4 py-2 rounded-md"
                        onClick={() => setViewDeck(false)}
                    >
                        Show List
                    </button>
                    <div className="relative h-96 w-full max-w-md mx-auto">
                        {filteredEvents.slice(currentIndex, currentIndex + 2).map((event, index) => (
                            <SwipeableCard
                                key={event.id}
                                event={event}
                                active={index === 0}
                                onSwipe={handleSwipe}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <button
                        className="bg-zinc-500 text-white px-4 py-2 rounded-md"
                        onClick={() => setViewDeck(true)}
                    >
                        Show Deck
                    </button>
                    <div className="p-4 space-y-6">
                        {filteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default DisplayEvents;