import systemRepository from "../repositories/SystemRepository";

export class HealthService {
  async getDatabaseTime(): Promise<Date> {
    return systemRepository.getDatabaseTime();
  }
}

const healthService = new HealthService();

export default healthService;
