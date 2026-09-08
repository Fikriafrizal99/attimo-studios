-- Phase 9.1 integrated database journey acceptance.
-- Safe to run repeatedly: every fixture is rolled back.

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public."user" (id, name, email, "emailVerified") VALUES
  ('phase9-owner-a', 'Phase 9 Owner A', 'phase9-owner-a@example.test', TRUE),
  ('phase9-owner-b', 'Phase 9 Owner B', 'phase9-owner-b@example.test', TRUE);

-- Create tenant B fixture under privileged setup so tenant A has something real to be denied.
INSERT INTO public.weddings (id, slug, status, template_id, sections, content, theme)
VALUES (
  '90000000-0000-4000-8000-000000000002',
  'phase9-tenant-b',
  'draft',
  'classic-001',
  '[]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb
);
INSERT INTO public.wedding_collaborators (wedding_id, user_id, role)
VALUES ('90000000-0000-4000-8000-000000000002', 'phase9-owner-b', 'owner');
INSERT INTO public.customers (id, owner_user_id, name, phone)
VALUES ('91000000-0000-4000-8000-000000000002', 'phase9-owner-b', 'Tenant B Customer', '080000000002');
INSERT INTO public.orders (
  id, owner_user_id, customer_id, wedding_id, package_name, template_id, price_amount
) VALUES (
  '92000000-0000-4000-8000-000000000002',
  'phase9-owner-b',
  '91000000-0000-4000-8000-000000000002',
  '90000000-0000-4000-8000-000000000002',
  'Premium',
  'classic-001',
  250000
);
INSERT INTO public.guests (id, wedding_id, display_name, max_guests, token)
VALUES (
  '93000000-0000-4000-8000-000000000002',
  '90000000-0000-4000-8000-000000000002',
  'Tenant B Guest',
  2,
  'phase9-tenant-b-guest'
);
INSERT INTO public.rsvp (wedding_id, guest_id, name, attendance, guest_count)
VALUES (
  '90000000-0000-4000-8000-000000000002',
  '93000000-0000-4000-8000-000000000002',
  'Tenant B Guest',
  'yes',
  1
);
INSERT INTO public.wishes (wedding_id, guest_id, name, message)
VALUES (
  '90000000-0000-4000-8000-000000000002',
  '93000000-0000-4000-8000-000000000002',
  'Tenant B Guest',
  'Tenant B private operational fixture'
);

SET LOCAL ROLE authenticated;
SELECT set_config('app.better_auth_user_id', 'phase9-owner-a', true);

DO $$
DECLARE
  created JSONB;
  wedding_a UUID;
  customer_a UUID;
  order_a UUID;
  guest_a UUID;
  blocked BOOLEAN;
BEGIN
  created := app_private.create_wedding_for_current_user(
    'editorial-001',
    '[{"id":"hero","enabled":true,"order":0}]'::jsonb,
    '{"phase9":"integration"}'::jsonb,
    '{}'::jsonb
  );
  wedding_a := (created->>'id')::uuid;

  INSERT INTO public.customers (owner_user_id, name, phone, email)
  VALUES ('phase9-owner-a', 'Phase 9 Customer A', '080000000001', 'phase9-customer-a@example.test')
  RETURNING id INTO customer_a;

  INSERT INTO public.orders (
    owner_user_id, customer_id, wedding_id, package_name, template_id,
    price_amount, payment_status, production_status
  ) VALUES (
    'phase9-owner-a', customer_a, wedding_a, 'Premium', 'editorial-001',
    250000, 'partial', 'in_progress'
  ) RETURNING id INTO order_a;

  INSERT INTO public.guests (wedding_id, display_name, max_guests, token)
  VALUES (wedding_a, 'Phase 9 Guest A', 2, 'phase9-tenant-a-guest')
  RETURNING id INTO guest_a;

  IF NOT EXISTS (SELECT 1 FROM public.weddings WHERE id = wedding_a) THEN
    RAISE EXCEPTION 'Phase 9 integration failed: owner cannot read own wedding';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = customer_a) THEN
    RAISE EXCEPTION 'Phase 9 integration failed: owner cannot read own customer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = order_a) THEN
    RAISE EXCEPTION 'Phase 9 integration failed: owner cannot read own order';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.guests WHERE id = guest_a) THEN
    RAISE EXCEPTION 'Phase 9 integration failed: owner cannot read own guest';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.order_activity
    WHERE order_id = order_a AND event_type = 'created'
  ) THEN
    RAISE EXCEPTION 'Phase 9 integration failed: order activity creation missing';
  END IF;

  UPDATE public.orders
  SET payment_status = 'paid', production_status = 'approved', revision_count = 1
  WHERE id = order_a;

  IF NOT EXISTS (
    SELECT 1 FROM public.order_activity
    WHERE order_id = order_a AND event_type = 'payment_status_changed'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.order_activity
    WHERE order_id = order_a AND event_type = 'production_status_changed'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.order_activity
    WHERE order_id = order_a AND event_type = 'revision_count_changed'
  ) THEN
    RAISE EXCEPTION 'Phase 9 integration failed: order transition activity missing';
  END IF;

  IF EXISTS (SELECT 1 FROM public.weddings WHERE id = '90000000-0000-4000-8000-000000000002')
     OR EXISTS (SELECT 1 FROM public.customers WHERE id = '91000000-0000-4000-8000-000000000002')
     OR EXISTS (SELECT 1 FROM public.orders WHERE id = '92000000-0000-4000-8000-000000000002')
     OR EXISTS (SELECT 1 FROM public.guests WHERE id = '93000000-0000-4000-8000-000000000002')
     OR EXISTS (SELECT 1 FROM public.rsvp WHERE wedding_id = '90000000-0000-4000-8000-000000000002')
     OR EXISTS (SELECT 1 FROM public.wishes WHERE wedding_id = '90000000-0000-4000-8000-000000000002')
     OR EXISTS (SELECT 1 FROM public.order_activity WHERE order_id = '92000000-0000-4000-8000-000000000002') THEN
    RAISE EXCEPTION 'Phase 9 integration failed: cross-tenant data leakage detected';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO public.orders (
      owner_user_id, customer_id, package_name, template_id, price_amount
    ) VALUES (
      'phase9-owner-a',
      '91000000-0000-4000-8000-000000000002',
      'Forbidden Cross Tenant Order',
      'classic-001',
      1
    );
  EXCEPTION WHEN check_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 9 integration failed: cross-tenant customer linkage accepted';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO public.rsvp (wedding_id, guest_id, name, attendance, guest_count)
    VALUES (
      wedding_a,
      '93000000-0000-4000-8000-000000000002',
      'Cross Tenant Guest',
      'yes',
      1
    );
  EXCEPTION WHEN check_violation OR insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 9 integration failed: cross-wedding RSVP guest accepted';
  END IF;
END $$;

RESET ROLE;
ROLLBACK;

SELECT 'Phase 9.1 integrated database journey acceptance passed' AS result;
