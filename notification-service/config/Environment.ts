import "dotenv/config";

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

type NodeEnvironment = "development" | "production" | "test";

class Environment {
  private static readString(name: string, fallback?: string): string {
    const value = process.env[name]?.trim() || fallback;

    if (!value) {
      throw new ConfigurationError(`${name} is required.`);
    }

    return value;
  }

  private static readPositiveInteger(
    name: string,
    fallback: number,
    maximum = Number.MAX_SAFE_INTEGER
  ): number {
    const rawValue = process.env[name]?.trim();
    const value =
      rawValue === undefined || rawValue === ""
        ? fallback
        : Number(rawValue);

    if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) {
      throw new ConfigurationError(
        `${name} must be an integer between 1 and ${maximum}.`
      );
    }

    return value;
  }

  static get port(): number {
    return this.readPositiveInteger("PORT", 3001, 65_535);
  }

  static get nodeEnvironment(): NodeEnvironment {
    const value = process.env.NODE_ENV?.trim() || "production";

    if (
      value !== "development" &&
      value !== "production" &&
      value !== "test"
    ) {
      throw new ConfigurationError(
        "NODE_ENV must be development, production, or test."
      );
    }

    return value;
  }

  static get clientOrigin(): string {
    const value = this.readString("CLIENT_ORIGIN", "http://localhost:5173");

    try {
      const url = new URL(value);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported protocol.");
      }

      return url.origin;
    } catch {
      throw new ConfigurationError(
        "CLIENT_ORIGIN must be a valid HTTP origin."
      );
    }
  }

  static get databaseHost(): string {
    return this.readString("DB_HOST", "127.0.0.1");
  }

  static get databasePort(): number {
    return this.readPositiveInteger("DB_PORT", 5432, 65_535);
  }

  static get databaseName(): string {
    return this.readString("DB_NAME", "staj_notifications");
  }

  static get databaseUser(): string {
    return this.readString("DB_USER");
  }

  static get databasePassword(): string | undefined {
    return process.env.DB_PASSWORD || undefined;
  }

  static get jwtSecret(): string {
    const secret = this.readString("JWT_SECRET");

    if (secret.length < 32) {
      throw new ConfigurationError(
        "JWT_SECRET must contain at least 32 characters."
      );
    }

    return secret;
  }

  static get rabbitMqUrl(): string {
    const value = this.readString(
      "RABBITMQ_URL",
      "amqp://127.0.0.1:5672"
    );

    try {
      const url = new URL(value);

      if (url.protocol !== "amqp:" && url.protocol !== "amqps:") {
        throw new Error("Unsupported protocol.");
      }
    } catch {
      throw new ConfigurationError("RABBITMQ_URL must be a valid AMQP URL.");
    }

    return value;
  }

  static get rabbitMqExchange(): string {
    return this.readString("RABBITMQ_EXCHANGE", "staj.task.events");
  }

  static get rabbitMqQueue(): string {
    return this.readString(
      "RABBITMQ_QUEUE",
      "staj.notification-service.task-events.v1"
    );
  }

  static get rabbitMqPrefetch(): number {
    return this.readPositiveInteger("RABBITMQ_PREFETCH", 10, 1_000);
  }

  static get rabbitMqMaxRetries(): number {
    return this.readPositiveInteger("RABBITMQ_MAX_RETRIES", 5, 20);
  }

  static get rabbitMqRetryDelayMs(): number {
    return this.readPositiveInteger(
      "RABBITMQ_RETRY_DELAY_MS",
      5_000,
      3_600_000
    );
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
    void this.rabbitMqUrl;
    void this.rabbitMqExchange;
    void this.rabbitMqQueue;
    void this.rabbitMqPrefetch;
    void this.rabbitMqMaxRetries;
    void this.rabbitMqRetryDelayMs;
  }
}

export { ConfigurationError };
export default Environment;
