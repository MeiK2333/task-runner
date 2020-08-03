import { T, R } from '../src'

test('then', async () => {
  await R([
    T(async () => {
    }).then(async () => {
    })
  ])
});

test('limit', async () => {
  async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
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
