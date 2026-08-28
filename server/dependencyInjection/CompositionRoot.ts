import type { Container } from "inversify";
import type { Pool } from "pg";

import type {
  MigrationRunnerPort,
  TodoServerPort,
} from "../ports/InfrastructurePorts";
import createContainer from "./Container";
import DependencySymbols from "./DependencySymbols";

class CompositionRoot {
  private readonly container: Container;

  constructor() {
    this.container = createContainer();
  }

  resolveServer(): TodoServerPort {
    return this.container.get<TodoServerPort>(DependencySymbols.TodoServer);
  }

  resolveMigrationRunner(): MigrationRunnerPort {
    return this.container.get<MigrationRunnerPort>(
      DependencySymbols.MigrationRunner
    );
  }

  resolvePool(): Pool {
    return this.container.get<Pool>(DependencySymbols.Pool);
  }
}

export default CompositionRoot;
