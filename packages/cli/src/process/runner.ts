import parse, { Opts } from '../commands';

type InitMessage = {
  init: true;
  basePath: string;
  opts: Opts;
};

// When receiving a message as a child process, we pull out the args and run
process.on('message', ({ init, basePath, opts }: InitMessage) => {
  if (init) {
    parse(basePath, opts).then(() => {
      process.send!({ done: true });
    });
  }
});

// Tell the parent process we're awake and ready
process.send!({
  init: true
})
