
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 120
    AND length(btrim(email)) BETWEEN 3 AND 255
    AND position('@' in email) > 1
    AND length(btrim(message)) BETWEEN 1 AND 2000
    AND (phone IS NULL OR length(phone) <= 40)
    AND status = 'new'
  );
