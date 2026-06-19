import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;

        const res = await fetch(`${API_URL}/api/v1/iam/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credentials.email, senha: credentials.senha }),
        });

        if (!res.ok) return null;

        const { accessToken, user } = await res.json();
        return { id: user.sub, accessToken, ...user };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.userId      = (user as any).sub;
        token.tenantId    = (user as any).tenantId;
        token.roles       = (user as any).roles;
        token.name        = (user as any).name;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        userId:      token.userId,
        tenantId:    token.tenantId,
        roles:       token.roles,
      };
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8h — igual ao JWT da API
  },
};
