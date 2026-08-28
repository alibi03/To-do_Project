interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password?: string;
}

interface RabbitMqConfig {
  url: string;
  exchange: string;
  queue: string;
  prefetch: number;
  maxRetries: number;
  retryDelayMilliseconds: number;
}

interface NotificationConfig {
  port: number;
  clientOrigin: string;
  jwtSecret: string;
  database: DatabaseConfig;
  rabbitMq: RabbitMqConfig;
}

export type { DatabaseConfig, NotificationConfig, RabbitMqConfig };
