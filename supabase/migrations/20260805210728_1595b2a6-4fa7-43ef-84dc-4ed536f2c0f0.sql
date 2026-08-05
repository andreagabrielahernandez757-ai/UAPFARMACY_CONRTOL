CREATE TYPE public.pharmacy AS ENUM ('comunes','especializada','central');

CREATE TABLE public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket text NOT NULL,
  patient_name text NOT NULL,
  pharmacy public.pharmacy NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  total_minutes numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX deliveries_started_at_idx ON public.deliveries (started_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read deliveries" ON public.deliveries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert deliveries" ON public.deliveries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update deliveries" ON public.deliveries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;