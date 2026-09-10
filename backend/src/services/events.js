import TaskEvent from '../models/TaskEvent.js';

export function recordEvent({ user, task = null, eventType, previousValue, newValue, metadata }) {
  return TaskEvent.create({ user, task, eventType, previousValue, newValue, metadata });
}
