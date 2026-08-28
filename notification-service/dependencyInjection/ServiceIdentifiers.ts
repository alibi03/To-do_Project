const ServiceIdentifiers = {
  ApplicationFactory: Symbol.for("NotificationService.ApplicationFactory"),
  AuthenticationMiddleware: Symbol.for(
    "NotificationService.AuthenticationMiddleware"
  ),
  Config: Symbol.for("NotificationService.Config"),
  Database: Symbol.for("NotificationService.Database"),
  DatabasePool: Symbol.for("NotificationService.DatabasePool"),
  ErrorMiddleware: Symbol.for("NotificationService.ErrorMiddleware"),
  HealthController: Symbol.for("NotificationService.HealthController"),
  IdGenerator: Symbol.for("NotificationService.IdGenerator"),
  MigrationRunner: Symbol.for("NotificationService.MigrationRunner"),
  NotificationController: Symbol.for(
    "NotificationService.NotificationController"
  ),
  NotificationRepository: Symbol.for(
    "NotificationService.NotificationRepository"
  ),
  NotificationRouter: Symbol.for("NotificationService.NotificationRouter"),
  NotificationServer: Symbol.for("NotificationService.NotificationServer"),
  NotificationService: Symbol.for("NotificationService.NotificationService"),
  NotificationLimitParser: Symbol.for(
    "NotificationService.NotificationLimitParser"
  ),
  RabbitMqConnectionFactory: Symbol.for(
    "NotificationService.RabbitMqConnectionFactory"
  ),
  RetryPublisher: Symbol.for("NotificationService.RetryPublisher"),
  TaskEventConsumer: Symbol.for("NotificationService.TaskEventConsumer"),
  TaskEventParser: Symbol.for("NotificationService.TaskEventParser"),
  TokenService: Symbol.for("NotificationService.TokenService"),
} as const;

export default ServiceIdentifiers;
