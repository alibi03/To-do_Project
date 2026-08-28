import type { Container } from "inversify";

import type { NotificationServerPort } from "../ports/InfrastructurePorts";
import createContainer from "./Container";
import ServiceIdentifiers from "./ServiceIdentifiers";

class CompositionRoot {
  private readonly container: Container;

  constructor() {
    this.container = createContainer();
  }

  resolveServer(): NotificationServerPort {
    return this.container.get<NotificationServerPort>(
      ServiceIdentifiers.NotificationServer
    );
  }
}

export default CompositionRoot;
