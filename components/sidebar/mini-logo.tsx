/** @format */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function MiniLogo() {
	const [mounted, setMounted] = useState(false);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className='flex aspect-square size-8 p-1 items-center justify-center rounded-lg bg-muted text-sidebar-primary-foreground'></div>
		);
	}

	return (
		<div className='flex aspect-square size-8 p-1 items-center justify-center rounded-lg text-sidebar-primary-foreground'>
			<Image
				width={1200}
				height={1200}
				src={`${basePath}/sis-icon.png`}
				alt='LOGO PREFEITURA DE SÃO PAULO'
			/>
		</div>
	);
}
