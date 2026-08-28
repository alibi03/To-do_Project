import { inject, injectable } from "inversify";

import type { ApplicationConfig } from "../config/ApplicationConfig";
import DependencySymbols from "../dependencyInjection/DependencySymbols";
import type { TaskEventPublisherPort } from "../ports/InfrastructurePorts";
import type { OutboxRepositoryPort } from "../ports/RepositoryPorts";
import type { OutboxPublisherServicePort } from "../ports/ServicePorts";

@injectable()
class OutboxPublisherService implements OutboxPublisherServicePort {
  private timer: NodeJS.Timeout | null = null;
  private activeRun: Promise<void> | null = null;
  private running = false;

  constructor(
    @inject(DependencySymbols.OutboxRepository)
    private readonly outboxRepository: OutboxRepositoryPort,
    @inject(DependencySymbols.TaskEventPublisher)
    private readonly publisher: TaskEventPublisherPort,
    @inject(DependencySymbols.ApplicationConfig)
    private readonly config: ApplicationConfig
  ) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.schedule(0);
  }

  async stop(): Promise<void> {
    this.running = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    await this.activeRun;
    await this.publisher.close();
  }

  private schedule(delay: number): void {
    this.timer = setTimeout(() => {
      this.activeRun = this.publishPending().finally(() => {
        this.activeRun = null;

        if (this.running) {
          this.schedule(this.config.outbox.pollIntervalMilliseconds);
        }
      });
    }, delay);
  }

  private async publishPending(): Promise<void> {
    try {
      for (
        let processed = 0;
        processed < this.config.outbox.batchSize;
        processed += 1
      ) {
        const [event] = await this.outboxRepository.claimPending(1);

        if (!event) {
          return;
        }

        try {
          await this.publisher.publish(event.payload);
          await this.outboxRepository.markPublished(event.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await this.outboxRepository.markFailed(event.id, message);
          console.error(
            `Could not publish outbox event ${event.id}; it will be retried.`,
            message
          );
          break;
        }
      }
    } catch (error) {
      console.error("Could not process pending outbox events.", error);
    }
  }
}

export default OutboxPublisherService;
