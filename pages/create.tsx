import Page from '@/components/page'
import Section from '@/components/section'
import React, { useContext, useState, useEffect } from 'react';
import CreateObject from '@/components/createObject';
import { KeyContext } from './_app';

const Create = () => {

	// useEffect(() => {
	// 	console.log(activeKey);
	//   }, []);

	const { keys, activeKeyId } = useContext(KeyContext);
	const activeKey = keys.find(k => k.id === activeKeyId);

	console.log("create something ")

	return (
		<Page>
			{
				activeKey? (
					<CreateObject/>
				) 
				: (
					<Section>
						<h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>
							No active key
						</h2>
						<div className='mt-2'>
							<p className='text-zinc-600 dark:text-zinc-400'>
								Set a key in Settings to create new objects.
							</p>
						</div>
					</Section>
				)}
		</Page>
	);
}
export default Create;