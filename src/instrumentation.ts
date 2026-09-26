export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const { startUpdateChecker } = await import('./lib/updates');
  startUpdateChecker();
  if (process.env.AVISOS_DISABLED === 'true') return;
  const { startAvisosScheduler } = await import('./lib/avisosScheduler');
  startAvisosScheduler();
}
