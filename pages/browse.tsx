import Page from '@/components/page'
import Section from '@/components/section'
import React, { useEffect, useState } from 'react';
import { useNDK } from "@nostr-dev-kit/ndk-react";
import { NDKFilter } from "@nostr-dev-kit/ndk";
import EventCard from '@/components/event_card';
import SwipeableCard from '@/components/swipeable_card';


const DisplayEvents = () => {
    const { fetchEvents } = useNDK();
    const [events, setEvents] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
	const [viewDeck, setViewDeck] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const filter: NDKFilter = { 
                kinds: [30402],
                limit: 10,
            };
            try {
                const fetchedEvents = await fetchEvents(filter);
                setEvents(fetchedEvents);
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


const Index = () => (
    <Page>
        <Section>
            <h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
                Swipeable Events Feed
            </h2>
            <div className='mt-2'>
                <p className='text-zinc-600 dark:text-zinc-400'>
                    Swipe left or right to browse through Nostr events
                </p>
            </div>
        </Section>
        <DisplayEvents />
    </Page>
);

export default Index;