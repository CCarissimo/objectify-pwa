import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import '@/styles/globals.css'

import { NDKProvider } from "@nostr-dev-kit/ndk-react";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ThemeProvider
			attribute='class'
			defaultTheme='system'
			disableTransitionOnChange
		>
			<NDKProvider
			relayUrls={[
				"wss://relay.damus.io",
				"wss://relay.snort.social",
				"wss://purplepag.es",
				"wss://nostr.wine"
			]}
			>
				<Component {...pageProps} /> 
			</NDKProvider>
			
		</ThemeProvider>
	)
}
