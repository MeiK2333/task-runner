/// <reference types="node" />
export * from './logger';
import { EventEmitter } from 'events';
export declare enum TaskStatus {
    PENDING = 0,
    RUNNING = 1,
    SUCCESS = 2,
    FAILURE = 3
}
export interface TaskConfig {
    priority?: number;
    retry?: number;
}
export declare class Task<T> {
    __id__: number;
    func: (() => Promise<T>);
    config: TaskConfig;
    status: TaskStatus;
    private thenFunc;
    private catchFunc;
    private finallyFunc;
    private funcTypes;
    constructor(func: (() => Promise<T>), config?: TaskConfig);
    then(onfulfilled?: ((value: T) => Promise<T>) | undefined | null, onrejected?: ((reason: any) => never | Promise<never>) | undefined | null): this;
    catch(onrejected?: ((reason: any) => never | Promise<never>) | undefined | null): this;
    finally(onfinally: (() => void | Promise<void>) | undefined | null): this;
    run(): Promise<TaskStatus>;
}
export declare function T<T>(func: (() => Promise<T>)): Task<T>;
export interface TaskRunnerConfig {
    maxRunning?: number;
}
export declare class TaskRunner<T> extends EventEmitter {
    private config;
    private maxPriority;
    private pending;
    private running;
    private success;
    private failure;
    constructor(config?: TaskRunnerConfig);
    add(task: Task<any>): void;
    addList(tasks: Iterable<any>): void;
    all(): Promise<void>;
    start(): Promise<void>;
    waitIdle(): Promise<unknown>;
    private onTaskChange;
    getSuccessLength(): number;
    getFailureLength(): number;
    getRunningLength(): number;
    getPendingLength(): number;
}
export declare function R(values: Iterable<any>, config?: TaskRunnerConfig): Promise<void>;
