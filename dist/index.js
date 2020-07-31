"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.R = exports.TaskRunner = exports.T = exports.Task = exports.TaskStatus = void 0;
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./logger"), exports);
const queue_1 = require("./queue");
const events_1 = require("events");
var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["PENDING"] = 0] = "PENDING";
    TaskStatus[TaskStatus["RUNNING"] = 1] = "RUNNING";
    TaskStatus[TaskStatus["SUCCESS"] = 2] = "SUCCESS";
    TaskStatus[TaskStatus["FAILURE"] = 3] = "FAILURE";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
var FuncType;
(function (FuncType) {
    FuncType[FuncType["THEN"] = 0] = "THEN";
    FuncType[FuncType["CATCH"] = 1] = "CATCH";
    FuncType[FuncType["FINALLY"] = 2] = "FINALLY";
})(FuncType || (FuncType = {}));
let __id__ = 0;
class Task {
    constructor(func, config) {
        this.__id__ = __id__;
        __id__++;
        this.func = func;
        this.config = Object.assign({ retry: 0 }, config);
        this.status = TaskStatus.PENDING;
        this.thenFunc = [];
        this.catchFunc = [];
        this.finallyFunc = [];
        this.funcTypes = [];
    }
    then(onfulfilled, onrejected) {
        this.thenFunc.push({
            onfulfilled,
            onrejected
        });
        this.funcTypes.push(FuncType.THEN);
        return this;
    }
    catch(onrejected) {
        this.catchFunc.push(onrejected);
        this.funcTypes.push(FuncType.CATCH);
        return this;
    }
    finally(onfinally) {
        this.finallyFunc.push(onfinally);
        this.funcTypes.push(FuncType.FINALLY);
        return this;
    }
    run() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                yield runner;
            }
            catch (e) {
                status = TaskStatus.FAILURE;
            }
            return status;
        });
    }
}
exports.Task = Task;
function T(func) {
    const task = new Task(func);
    return task;
}
exports.T = T;
class TaskRunner extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.pending = new queue_1.TaskQueue();
        this.running = new queue_1.TaskQueue();
        this.success = 0;
        this.failure = 0;
        this.config = Object.assign({
            maxRunning: 0
        }, config);
        this.maxPriority = 0;
        this.on('taskChange', this.onTaskChange);
    }
    add(task) {
        if (!task.config.priority) {
            task.config.priority = this.maxPriority;
            this.maxPriority++;
        }
        else {
            this.maxPriority = Math.max(task.config.priority + 1, this.maxPriority);
        }
        this.pending.add(task);
    }
    addList(tasks) {
        for (const task of tasks) {
            this.add(task);
        }
    }
    all() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.start();
            yield this.waitIdle();
        });
    }
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.onTaskChange();
        });
    }
    waitIdle() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        });
    }
    onTaskChange() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                    }
                    else if (status == TaskStatus.FAILURE && task.config.retry > 0) {
                        task.config.retry--;
                        this.add(task);
                    }
                    else {
                        this.failure++;
                    }
                    this.emit('taskChange');
                });
                runningCount++;
                pendingCount--;
            }
        });
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
exports.TaskRunner = TaskRunner;
function R(values, config) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const taskRunner = new TaskRunner(config);
        taskRunner.addList(values);
        return yield taskRunner.all();
    });
}
exports.R = R;
