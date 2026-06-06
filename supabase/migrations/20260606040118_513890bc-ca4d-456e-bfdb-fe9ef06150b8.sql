
-- Enable pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hash any existing plain-text tokens in place (idempotent: 64-char hex = already hashed)
UPDATE public.bookings
SET owner_token = encode(digest(owner_token, 'sha256'), 'hex')
WHERE owner_token !~ '^[a-f0-9]{64}$';

-- Recreate cancel_booking to compare hashed tokens
CREATE OR REPLACE FUNCTION public.cancel_booking(p_id uuid, p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  deleted_count int;
  hashed text;
BEGIN
  hashed := encode(digest(p_token, 'sha256'), 'hex');
  DELETE FROM public.bookings
  WHERE id = p_id AND owner_token = hashed;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$function$;

-- Explicit deny policies for direct UPDATE/DELETE through the Data API
-- (Cancellation must use the cancel_booking SECURITY DEFINER function above)
DROP POLICY IF EXISTS "no direct updates to bookings" ON public.bookings;
CREATE POLICY "no direct updates to bookings"
  ON public.bookings FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "no direct deletes on bookings" ON public.bookings;
CREATE POLICY "no direct deletes on bookings"
  ON public.bookings FOR DELETE
  TO anon, authenticated
  USING (false);
