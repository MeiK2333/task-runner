# task-runner

## Installation

```bash
npm install git+https://github.com/MeiK2333/task-runner.git
```

## Example

```typescript
const urls = [
  'https://avatars3.githubusercontent.com/u/20951666',
  'https://avatars1.githubusercontent.com/u/19774268',
  'https://avatars0.githubusercontent.com/u/16873295',
  'https://avatars0.githubusercontent.com/u/25977768'
];
const funcs = [];
for (const url of urls) {
  funcs.push(T(async () => {
    console.log(`download ${url}`);
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    await promises.writeFile(url.split('/')[4] + '.jpg', resp.data);
    console.log(`success`);
  }))
}
await R(funcs, { maxRunning: 3 });
```

## Interface

- `new Task(func: (() => Promise<T>))`
- `T()`
- `Task.then()`
- `Task.catch()`
- `Task.finally()`
- `Task.run()`
- `new TaskRunner(config?: TaskRunnerConfig)`
- `R()`
- `TaskRunner.all()`
- `TaskRunner.start()`
- `TaskRunner.waitIdle()`
- `TaskRunner.getSuccessLength()`
- `TaskRunner.getFailureLength()`
- `TaskRunner.getRunningLength()`
- `TaskRunner.getPendingLength()`
