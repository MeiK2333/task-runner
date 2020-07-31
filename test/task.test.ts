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
