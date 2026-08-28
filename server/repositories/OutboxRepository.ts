import { inject, injectable } from "inversify";
import type { Pool, PoolClient } from "pg";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import type { TaskEvent } from "../contracts/events/TaskEvents";
import OutboxEventModel from "../models/repositories/OutboxModels";
import type { OutboxRepositoryPort } from "../ports/RepositoryPorts";

type OutboxDatabaseRecord = {
  id: string;
  payload: TaskEvent;
};

@injectable()
class OutboxRepository implements OutboxRepositoryPort {
  constructor(
    @inject(DependencySymbols.Pool) private readonly pool: Pool
  ) {}

  async add(client: PoolClient, events: TaskEvent[]): Promise<void> {
    for (const event of events) {
      await client.query(
        `INSERT INTO outbox_events
           (id, aggregate_type, aggregate_id, event_type, payload, occurred_at)
         VALUES ($1, 'task', $2, $3, $4::jsonb, $5)`,
        [
          event.eventId,
          event.taskId,
          event.eventType,
          JSON.stringify(event),
          event.occurredAt,
        ]
      );
    }
  }

  async claimPending(limit: number): Promise<OutboxEventModel[]> {
    const result = await this.pool.query<OutboxDatabaseRecord>(
      `WITH pending AS (
         SELECT id
         FROM outbox_events
         WHERE published_at IS NULL
           AND (
             claimed_at IS NULL
             OR claimed_at < CURRENT_TIMESTAMP - INTERVAL '1 minute'
           )
         ORDER BY occurred_at ASC, id ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       )
       UPDATE outbox_events event
       SET claimed_at = CURRENT_TIMESTAMP,
           attempts = event.attempts + 1
       FROM pending
       WHERE event.id = pending.id
       RETURNING event.id, event.payload`,
      [limit]
    );

    return result.rows.map(
      (record) => new OutboxEventModel(record.id, record.payload)
    );
  }

  async markPublished(eventId: string): Promise<void> {
    await this.pool.query(
      `UPDATE outbox_events
       SET published_at = CURRENT_TIMESTAMP,
           claimed_at = NULL,
           last_error = NULL
       WHERE id = $1`,
      [eventId]
    );
  }

  async markFailed(eventId: string, message: string): Promise<void> {
    await this.pool.query(
      `UPDATE outbox_events
       SET claimed_at = NULL,
           last_error = $2
       WHERE id = $1`,
      [eventId, message.slice(0, 2000)]
    );
  }
}

export default OutboxRepository;
