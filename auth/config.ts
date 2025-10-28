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
						const responseJson = await response.json();
						console.log(responseJson.message);
						throw new Error(responseJson.message || 'Erro ao autenticar usuário');
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
