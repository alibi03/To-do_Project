import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import type HealthResponse from "../models/responses/HealthResponse";
import type { HealthServicePort } from "../ports/ServicePorts";

@injectable()
class HealthController {
  constructor(
    @inject(DependencySymbols.HealthService)
    private readonly healthService: HealthServicePort
  ) {}

  readonly getStatus = async (
    _request: Request,
    response: Response<HealthResponse>
  ): Promise<Response<HealthResponse>> => {
    const databaseTime = await this.healthService.getDatabaseTime();

    return response.json({
      server: "ok",
      database: "connected",
      databaseTime: databaseTime.toISOString(),
    });
  };
}

export default HealthController;
