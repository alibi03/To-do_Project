interface HealthResponse {
  server: "ok";
  database: "connected";
  databaseTime: string;
}

export default HealthResponse;
