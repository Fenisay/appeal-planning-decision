/**
 * Health
 *
 * Create an endpoint on /health to check all dependent
 * resources
 */

const { createTerminus, HealthCheckError } = require('@godaddy/terminus');

const { promiseTimeout } = require('./utils');

module.exports = ({
  server,
  tasks,
  logger,
  timeout = 1000,
  onTerminate = null,
  terminationGrace = 5000,
}) =>
  createTerminus(server, {
    signal: 'SIGINT',
    healthChecks: {
      '/health': async () => {
        const startTime = Date.now();

        const results = (
          await Promise.allSettled(
            tasks.map(async (task) => {
              let isHealthy = false;

              try {
                isHealthy = await promiseTimeout(timeout, task.test());
              } catch (err) {
                logger.debug({ err, task }, 'Health check failed');
              }

              return {
                ...task,
                isHealthy,
              };
            })
          )
        ).map(({ value }) => value);

        const isHealthy = results.every(({ isHealthy: healthy }) => healthy);

        logger.debug({ isHealthy, elapsedTime: Date.now() - startTime }, 'Health check completed');

        if (!isHealthy) {
          throw new HealthCheckError('failed', results);
        }

        return results;
      },
    },
    async beforeShutdown() {
      if (terminationGrace > 0) {
        logger.info({ terminationGrace }, 'Pausing before shutdown');

        await new Promise((resolve) => setTimeout(resolve, terminationGrace));
      }
    },
    async onSignal() {
      if (onTerminate) {
        await onTerminate();
      }

      logger.fatal('Server going down');
    },
    logger(msg, err) {
      logger.error({ err }, msg);
    },
  });
