
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL CHECK (subject IN ('math','science')),
  day_index int NOT NULL CHECK (day_index BETWEEN 0 AND 6),
  slot text NOT NULL CHECK (slot IN ('morning','afternoon','evening')),
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 40),
  class_name text NOT NULL CHECK (char_length(class_name) BETWEEN 1 AND 40),
  owner_token text NOT NULL CHECK (char_length(owner_token) BETWEEN 8 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_slot ON public.bookings(subject, day_index, slot);

GRANT SELECT, INSERT ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read bookings"
  ON public.bookings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "anyone can insert bookings"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No DELETE / UPDATE policy: direct deletes blocked. Cancellation goes through RPC.

CREATE OR REPLACE FUNCTION public.cancel_booking(p_id uuid, p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM public.bookings
  WHERE id = p_id AND owner_token = p_token;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid, text) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
