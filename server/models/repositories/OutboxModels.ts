import type { TaskEvent } from "../../contracts/events/TaskEvents";

class OutboxEventModel {
  constructor(
    readonly id: string,
    readonly payload: TaskEvent
  ) {}
}

export default OutboxEventModel;
