import { Task } from './';

import FastPriorityQueue from 'fastpriorityqueue';

export class TaskQueue {
  queue: FastPriorityQueue<Task<any>>
  max_priority: number
  count: number
  trimCount: number

  constructor(trim: number = 256) {
    this.queue = new FastPriorityQueue<Task<any>>(function (t1: Task<any>, t2: Task<any>) {
      if (t1.config.priority != t2.config.priority) {
        return t1.config.priority < t2.config.priority
      }
      return t1.__id__ < t2.__id__
    })
    this.max_priority = 0
    this.count = 0
    this.trimCount = trim
  }

  add(task: Task<any>) {
    if (this.count++ % this.trimCount === 0) this.queue.trim()
    if (task.config.priority !== null) {
      this.max_priority = Math.max(task.config.priority + 1, this.max_priority);
      this.queue.add(task);
    } else {
      this.push(task);
    }

  }

  private push(task: Task<any>) {
    if (this.count++ % this.trimCount === 0) this.queue.trim();
    this.max_priority++;
    task.config.priority = this.max_priority;
    this.queue.add(task);
  }

  delete(task: Task<any>): Task<any> {
    if (this.count++ % this.trimCount === 0) this.queue.trim();
    if (this.queue.remove(task)) {
      return task;
    }
    return null;
  }

  pop(): Task<any> {
    if (this.count++ % this.trimCount === 0) this.queue.trim();
    const task = this.queue.poll();
    if (task) {
      return task;
    }
    return null;
  }

  empty(): boolean {
    return this.queue.isEmpty();
  }

  size(): number {
    return this.queue.size;
  }
}