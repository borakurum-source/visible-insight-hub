CREATE OR REPLACE FUNCTION public.expire_subscription_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles p
  SET plan = 'free', updated_at = now()
  WHERE p.plan <> 'free'
    AND NOT EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = p.id
        AND (
          (s.status IN ('active','trialing') AND (s.current_period_end IS NULL OR s.current_period_end > now()))
          OR (s.status = 'canceled' AND s.current_period_end > now())
        )
    )
    AND EXISTS (SELECT 1 FROM public.subscriptions s2 WHERE s2.user_id = p.id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_subscription_plans() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'expire-subscription-plans',
  '17 * * * *',
  $$SELECT public.expire_subscription_plans();$$
);