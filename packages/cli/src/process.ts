/**
 * Utility to run CLI commands inside a child process
 * This lets us hide the neccessary arguments needed to run our devtools
 */
import path from 'node:path';
import { fork } from "node:child_process";
import type { Opts } from './execute';

// The default export will create a new child process which calls itself
export default function (basePath: string, opts: Opts) {
  const execArgv = [
    '--no-warnings',
    '--experimental-vm-modules',
    '--experimental-specifier-resolution=node',
  ];
  
  const child = fork(path.resolve('dist/child-process.js'), [], { execArgv });

  child.on('message', ({ done }: { done: boolean}) => {
    if (done) {
      child.kill();
      process.exit(0)
    }
  })
  child.send({ basePath, opts })
};

