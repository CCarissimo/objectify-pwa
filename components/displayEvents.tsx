import React, { useEffect, useState } from 'react';
import EventCard from '@/components/event_card';
import SwipeableCard from '@/components/swipeable_card';
import { SimplePool } from 'nostr-tools/pool';

// Props interface
interface DisplayEventsProps {
    authors: string[]
  }

const DisplayEvents: React.FC<DisplayEventsProps> = ({
    authors,
}) => {
    // const { fetchEvents } = useNDK();
    const [events, setEvents] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
	const [viewDeck, setViewDeck] = useState(true);

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
				// let authors = ['29a0130558fc0a50e65a4207c7656dff491453f62406d2daa624aae028e36fbc']
                console.log(authors)
                
                let queryOptions = {
                    kinds: kinds,
                    limit: 100,
                    ...(authors && { authors }) // Add authors only if it is truthy
                  };
                  
                let events = await pool.querySync(relays, queryOptions);

				console.log(events);
				setEvents(events);

            } catch (error) {
                console.error("Error fetching events:", error);
            }
        };
        fetchData();
    }, []);

    const handleSwipe = (direction: 'left' | 'right') => {
        setCurrentIndex(prev => Math.min(prev + 1, events.length - 1));
    };

    if (events.length === 0) return <div className="p-4 text-center">Loading events...</div>;
    if (currentIndex >= events.length) return <div className="p-4 text-center">No more events to show</div>;

	if (viewDeck) {	
		return (
			<div className="p-4 max-w-2xl mx-auto space-y-6">
				<button
					className="bg-zinc-500 text-white px-4 py-2 rounded-md"
					onClick={() => setViewDeck(false)}
				>
					Show List
				</button>
					<div className="relative h-96 w-full max-w-md mx-auto">
						{events.slice(currentIndex, currentIndex + 2).map((event, index) => (
								<SwipeableCard
									key={event.id}
									event={event}
									active={index === 0}
									onSwipe={handleSwipe}
								/>
						))}
					</div>
			</div>
		);
	}
	else {
		return (
			<div className="p-4 max-w-2xl mx-auto space-y-6">
				<button
					className="bg-zinc-500 text-white px-4 py-2 rounded-md"
					onClick={() => setViewDeck(true)}
				>	
					Show Deck
				</button>
				<div className="p-4 max-w-2xl mx-auto space-y-6">
					{events.map((event) => (
						<EventCard key={event.id} event={event} />
					))}
				</div>
			</div>
		);
	}
};

export default DisplayEvents