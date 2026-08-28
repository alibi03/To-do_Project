import { inject, injectable } from "inversify";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import type { SystemRepositoryPort } from "../ports/RepositoryPorts";
import type { HealthServicePort } from "../ports/ServicePorts";

@injectable()
class HealthService implements HealthServicePort {
  constructor(
    @inject(DependencySymbols.SystemRepository)
    private readonly systemRepository: SystemRepositoryPort
  ) {}

  async getDatabaseTime(): Promise<Date> {
    return this.systemRepository.getDatabaseTime();
  }
}

export default HealthService;
