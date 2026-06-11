
-- contact_messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT INSERT ON public.contact_messages TO anon;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can read contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- faqs
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active faqs"
  ON public.faqs FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage faqs"
  ON public.faqs FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a few FAQs
INSERT INTO public.faqs (question, answer, sort_order) VALUES
  ('Qual o tempo médio de entrega?', 'Nossas entregas levam em média 30 a 45 minutos, dependendo da sua localização.', 1),
  ('Quais formas de pagamento vocês aceitam?', 'Aceitamos PIX, cartões de crédito e débito, e pagamento na entrega.', 2),
  ('Vocês entregam em qual região?', 'Atendemos toda a região central da cidade. Consulte o CEP no checkout.', 3),
  ('Posso personalizar meu hambúrguer?', 'Sim! Em breve você poderá adicionar extras como bacon, cheddar e ovo direto no carrinho.', 4),
  ('Como faço para acompanhar meu pedido?', 'Após finalizar o pedido você pode acompanhar o status em tempo real na sua área de cliente.', 5);

-- job_applications
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT,
  message TEXT,
  resume_url TEXT,
  resume_path TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read job applications"
  ON public.job_applications FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update job applications"
  ON public.job_applications FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete job applications"
  ON public.job_applications FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
