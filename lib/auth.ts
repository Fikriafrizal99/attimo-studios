import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const allowPublicSignup = process.env.ALLOW_PUBLIC_SIGNUP === "true";

if (isProduction && !connectionString) {
  throw new Error("DATABASE_URL is required in production.");
}
if (isProduction && (!authSecret || authSecret.length < 32)) {
  throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters in production.");
}

const pool = connectionString ? new Pool({ connectionString }) : undefined;

export const auth = betterAuth({
  database: pool,
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
          return { data: { ...user, email } };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: !allowPublicSignup,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  secret: authSecret,
  basePath: "/api/auth",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined),
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.PUBLIC_INVITATION_BASE_URL,
  ].filter((value): value is string => Boolean(value)),
  plugins: [nextCookies()],
});
