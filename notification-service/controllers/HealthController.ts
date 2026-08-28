import type { NextFunction, Request, Response } from "express";
import { injectable } from "inversify";

import type HealthResponse from "../models/responses/HealthResponse";
import type { HealthControllerPort } from "../ports/InfrastructurePorts";

@injectable()
class HealthController implements HealthControllerPort {
  readonly getStatus = async (
    _request: Request,
    response: Response<HealthResponse>,
    _next: NextFunction
  ): Promise<Response<HealthResponse>> => response.json({ status: "ok" });
}

export default HealthController;
