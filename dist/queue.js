"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueue = void 0;
const tslib_1 = require("tslib");
const fastpriorityqueue_1 = tslib_1.__importDefault(require("fastpriorityqueue"));
class TaskQueue {
    constructor(trim = 256) {
        this.queue = new fastpriorityqueue_1.default(function (t1, t2) {
            if (t1.config.priority != t2.config.priority) {
                return t1.config.priority < t2.config.priority;
            }
            return t1.__id__ < t2.__id__;
        });
        this.max_priority = 0;
        this.count = 0;
        this.trimCount = trim;
    }
    add(task) {
        if (this.count++ % this.trimCount === 0)
            this.queue.trim();
        if (task.config.priority !== null) {
            this.max_priority = Math.max(task.config.priority + 1, this.max_priority);
            this.queue.add(task);
        }
        else {
            this.push(task);
        }
    }
    push(task) {
        if (this.count++ % this.trimCount === 0)
            this.queue.trim();
        this.max_priority++;
        task.config.priority = this.max_priority;
        this.queue.add(task);
    }
    delete(task) {
        if (this.count++ % this.trimCount === 0)
            this.queue.trim();
        if (this.queue.remove(task)) {
            return task;
        }
        return null;
    }
    pop() {
        if (this.count++ % this.trimCount === 0)
            this.queue.trim();
        const task = this.queue.poll();
        if (task) {
            return task;
        }
        return null;
    }
    empty() {
        return this.queue.isEmpty();
    }
    size() {
        return this.queue.size;
    }
}
exports.TaskQueue = TaskQueue;
