/** @format */

import { db } from '@/lib/prisma';
import Credentials from 'next-auth/providers/credentials';

export const authConfig = {
	providers: [
		Credentials({
			name: 'credentials',
			credentials: {
				login: {},
				senha: {},
			},
			authorize: async (credentials) => {
				const { login, senha } = credentials ?? {};
				if (!login || !senha) return null;
				let usuario = await db.usuario.findUnique({ where: { login: login as string } });
				if (!usuario) return null;
				if (process.env.ENVIRONMENT !== "local"){
					const response = await fetch(
						`${process.env.AUTH_SERVER}ldap/autenticar`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								login: login as string,
								senha: senha as string,
							}),
						}
					);
					if (response.status !== 200) {
						const text = await response.text();
						let message = 'Erro ao autenticar usuário';
						try {
							const contentType = response.headers.get('content-type') ?? '';
							if (contentType.includes('application/json')) {
								message = JSON.parse(text).message || message;
							}
						} catch { /* non-JSON error body */ }
						console.log(message);
						throw new Error(message);
					}
				}
				return {
					id: usuario.id,
					email: usuario.email,
					nome: usuario.nome,
					login: usuario.login || undefined,
					permissao: usuario.permissao,
					avatar: usuario.avatar || undefined,
					status: usuario.status,
				};
			},
		}),
	],
	callbacks: {
		// O padrão do Auth.js descarta caminhos relativos e cai na raiz do domínio,
		// fora do basePath do app. Aceita caminhos relativos e URLs do mesmo domínio;
		// qualquer outra coisa vai para o login do app.
		redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
			const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
			if (url.startsWith('/') && !url.startsWith('//')) {
				return `${baseUrl}${url.startsWith(basePath) ? url : `${basePath}${url}`}`;
			}
			try {
				if (new URL(url).origin === new URL(baseUrl).origin) return url;
			} catch { /* URL inválida */ }
			return `${baseUrl}${basePath}/login`;
		},
		// @eslint-disable-next-line
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async jwt({ token, user }: any) {
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.nome = user.nome;
				token.login = user.login;
				token.permissao = user.permissao;
				token.avatar = user.avatar;
				token.status = user.status;
			}
			return token;
		},
		// @eslint-disable-next-line
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async session({ session, token }: any) {
			session.user.id = token.id;
			session.user.email = token.email;
			session.user.nome = token.nome;
			session.user.login = token.login;
			session.user.permissao = token.permissao;
			session.user.avatar = token.avatar;
			session.user.status = token.status;
			return session;
		},
	},
	pages: {
		signIn: '/login',
		error: '/login',
	},
	trustHost: true,
};
