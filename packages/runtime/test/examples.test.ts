import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'ava';
import run from '../src/index';

test('simple state transformation', async (t) => {
  const p = path.resolve('test/examples/simple-state-transformation.js');
  const source = await readFile(p, 'utf8');
  const result = await run(source);
  // @ts-ignore
  t.assert(result.data.count === 10);
});

// test('should not be able to read process', async (t) => {
//   const source = 'console.log(process.env)';
//   const result  = await run(source);
// });

// test('should throw when trying to import node process', async (t) => {});

// test('should throw when trying to import node process via alias', async (t) => {});