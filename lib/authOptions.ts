import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { findOrCreateGoogleUser, findUserByEmail } from "./db";

/**
 * JWT session strategy — no NextAuth database adapter, no accounts/sessions
 * tables. The only thing we persist ourselves is the `users` table (lib/db.ts),
 * used directly inside the Credentials provider's authorize() and via
 * findOrCreateGoogleUser() in the signIn callback below. This keeps the schema
 * to exactly one table instead of the adapter's full accounts/sessions/
 * verification_token set, which this app has no other use for.
 */
export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await findUserByEmail(credentials.email);
        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    // Google's sign-in flow doesn't go through the Credentials authorize()
    // above, so this is where a Google account gets its own row in `users`
    // (or matched to an existing one by email) the first time someone signs
    // in with it — same table backs both providers.
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await findOrCreateGoogleUser(user.name ?? "Google User", user.email);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
};
