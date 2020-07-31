import { Task } from './';
import FastPriorityQueue from 'fastpriorityqueue';
export declare class TaskQueue {
    queue: FastPriorityQueue<Task<any>>;
    max_priority: number;
    count: number;
    trimCount: number;
    constructor(trim?: number);
    add(task: Task<any>): void;
    private push;
    delete(task: Task<any>): Task<any>;
    pop(): Task<any>;
    empty(): boolean;
    size(): number;
}
