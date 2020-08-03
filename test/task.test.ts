import { T, R, TaskRunner } from '../src'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test('then', async () => {
  await R([
    T(async () => {
    }).then(async () => {
    })
  ])
});

test('limit', async () => {
  const start = new Date().getTime();
  const funcs = [];
  for (let i = 0; i < 5; i++) {
    funcs.push(T(async () => {
      await sleep(1000);
    }));
  }
  await R(funcs, { maxRunning: 4 });
  const end = new Date().getTime();
  expect(end - start >= 2000).toBe(true);
  expect(end - start < 2100).toBe(true);
});

test('catch', async () => {
  const tasks = [];
  const task = T(async () => {
    if (1 < 2) {
      throw new Error("Hello World!");
    }
    return 0;
  }).then(async (val) => {

  }).catch(async (e) => {
    expect(e).toStrictEqual(new Error('Hello World!'));
  });
  for (let i = 0; i < 10; i++) {
    tasks.push(task);
  }
  await R(tasks, { maxRunning: 2 });
});

test('retry', async () => {
  let count = 0;
  await R([T(async () => {
    count++;
    throw new Error('Hello World!');
  }, { retry: 2 })]);
  expect(count).toBe(3);
});

test('mul', async () => {
  const taskRunner = new TaskRunner({ maxRunning: 2 });
  let count = 0;
  for (let i = 0; i < 5; i++) {
    taskRunner.add(T(async () => {
      const tr = new TaskRunner({ maxRunning: 2 });
      for (let j = 0; j < 5; j++) {
        tr.add(T(async () => {
          count++;
        }))
      }
      await tr.all();
    }))
  }
  await taskRunner.all();
  expect(count).toBe(25);
})
