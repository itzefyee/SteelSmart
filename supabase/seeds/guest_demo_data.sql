-- Demo seed data for guest accounts and their activity history.
-- Run this script in the Supabase SQL editor (requires service role privileges
-- to call auth.admin_create_user). It creates three guest accounts, refreshes
-- their related demo history data, and populates CAD generations, AI analyses,
-- and RFQ submissions so the UI has realistic content to display.

DO $$
DECLARE
  guest1_id UUID;
  guest2_id UUID;
  guest3_id UUID;
BEGIN
  -- Lookup guest accounts. Create them manually (e.g., Supabase dashboard or CLI)
  -- before running this script since auth.admin_create_user() is unavailable in SQL.
  SELECT id INTO guest1_id
  FROM auth.users
  WHERE email = 'guest1@gmail.com'
    AND deleted_at IS NULL
  LIMIT 1;
  IF guest1_id IS NULL THEN
    RAISE EXCEPTION 'Guest user % is missing in auth.users. Please create it first.', 'guest1@gmail.com';
  END IF;

  SELECT id INTO guest2_id
  FROM auth.users
  WHERE email = 'guest2@gmail.com'
    AND deleted_at IS NULL
  LIMIT 1;
  IF guest2_id IS NULL THEN
    RAISE EXCEPTION 'Guest user % is missing in auth.users. Please create it first.', 'guest2@gmail.com';
  END IF;

  SELECT id INTO guest3_id
  FROM auth.users
  WHERE email = 'guest3@gmail.com'
    AND deleted_at IS NULL
  LIMIT 1;
  IF guest3_id IS NULL THEN
    RAISE EXCEPTION 'Guest user % is missing in auth.users. Please create it first.', 'guest3@gmail.com';
  END IF;

  -- Ensure profile records exist and have meaningful demo metadata.
  INSERT INTO public.profiles (id, company, phone)
  VALUES
    (guest1_id, 'Metro Steelworks', '+1-555-0111'),
    (guest2_id, 'Vertex Fabrication', '+1-555-0222'),
    (guest3_id, 'Atlas Industrial', '+1-555-0333')
  ON CONFLICT (id) DO UPDATE
    SET company = EXCLUDED.company,
        phone   = EXCLUDED.phone,
        updated_at = NOW();

  -- Clean up prior demo data for these guests so re-running is idempotent.
  DELETE FROM cad_history WHERE user_id = ANY (ARRAY[guest1_id, guest2_id, guest3_id]);
  DELETE FROM drawing_analyses WHERE user_id = ANY (ARRAY[guest1_id, guest2_id, guest3_id]);
  DELETE FROM rfq_submissions WHERE user_id = ANY (ARRAY[guest1_id, guest2_id, guest3_id]);

  -- Drawing / AI analysis history
  INSERT INTO drawing_analyses (
    user_id, file_name, file_path, file_type, file_size, extracted_specs,
    recommended_products, confidence, reasoning, analyzed_at, gemini_response
  )
  VALUES
    (
      guest1_id,
      'retaining_wall_section.pdf',
      'demo/guest1/retaining_wall_section.pdf',
      'application/pdf',
      582144,
      jsonb_build_object(
        'wall_height_mm', 2400,
        'rebar_schedule', 'T12 @ 150mm c/c',
        'soil_pressure_kpa', 55
      ),
      jsonb_build_object(
        'primary', jsonb_build_object('product_id', 'structural-bracket-001', 'fit', 'ideal'),
        'alternate', jsonb_build_object('product_id', 'fastener-pack-004', 'fit', 'compatible')
      ),
      0.86,
      'Detected high lateral load, recommended shear keys and tension anchors.',
      NOW() - INTERVAL '36 hours',
      jsonb_build_object('model', 'gemini-pro', 'latency_ms', 2300)
    ),
    (
      guest2_id,
      'ladder_anchor_layout.dwg',
      'demo/guest2/ladder_anchor_layout.dwg',
      'application/dwg',
      742912,
      jsonb_build_object(
        'ladder_height_mm', 5200,
        'anchor_spacing_mm', 400,
        'finish', 'HDG'
      ),
      jsonb_build_object(
        'primary', jsonb_build_object('product_id', 'fasteners-hex-012', 'fit', 'ideal')
      ),
      0.74,
      'Suggested thicker backing plate to reduce deflection under 1.5kN load.',
      NOW() - INTERVAL '3 days',
      jsonb_build_object('model', 'gemini-pro', 'latency_ms', 1980)
    ),
    (
      guest3_id,
      'panel_bracket_details.dxf',
      'demo/guest3/panel_bracket_details.dxf',
      'application/dxf',
      418304,
      jsonb_build_object(
        'panel_weight_kg', 85,
        'bracket_span_mm', 1200,
        'weld_type', 'fillet 6mm'
      ),
      jsonb_build_object(
        'primary', jsonb_build_object('product_id', 'custom-bracket-009', 'fit', 'ideal'),
        'notes', 'Requires laser cut slots for cable routing'
      ),
      0.91,
      'All loads within limits; flagged optional stiffener for vibration control.',
      NOW() - INTERVAL '5 hours',
      jsonb_build_object('model', 'gemini-pro', 'latency_ms', 1750)
    );

  -- RFQ submissions
  INSERT INTO rfq_submissions (
    user_id, contact_name, contact_email, contact_company, contact_phone,
    project_description, quantity, material, specifications, deadline, budget,
    attached_files, status, created_at, updated_at
  )
  VALUES
    (
      guest1_id,
      'Morgan Patel',
      'morgan.patel@metrosteel.com',
      'Metro Steelworks',
      '+1-555-0111',
      'Fabricate 120 custom gusset plates with pre-drilled anchor pattern.',
      120,
      'A572 Grade 50',
      '12mm thickness, galvanised, tolerance +/-0.5mm',
      (CURRENT_DATE + INTERVAL '21 days')::DATE,
      'USD 18k - 22k',
      ARRAY['demo/guest1/rfq/gusset_spec.pdf'],
      'reviewed',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '12 hours'
    ),
    (
      guest2_id,
      'Leah Kim',
      'leah@vertexfab.io',
      'Vertex Fabrication',
      '+1-555-0222',
      'Industrial access ladder set with optional safety cage kit.',
      45,
      'ASTM A36',
      'Powder coat RAL 7016, include cage splice kit',
      (CURRENT_DATE + INTERVAL '30 days')::DATE,
      'USD 35k - 40k',
      ARRAY['demo/guest2/rfq/ladder_layout.dwg'],
      'pending',
      NOW() - INTERVAL '4 days',
      NOW() - INTERVAL '4 days'
    ),
    (
      guest3_id,
      'Darius Cole',
      'darius.cole@atlasindustrial.co',
      'Atlas Industrial',
      '+1-555-0333',
      'Bracket kits for mounting PLC cabinets to W12x35 beams.',
      60,
      'A500 Grade B',
      'Prime coat only, include hardware kit with slotted holes',
      (CURRENT_DATE + INTERVAL '14 days')::DATE,
      'USD 24k - 27k',
      ARRAY['demo/guest3/rfq/plc_bracket.sketch'],
      'quoted',
      NOW() - INTERVAL '6 days',
      NOW() - INTERVAL '1 day'
    );
END $$;


