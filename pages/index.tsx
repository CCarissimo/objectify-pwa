import Page from '@/components/page'
import Section from '@/components/section'
import React, { useEffect, useState } from 'react';

import { useNDK } from "@nostr-dev-kit/ndk-react";
import { NDKFilter } from "@nostr-dev-kit/ndk";
import ReactMarkdown from "react-markdown";


const EventList = () => {
    const { fetchEvents } = useNDK();
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const filter: NDKFilter = { 
				kinds: [30402], 
				// "#t": ["ndk"],
				limit: 10,
			};
            try {
                const fetchedEvents = await fetchEvents(filter);
                setEvents(fetchedEvents);
				console.log(fetchedEvents)
            } catch (error) {
                console.error("Error fetching events:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="p-4 max-w-2xl mx-auto space-y-6">
            {events.map((event) => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    );
};

const EventCard = ({ event }) => {
    // Convert timestamp to a readable date
    const createdAt = new Date(event.created_at * 1000).toLocaleString();

    return (
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200">
            <div className="mb-3">
                <ReactMarkdown className="text-gray-800 text-sm">{event.content}</ReactMarkdown>
            </div>
            <p className="text-gray-500 text-xs">
                <strong>Created:</strong> {createdAt}
            </p>
            <p className="text-gray-500 text-xs">
                <strong>ID:</strong> {event.id}
            </p>
            <p className="text-gray-500 text-xs">
                <strong>Pubkey:</strong> {event.pubkey}
            </p>

            {/* Render Tags */}
            <div className="mt-3">
                <h4 className="text-gray-600 font-semibold text-sm mb-2">Tags:</h4>
                <div className="space-y-2">
                    {event.tags.map((tag, index) => (
                        <TagRenderer key={index} tag={tag} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Function to render different types of tags
const TagRenderer = ({ tag }) => {
    const tagKey = tag[0];
    const tagValue = tag[1];

    if (tagKey === "image") {
        return (
            <div>
                <strong className="text-gray-600 text-xs">Image:</strong>
                <img src={tagValue} alt="Event Image" className="mt-1 rounded-md w-full max-h-60 object-cover" />
            </div>
        );
    }

    return (
        <p className="text-gray-500 text-xs">
            <strong>{tagKey}:</strong> {tag.slice(1).join(", ")}
        </p>
    );
};

const Index = () => (
	<Page>
		<Section>
			<h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
				Main Feed of Events
			</h2>

			<div className='mt-2'>
				<p className='text-zinc-600 dark:text-zinc-400'>
					A simple list like feed of NOSTR events from relays.
				</p>
			</div>
		</Section>
		<EventList/>
	</Page>
)

export default Index
