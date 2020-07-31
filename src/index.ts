export * from './logger';
import { TaskQueue } from './queue';

import { EventEmitter } from 'events';

export enum TaskStatus {
  PENDING = 0,
  RUNNING = 1,
  SUCCESS = 2,
  FAILURE = 3,
}

export interface TaskConfig {
  priority?: number
  retry?: number
}

enum FuncType {
  THEN = 0,
  CATCH = 1,
  FINALLY = 2,
}

let __id__ = 0;

export class Task<T> {
  __id__: number
  func: (() => Promise<T>)
  config: TaskConfig

  status: TaskStatus

  private thenFunc: Array<{
    onfulfilled: ((value: T) => Promise<T>) | undefined | null,
    onrejected?: (reason: any) => never | Promise<never>
  }>
  private catchFunc: Array<((reason: any) => never | Promise<never>) | undefined | null>
  private finallyFunc: Array<(() => void | Promise<void>) | undefined | null>
  private funcTypes: Array<FuncType>

  constructor(func: (() => Promise<T>), config?: TaskConfig) {
    this.__id__ = __id__;
    __id__++;

    this.func = func;
    this.config = { ...{ retry: 0 }, ...config };
    this.status = TaskStatus.PENDING;

    this.thenFunc = [];
    this.catchFunc = [];
    this.finallyFunc = [];
    this.funcTypes = [];
  }
  then(onfulfilled?: ((value: T) => Promise<T>) | undefined | null, onrejected?: ((reason: any) => never | Promise<never>) | undefined | null) {
    this.thenFunc.push({
      onfulfilled,
      onrejected
    });
    this.funcTypes.push(FuncType.THEN);
    return this;
  }
  catch(onrejected?: ((reason: any) => never | Promise<never>) | undefined | null) {
    this.catchFunc.push(onrejected);
    this.funcTypes.push(FuncType.CATCH);
    return this;
  }
  finally(onfinally: (() => void | Promise<void>) | undefined | null) {
    this.finallyFunc.push(onfinally);
    this.funcTypes.push(FuncType.FINALLY);
    return this;
  }

  async run(): Promise<TaskStatus> {
    let status = TaskStatus.SUCCESS;
    try {
      let runner = this.func();
      for (const type of this.funcTypes) {
        switch (type) {
          case FuncType.THEN:
            const thenF = this.thenFunc.shift();
            runner = runner.then(thenF.onfulfilled, thenF.onrejected);
            break;
          case FuncType.CATCH:
            runner = runner.catch(this.catchFunc.shift());
            break;
          case FuncType.FINALLY:
            runner = runner.finally(this.finallyFunc.shift());
            break;
        }
      }
      await runner;
    } catch (e) {
      console.error(e);
      status = TaskStatus.FAILURE;
    }
    return status;
  }
}

export function T<T>(func: (() => Promise<T>), config?: TaskConfig) {
  const task = new Task(func, config);
  return task;
}

export interface TaskRunnerConfig {
  maxRunning?: number
}

export class TaskRunner<T> extends EventEmitter {
  private config: TaskRunnerConfig
  private maxPriority: number

  private pending: TaskQueue
  private running: TaskQueue
  private success: number
  private failure: number

  constructor(config?: TaskRunnerConfig) {
    super();
    this.pending = new TaskQueue();
    this.running = new TaskQueue();
    this.success = 0;
    this.failure = 0;

    this.config = {
      ...{
        maxRunning: 0
      },
      ...config
    }
    this.maxPriority = 0;

    this.on('taskChange', this.onTaskChange);
  }
  add(task: Task<any>) {
    if (!task.config.priority) {
      task.config.priority = this.maxPriority;
      this.maxPriority++;
    } else {
      this.maxPriority = Math.max(task.config.priority + 1, this.maxPriority);
    }
    this.pending.add(task);
  }
  addList(tasks: Iterable<any>) {
    for (const task of tasks) {
      this.add(task);
    }
  }
  async all() {
    await this.start();
    await this.waitIdle();
  }
  async start() {
    await this.onTaskChange();
  }
  async waitIdle() {
    const pendingCount = this.getPendingLength();
    const runningCount = this.getRunningLength();
    if (pendingCount == 0 && runningCount == 0) {
      return;
    }
    return new Promise((resolve, reject) => {
      this.on('onIdle', () => {
        resolve();
      });
    });
  }
  private async onTaskChange() {
    let pendingCount = this.getPendingLength();
    let runningCount = this.getRunningLength();
    if (pendingCount == 0 && runningCount == 0) {
      this.emit('onIdle');
      return;
    }

    while ((runningCount < this.config.maxRunning || this.config.maxRunning <= 0) && pendingCount > 0) {
      const task = this.pending.pop();
      this.running.add(task);
      task.run().then((status) => {
        this.running.delete(task);
        if (status == TaskStatus.SUCCESS) {
          this.success++;
        } else if (status == TaskStatus.FAILURE && task.config.retry > 0) {
          task.config.retry--;
          this.add(task);
        } else {
          this.failure++;
        }
        this.emit('taskChange');
      })

      runningCount++;
      pendingCount--;
    }
  }

  getSuccessLength() {
    return this.success;
  }
  getFailureLength() {
    return this.failure;
  }
  getRunningLength() {
    return this.running.size();
  }
  getPendingLength() {
    return this.pending.size();
  }
}

export async function R(values: Iterable<any>, config?: TaskRunnerConfig) {
  const taskRunner = new TaskRunner(config);
  taskRunner.addList(values);
  return await taskRunner.all();
}
