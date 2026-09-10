export async function getSettings(req, res) {
  res.json({ journalAnalysisEnabled: req.user.journalAnalysisEnabled !== false, timezone: req.user.timezone || 'UTC' });
}

export async function updateSettings(req, res) {
  if (req.body.journalAnalysisEnabled !== undefined) req.user.journalAnalysisEnabled = Boolean(req.body.journalAnalysisEnabled);
  if (typeof req.body.timezone === 'string' && req.body.timezone.trim()) req.user.timezone = req.body.timezone.trim();
  await req.user.save();
  res.json({ journalAnalysisEnabled: req.user.journalAnalysisEnabled, timezone: req.user.timezone });
}
