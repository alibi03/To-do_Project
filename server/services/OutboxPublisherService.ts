import Environment from "../config/Environment";
import RabbitMqPublisher from "../messaging/RabbitMqPublisher";
import outboxRepository from "../repositories/OutboxRepository";

class OutboxPublisherService {
  private readonly publisher = new RabbitMqPublisher();
  private timer: NodeJS.Timeout | null = null;
  private activeRun: Promise<void> | null = null;
  private running = false;

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
          this.schedule(Environment.outboxPollIntervalMilliseconds);
        }
      });
    }, delay);
  }

  private async publishPending(): Promise<void> {
    try {
      for (
        let processed = 0;
        processed < Environment.outboxBatchSize;
        processed += 1
      ) {
        const [event] = await outboxRepository.claimPending(1);

        if (!event) {
          return;
        }

        try {
          await this.publisher.publish(event.payload);
          await outboxRepository.markPublished(event.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await outboxRepository.markFailed(event.id, message);
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

const outboxPublisherService = new OutboxPublisherService();

export default outboxPublisherService;
