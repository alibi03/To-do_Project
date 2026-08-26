class HealthResponseModel {
  readonly server = "ok" as const;
  readonly database = "connected" as const;

  constructor(readonly databaseTime: Date) {}
}

export default HealthResponseModel;
