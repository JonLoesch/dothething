import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

async function requireAuth() {
  if (!(await auth())) {
    await signIn(undefined);
  }
}

export { auth, requireAuth, handlers, signIn, signOut };
