import { PrivacyManager } from './src/worker/lib/privacy-manager.ts';

// Create a simple benchmark for the runAutomaticCleanup method
async function runBenchmark() {
  const numUsers = 100;

  // Create a mock env
  const mockEnv = {
    DB: {
      prepare: () => ({
        bind: () => ({
          run: async () => ({ changes: 5 })
        })
      })
    }
  };

  const privacyManager = new PrivacyManager(mockEnv);

  // Mock the getSupabase behavior
  const mockSupabase = {
    from: (table: string) => {
      if (table === 'privacy_settings') {
        return {
          select: () => ({
            eq: () => ({
              eq: async () => {
                // Return 100 mock user settings
                const mockSettings = Array.from({ length: numUsers }).map((_, i) => ({
                  user_id: `user_${i}`,
                  conversation_id: null,
                  data_retention_days: 30
                }));
                return { data: mockSettings, error: null };
              }
            })
          })
        };
      } else {
        return {
          delete: () => ({
            match: () => ({
              lt: async () => ({ error: null })
            })
          })
        };
      }
    }
  };

  // Patch getSupabase via prototype if needed, or we just mock require
  const supabaseModule = await import('./src/worker/lib/supabase.ts');
  const origGetSupabase = supabaseModule.getSupabase;
  // This might not work cleanly with ESM, but let's try an alternative benchmark

  // We can just redefine the runAutomaticCleanup method for benchmark
  const oldClearOldData = privacyManager.clearOldData;
  privacyManager.clearOldData = async () => {
    // Simulate some work
    await new Promise(r => setTimeout(r, 10));
    return { deletedCount: 5 };
  };

  const start = performance.now();
  let totalDeleted = 0;
  let usersProcessed = 0;
  const mockSettings = Array.from({ length: numUsers }).map((_, i) => ({
    user_id: `user_${i}`,
    conversation_id: undefined,
    data_retention_days: 30
  }));

  for (const setting of mockSettings) {
    try {
      const { deletedCount } = await privacyManager.clearOldData(
        setting.user_id as string,
        setting.data_retention_days as number,
        setting.conversation_id as string | undefined
      );
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
      const { deletedCount } = await privacyManager.clearOldData(
        setting.user_id as string,
        setting.data_retention_days as number,
        setting.conversation_id as string | undefined
      );
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
