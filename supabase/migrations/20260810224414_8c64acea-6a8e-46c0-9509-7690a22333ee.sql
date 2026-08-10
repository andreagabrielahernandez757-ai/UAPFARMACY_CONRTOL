CREATE TYPE public.delivery_outcome AS ENUM ('entregado', 'retirado', 'sin_respuesta', 'cancelado');

ALTER TABLE public.deliveries
  ADD COLUMN outcome public.delivery_outcome;

UPDATE public.deliveries
  SET outcome = 'entregado'
  WHERE delivered_at IS NOT NULL AND outcome IS NULL;