/** @format */

import NextAuth from 'next-auth';
import { authConfig } from './config';

const isProduction = process.env.NODE_ENV === 'production';
const cookiePrefix = 'caminhos-escolares';

export const { auth, handlers, signIn, signOut, unstable_update } = NextAuth({
	session: { strategy: 'jwt' },
	basePath: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/auth`,
	cookies: {
		sessionToken: {
			name: `${cookiePrefix}.session-token`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: isProduction },
		},
		csrfToken: {
			name: `${cookiePrefix}.csrf-token`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: isProduction },
		},
		callbackUrl: {
			name: `${cookiePrefix}.callback-url`,
			options: { sameSite: 'lax', path: '/', secure: isProduction },
		},
		pkceCodeVerifier: {
			name: `${cookiePrefix}.pkce.code_verifier`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: isProduction },
		},
		state: {
			name: `${cookiePrefix}.state`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: isProduction },
		},
		nonce: {
			name: `${cookiePrefix}.nonce`,
			options: { httpOnly: true, sameSite: 'lax', path: '/', secure: isProduction },
		},
	},
	...authConfig,
});
