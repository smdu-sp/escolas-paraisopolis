/** @format */

import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const myFont = localFont({
	src: './Sora-VariableFont_wght.woff2',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'SISAR',
	description: 'SISAR',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang='pt-BR'
			suppressHydrationWarning
			className={`${myFont.className} antialised `}>
			<head>
				<link
					rel='apple-touch-icon'
					sizes='180x180'
					href='/apple-touch-icon.png'
				/>
				<link
					rel='icon'
					type='image/png'
					sizes='32x32'
					href='/favicon-32x32.png'
				/>
				<link
					rel='icon'
					type='image/png'
					sizes='16x16'
					href='/favicon-16x16.png'
				/>
				<link
					rel='mask-icon'
					href='/safari-pinned-tab.svg'
					color='#5bbad5'
				/>
				<meta
					name='msapplication-TileColor'
					content='#eeeeee'
				/>
				<meta
					name='theme-color'
					content='#eeeeee'
				/>
			</head>
			<body>
				<AuthProvider>
					<QueryProvider>
						<ThemeProvider
							attribute='class'
							defaultTheme='system'
							enableSystem
							disableTransitionOnChange>
							{children}
							<Toaster richColors />
						</ThemeProvider>
					</QueryProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
