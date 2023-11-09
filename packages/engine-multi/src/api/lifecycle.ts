// here's here things get a bit complex event wise
import * as externalEvents from '../events';
import * as internalEvents from '../worker/events';
import { ExecutionContext } from '../types';

export const workflowStart = (
  context: ExecutionContext,
  event: internalEvents.WorkflowStartEvent
) => {
  const { state, logger } = context;
  const { workflowId, threadId } = event;

  logger.info('starting workflow ', workflowId);

  // where would this throw get caught?
  if (state.startTime) {
    // TODO this shouldn't throw.. but what do we do?
    // We shouldn't run a workflow that's been run
    // Every workflow should have a unique id
    // maybe the RTM doesn't care about this
    throw new Error(`Workflow with id ${workflowId} is already started`);
  }

  Object.assign(state, {
    status: 'running',
    startTime: Date.now(),
    duration: -1,
    threadId: threadId,
  });

  // TODO do we still want to push this into the active workflows array?
  // api.activeWorkflows.push(workflowId);

  // forward the event on to any external listeners
  context.emit(externalEvents.WORKFLOW_START, {
    threadId,
  });
};

export const workflowComplete = (
  context: ExecutionContext,
  event: internalEvents.WorkflowCompleteEvent
) => {
  const { logger, state } = context;
  const { workflowId, state: result, threadId } = event;

  logger.success('complete workflow ', workflowId);
  logger.info(state);

  // TODO I don't know how we'd get here in this architecture
  // if (!allWorkflows.has(workflowId)) {
  //   throw new Error(`Workflow with id ${workflowId} is not defined`);
  // }

  state.status = 'done';
  state.result = result;
  state.duration = Date.now() - state.startTime!;

  // TODO do we have to remove this from the active workflows array?
  // const idx = activeWorkflows.findIndex((id) => id === workflowId);
  // activeWorkflows.splice(idx, 1);

  // forward the event on to any external listeners
  context.emit(externalEvents.WORKFLOW_COMPLETE, {
    threadId,
    duration: state.duration,
    state: result,

    ...reason,
    // TODO add the id of the RUN that generated this reason
  });
};

export const jobStart = (
  context: ExecutionContext,
  event: internalEvents.JobStartEvent
) => {
  const { threadId, jobId } = event;

  context.emit(externalEvents.JOB_START, {
    jobId,
    threadId,
  });
};

export const jobComplete = (
  context: ExecutionContext,
  event: internalEvents.JobCompleteEvent
) => {
  const { threadId, state, duration, jobId } = event;

  context.emit(externalEvents.JOB_COMPLETE, {
    threadId,
    state,
    duration,
    jobId,
  });
};

export const log = (
  context: ExecutionContext,
  event: internalEvents.LogEvent
) => {
  const { threadId } = event;
  // // TODO not sure about this stuff, I think we can drop it?
  // const newMessage = {
  //   ...message,
  //   // Prefix the job id in all local jobs
  //   // I'm sure there are nicer, more elegant ways of doing this
  //   message: [`[${workflowId}]`, ...message.message],
  // };
  // TODO: if these are logs from within the runtime,
  // should we use context.runtimeLogger ?
  context.logger.proxy(event.message);

  context.emit(externalEvents.WORKFLOW_LOG, {
    threadId,
    ...event.message,
  });
};

export const error = (context: ExecutionContext, event: any) => {
  const { threadId = '-', error } = event;

  context.emit(externalEvents.WORKFLOW_ERROR, {
    threadId,
    type: error.type || error.name || 'ERROR',
    message: error.message || error.toString(),
  });
};
