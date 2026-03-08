// JavaScript Benchmark simulating the behavior

async function clearOldData() {
  // Simulate network/DB delay
  await new Promise(r => setTimeout(r, 10));
  return { deletedCount: 5 };
}

async function runBenchmark() {
  const numUsers = 100;

  const mockSettings = Array.from({ length: numUsers }).map((_, i) => ({
    user_id: `user_${i}`,
    conversation_id: undefined,
    data_retention_days: 30
  }));

  const start = performance.now();
  let totalDeleted = 0;
  let usersProcessed = 0;

  for (const setting of mockSettings) {
    try {
      const { deletedCount } = await clearOldData();
      totalDeleted += deletedCount;
      usersProcessed++;
    } catch (error) {
    }
  }
  const end = performance.now();

  console.log(`Sequential baseline (simulated ${numUsers} users): ${(end - start).toFixed(2)}ms`);


  const startParallel = performance.now();
  totalDeleted = 0;
  usersProcessed = 0;

  const cleanupPromises = mockSettings.map(async (setting) => {
    try {
      const { deletedCount } = await clearOldData();
      return deletedCount;
    } catch (error) {
      return 0;
    }
  });

  const results = await Promise.all(cleanupPromises);
  totalDeleted = results.reduce((acc, count) => acc + count, 0);
  usersProcessed = results.length;

  const endParallel = performance.now();
  console.log(`Parallel execution (simulated ${numUsers} users): ${(endParallel - startParallel).toFixed(2)}ms`);

}

runBenchmark().catch(console.error);
