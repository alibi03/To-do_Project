import "dotenv/config";

import { ConfigurationError } from "../errors/ApplicationErrors";

type NodeEnvironment = "development" | "production" | "test";

class Environment {
  private static requireValue(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
      throw new ConfigurationError(`${name} is required.`);
    }

    return value;
  }

  private static readPositiveInteger(name: string, fallback: number): number {
    const value = Number(process.env[name] ?? fallback);

    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new ConfigurationError(`${name} must be a positive integer.`);
    }

    return value;
  }

  static get port(): number {
    return this.readPositiveInteger("PORT", 3000);
  }

  static get nodeEnvironment(): NodeEnvironment {
    const value = process.env.NODE_ENV ?? "production";

    if (
      value !== "development" &&
      value !== "production" &&
      value !== "test"
    ) {
      throw new ConfigurationError("NODE_ENV must be development, test, or production.");
    }

    return value;
  }

  static get clientOrigin(): string {
    const value = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

    try {
      const origin = new URL(value);

      if (origin.protocol !== "http:" && origin.protocol !== "https:") {
        throw new Error();
      }

      return origin.origin;
    } catch {
      throw new ConfigurationError("CLIENT_ORIGIN must be a valid HTTP origin.");
    }
  }

  static get databaseHost(): string {
    return process.env.DB_HOST?.trim() || "127.0.0.1";
  }

  static get databasePort(): number {
    return this.readPositiveInteger("DB_PORT", 5432);
  }

  static get databaseName(): string {
    return this.requireValue("DB_NAME");
  }

  static get databaseUser(): string {
    return this.requireValue("DB_USER");
  }

  static get databasePassword(): string | undefined {
    return process.env.DB_PASSWORD || undefined;
  }

  static get jwtSecret(): string {
    const secret = this.requireValue("JWT_SECRET");

    if (secret.length < 32) {
      throw new ConfigurationError(
        "JWT_SECRET must contain at least 32 characters."
      );
    }

    return secret;
  }

  static get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN ?? "1h";
  }

  static get exposesPasswordResetCode(): boolean {
    return this.nodeEnvironment === "development";
  }

  static validate(): void {
    void this.port;
    void this.nodeEnvironment;
    void this.clientOrigin;
    void this.databaseHost;
    void this.databasePort;
    void this.databaseName;
    void this.databaseUser;
    void this.jwtSecret;
  }
}

export default Environment;
