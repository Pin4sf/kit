// Dedicated worker for running jobs
// Security thoughts: the process inherits the node command arguments
// (it has to for experimental modules to work)
// Is this a concern? If secrets are passed in they could be visible
// The sandbox should help

// What about imports in a worker thread?
// Is there an overhead in reimporting stuff (presumably!)
// Should we actually be pooling workers by adaptor[+version]
// Does this increase the danger of sharing state between jobs?
// Suddenly it's a liability for the same environent in the same adaptor
// to be running the same jobs - break out of the sandbox and who knows what you can get
import workerpool from 'workerpool';
import run from '@openfn/runtime';
import type { ExecutionPlan } from '@openfn/runtime';
import helper, { createLoggers, publish } from './worker-helper';
import { NotifyEvents } from '@openfn/runtime';

workerpool.worker({
  // startup validation script
  handshake: () => true,

  run: (
    plan: ExecutionPlan,
    adaptorPaths: Record<string, { path: string }>
  ) => {
    const { logger, jobLogger } = createLoggers(plan.id!);
    const options = {
      logger,
      jobLogger,
      linker: {
        modules: adaptorPaths,
        whitelist: [/^@openfn/],
      },
      callbacks: {
        // TODO: this won't actually work across the worker boundary
        // For now I am preloading credentials
        // resolveCredential: async (id: string) => {
        // },
        notify: (name: NotifyEvents, payload: any) => {
          // convert runtime notify events to internal engine events
          publish(plan.id!, `worker:${name}`, payload);
        },
      },
    };

    return helper(plan.id!, () => run(plan, undefined, options));
  },
});
