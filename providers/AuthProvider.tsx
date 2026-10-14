'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
 
export function AuthProvider({ children }: { children: ReactNode }) {
	const basePath = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/auth`;
	return <SessionProvider basePath={basePath}>{children}</SessionProvider>
}