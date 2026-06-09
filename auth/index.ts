/** @format */

import NextAuth from 'next-auth';
import { authConfig } from './config';

export const { auth, handlers, signIn, signOut, unstable_update } = NextAuth({
	session: { strategy: 'jwt' },
	basePath: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/auth`,
	...authConfig,
});
