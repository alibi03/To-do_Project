import type { Request, Response } from "express";

import HealthResponseModel from "../models/responses/HealthResponse";
import healthService from "../services/HealthService";

async function getStatus(
  _request: Request,
  response: Response<HealthResponseModel>
): Promise<Response<HealthResponseModel>> {
  const databaseTime = await healthService.getDatabaseTime();
  return response.json(new HealthResponseModel(databaseTime));
}

export { getStatus };
