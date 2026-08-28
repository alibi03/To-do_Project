interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password?: string;
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
  exposePasswordResetCode: boolean;
}

interface RabbitMqConfig {
  url: string;
  taskEventsExchange: string;
}

interface OutboxConfig {
  pollIntervalMilliseconds: number;
  batchSize: number;
}

interface ApplicationConfig {
  port: number;
  clientOrigin: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  rabbitMq: RabbitMqConfig;
  outbox: OutboxConfig;
}

export type {
  ApplicationConfig,
  DatabaseConfig,
  JwtConfig,
  OutboxConfig,
  RabbitMqConfig,
};
