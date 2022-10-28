const { sleep } = require('../sleep');

test('Sleep', async () => {
  const start = new Date().getTime() / 1000;
  const end1 = new Date().getTime() / 1000;
  sleep(1);
  const end2 = new Date().getTime() / 1000;

  expect(end1 - start).toBeLessThan(0.99);
  expect(end2 - start).toBeGreaterThan(0.99);
});
