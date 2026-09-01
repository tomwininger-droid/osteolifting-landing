module.exports = (req, res) => {
  const token = process.env.POSTHOG_PROJECT_TOKEN;
  const host = process.env.POSTHOG_HOST;

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ token, host });
};
