import "reflect-metadata";

import CompositionRoot from "./dependencyInjection/CompositionRoot";

async function main(): Promise<void> {
  const server = new CompositionRoot().resolveServer();
  await server.start();
}

void main().catch((error: unknown) => {
  console.error("Notification Service failed to start.", error);
  process.exitCode = 1;
});
