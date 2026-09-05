import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function ask(label: string) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(label)).trim();
  } finally {
    rl.close();
  }
}

async function askHidden(label: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Interactive TTY required for hidden password input.");
  }

  stdout.write(label);
  stdin.setEncoding("utf8");
  stdin.setRawMode(true);
  stdin.resume();

  return await new Promise<string>((resolve, reject) => {
    let value = "";

    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
    };

    const onData = (chunk: string | Buffer) => {
      for (const char of String(chunk)) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Cancelled"));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        if (char >= " ") {
          value += char;
          stdout.write("*");
        }
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be configured before bootstrapping the operator account.");
  }
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters.");
  }

  const suppliedEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const email = suppliedEmail || (await ask("Operator email: ")).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("A valid operator email is required.");

  const suppliedName = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const promptedName = suppliedName ? "" : await ask("Operator name [Admin]: ");
  const name = suppliedName || promptedName || "Admin";

  const password = await askHidden("Password (hidden): ");
  const confirmation = await askHidden("Confirm password: ");
  if (password !== confirmation) throw new Error("Passwords do not match.");
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must be between 8 and 128 characters.");
  }

  // This only affects this private CLI process. It does not enable public HTTP signup.
  process.env.ALLOW_PUBLIC_SIGNUP = "true";
  process.env.BETTER_AUTH_URL ||= "http://localhost:3000";
  process.env.NEXT_PUBLIC_APP_URL ||= process.env.BETTER_AUTH_URL;

  const { auth } = await import("../lib/auth");
  const result = await auth.api.signUpEmail({
    body: { email, name, password },
  });

  stdout.write(`Operator created: ${result.user.email} (${result.user.id})\n`);
  stdout.write("Public signup remains controlled by the deployment ALLOW_PUBLIC_SIGNUP setting.\n");

  // Better Auth owns a pg Pool; explicit exit keeps this one-shot CLI from waiting on idle connections.
  process.exit(0);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Bootstrap failed: ${message}`);
  process.exit(1);
});
