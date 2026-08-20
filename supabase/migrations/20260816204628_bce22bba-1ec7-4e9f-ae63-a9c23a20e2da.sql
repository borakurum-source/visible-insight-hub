CREATE OR REPLACE FUNCTION onecite.expire_subscription_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = onecite, public, extensions
AS $$
BEGIN
  UPDATE onecite.profiles p
  SET plan = 'free', updated_at = now()
  WHERE p.plan <> 'free'
    AND NOT EXISTS (
      SELECT 1 FROM onecite.subscriptions s
      WHERE s.user_id = p.id
        AND (
          (s.status IN ('active','trialing') AND (s.current_period_end IS NULL OR s.current_period_end > now()))
          OR (s.status = 'canceled' AND s.current_period_end > now())
        )
    )
    AND EXISTS (SELECT 1 FROM onecite.subscriptions s2 WHERE s2.user_id = p.id);
END;
$$;

REVOKE EXECUTE ON FUNCTION onecite.expire_subscription_plans() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'onecite-expire-subscription-plans',
  '17 * * * *',
  $$SELECT onecite.expire_subscription_plans();$$
);