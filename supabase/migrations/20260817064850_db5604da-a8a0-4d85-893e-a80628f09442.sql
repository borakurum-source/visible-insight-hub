SELECT cron.unschedule('onecite-sync-analytics-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'onecite-sync-analytics-daily');

SELECT cron.schedule(
  'onecite-sync-analytics-daily',
  '25 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://1cite.com/api/public/cron/sync-analytics',
    headers := jsonb_build_object('Content-Type', 'application/json') || CASE
      WHEN NULLIF(current_setting('app.settings.anon_key', true), '') IS NULL THEN '{}'::jsonb
      ELSE jsonb_build_object('apikey', current_setting('app.settings.anon_key', true))
    END,
    body := '{"source":"pg_cron_daily"}'::jsonb
  );
  $$
);
