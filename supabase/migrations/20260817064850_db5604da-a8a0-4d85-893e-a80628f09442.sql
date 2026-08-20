SELECT cron.unschedule('onecite-sync-analytics-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'onecite-sync-analytics-daily');

SELECT cron.schedule(
  'onecite-sync-analytics-daily',
  '25 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--8e50bc36-64ac-4cc1-9948-3f4fac9d3f33.lovable.app/api/public/cron/sync-analytics',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_4A2n5FDKqehhxp3nAbhpDA_cg24Ww5Z"}'::jsonb,
    body := '{"source":"pg_cron_daily"}'::jsonb
  );
  $$
);