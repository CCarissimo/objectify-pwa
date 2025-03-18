import Page from '@/components/page'
import Section from '@/components/section'
import React, { useContext } from 'react';
import { KeyContext } from './_app';
import DisplayEvents from '@/components/displayEvents';


const Inventory = () => {
	const { keys, activeKeyId } = useContext(KeyContext);
	// Get active key
	const activeKey = keys.find(k => k.id === activeKeyId);
	console.log("activeKey")
	console.log(activeKey.name)

	return (
		<Page>
			{/* <Section>
				<h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
					Personal Inventory
				</h2>
			</Section> */}
			<DisplayEvents authors={[activeKey.name]} />
		</Page>
	);
}
export default Inventory;