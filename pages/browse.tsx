import Page from '@/components/page'
import Section from '@/components/section'
import React from 'react';
import DisplayEvents from '@/components/displayEvents';


const Browse = () => {
	return (
		<Page>
			{/* <Section>
				<h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
					Swipeable Events Feed
				</h2>
				<div className='mt-2'>
					<p className='text-zinc-600 dark:text-zinc-400'>
						Swipe left or right to browse through Nostr events
					</p>
				</div>
			</Section> */}
			<DisplayEvents authors={null} />
		</Page>
	);
}
export default Browse;