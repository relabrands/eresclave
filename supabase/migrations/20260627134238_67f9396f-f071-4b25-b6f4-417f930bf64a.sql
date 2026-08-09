
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

DROP POLICY "Anyone can create donation intent" ON public.donations;
CREATE POLICY "Anyone can create donation intent" ON public.donations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(donor_name) BETWEEN 1 AND 120
    AND amount > 0 AND amount < 10000000
    AND (donor_email IS NULL OR length(donor_email) <= 255)
    AND (message IS NULL OR length(message) <= 1000)
  );
