function startAfterReady(databaseReady, startServer) {
  return Promise.resolve(databaseReady).then(startServer);
}

function closeHttpServer(server) {
  if (!server?.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

function registerShutdownHandlers({
  server,
  closeDatabase,
  processLike = process,
  onError = console.error,
}) {
  let shutdownPromise;
  const shutdown = () => {
    if (!shutdownPromise) {
      shutdownPromise = closeHttpServer(server)
        .then(closeDatabase)
        .catch((error) => {
          processLike.exitCode = 1;
          onError(error);
        });
    }
    return shutdownPromise;
  };

  processLike.once('SIGINT', shutdown);
  processLike.once('SIGTERM', shutdown);
  return shutdown;
}

module.exports = { startAfterReady, registerShutdownHandlers };
