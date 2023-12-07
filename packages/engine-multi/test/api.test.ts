import test from 'ava';
import createAPI from '../src/api';
import { createMockLogger } from '@openfn/logger';
import { PURGE } from '../src/events';

import pkg from '../package.json' assert { type: 'json' };
import { RuntimeEngine } from '../src/types';

// thes are tests on the public api functions generally
// so these are very high level tests and don't allow mock workers or anything

const logger = createMockLogger(undefined, { level: 'debug' });
let api: RuntimeEngine;

test.afterEach(() => {
  logger._reset();
  api?.destroy();
});

test.serial('create a default engine api without throwing', async (t) => {
  api = await createAPI();
  t.pass();
});

test.serial('create an engine api with options without throwing', async (t) => {
  api = await createAPI({ logger });
  // just a token test to see if the logger is accepted and used
  t.true(logger._history.length > 0);
});

test.serial('create an engine api with a limited surface', async (t) => {
  api = await createAPI({ logger });
  const keys = Object.keys(api).sort();

  // TODO the api will actually probably get a bit bigger than this
  t.deepEqual(keys, ['execute', 'listen', 'on', 'destroy', 'version'].sort());
});

test.serial('engine api includes a version number', async (t) => {
  api = await createAPI({ logger });
  t.is(api.version, pkg.version);
});

// Note that this runs with the actual runtime worker
// I won't want to do deep testing on execute here - I just want to make sure the basic
// exeuction functionality is working. It's more a test of the api surface than the inner
// workings of the job
test.serial(
  'execute should return an event listener and receive workflow-complete',
  async (t) => {
    return new Promise(async (done) => {
      api = await createAPI({
        logger,
        // Disable compilation
        compile: {
          skip: true,
        },
      });

      const plan = {
        id: 'a',
        jobs: [
          {
            expression: 'export default [s => s]',
            // with no adaptor it shouldn't try to autoinstall
          },
        ],
      };

      const listener = api.execute(plan);
      listener.on('workflow-complete', () => {
        t.pass('workflow completed');
        done();
      });
    });
  }
);

test.serial('should listen to workflow-complete', async (t) => {
  return new Promise(async (done) => {
    api = await createAPI({
      logger,
      // Disable compilation
      compile: {
        skip: true,
      },
    });

    const plan = {
      id: 'a',
      jobs: [
        {
          expression: 'export default [s => s]',
          // with no adaptor it shouldn't try to autoinstall
        },
      ],
    };

    api.execute(plan);
    api.listen(plan.id, {
      'workflow-complete': () => {
        t.pass('workflow completed');
        done();
      },
    });
  });
});

test.serial('should purge workers after a single run', async (t) => {
  return new Promise(async (done) => {
    api = await createAPI({
      logger,
      // Disable compilation
      compile: {
        skip: true,
      },
    });

    const plan = {
      id: 'a',
      jobs: [
        {
          expression: 'export default [s => s]',
          // with no adaptor it shouldn't try to autoinstall
        },
      ],
    };

    api.on(PURGE, () => {
      t.pass('workers purged');
      done();
    });

    api.execute(plan);
  });
});
