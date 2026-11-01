import { runAllAutomatedTests } from './testRunner';

async function main() {
  console.log('====================================================');
  console.log('🧪 AuraPlan AI — Challenge 5 Automated Test Suite');
  console.log('====================================================\n');

  const summary = await runAllAutomatedTests();

  const suites = ['Unit', 'Integration', 'EdgeCase', 'Stress'] as const;

  for (const s of suites) {
    const suiteResults = summary.results.filter((r) => r.suite === s);
    console.log(`\n📌 ${s.toUpperCase()} TESTS (${suiteResults.length})`);
    for (const r of suiteResults) {
      const icon = r.passed ? '✅' : '❌';
      console.log(`  ${icon} ${r.name} (${r.durationMs}ms)`);
      if (!r.passed) {
        console.error(`     Error: ${r.message}`);
      }
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`Summary: ${summary.passed}/${summary.total} tests passed in ${summary.durationMs}ms`);
  console.log('----------------------------------------------------');

  if (summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test runner encountered unexpected error:', err);
  process.exit(1);
});
