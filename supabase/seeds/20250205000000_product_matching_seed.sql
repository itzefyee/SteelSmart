-- Seed canonical component taxonomy and material synonym data

INSERT INTO component_taxonomy (id, canonical_name, category, description, keywords)
VALUES
  ('00000000-0000-4000-8000-000000000101', 'Servo Motor', 'robotic', 'Rotary actuator used in automation and robotics', ARRAY['servo','motor','actuator','pan-tilt','gearbox']),
  ('00000000-0000-4000-8000-000000000102', 'Linear Actuator', 'robotic', 'Electromechanical actuator for push/pull motion', ARRAY['linear','actuator','ram','pusher']),
  ('00000000-0000-4000-8000-000000000103', 'Structural Beam', 'structural', 'Hot rolled or fabricated beam for frames', ARRAY['beam','i-beam','channel','girder']),
  ('00000000-0000-4000-8000-000000000104', 'Steel Plate', 'structural', 'Flat stock plate for fabrication', ARRAY['plate','sheet','gusset']),
  ('00000000-0000-4000-8000-000000000105', 'Gallows Frame', 'structural', 'Pre-fabricated lifting or support frame', ARRAY['frame','gallows','support','assembly']),
  ('00000000-0000-4000-8000-000000000106', 'Brake Rotor', 'structural', 'High-carbon brake rotor or disc', ARRAY['rotor','disc','brake','ø','pcd']),
  ('00000000-0000-4000-8000-000000000107', 'Hex Bolt', 'fasteners', 'Metric hex head bolt', ARRAY['bolt','m12','fastener','grade 8.8']),
  ('00000000-0000-4000-8000-000000000108', 'Hex Nut', 'fasteners', 'Metric hex nut', ARRAY['nut','m12','fastener']),
  ('00000000-0000-4000-8000-000000000109', 'Washer', 'fasteners', 'Flat washer or spacer', ARRAY['washer','spacer']),
  ('00000000-0000-4000-8000-00000000010a', 'Custom Bracket', 'custom', 'Custom fabricated bracket or mount', ARRAY['bracket','mount','adapter','fixture']),
  ('00000000-0000-4000-8000-00000000010b', 'Precision Coupling', 'robotic', 'Shaft or servo couplings', ARRAY['coupling','shaft','servo']),
  ('00000000-0000-4000-8000-00000000010c', 'Encoder / Sensor', 'robotic', 'Feedback encoders and sensors', ARRAY['encoder','sensor','resolver'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO material_synonyms (id, family, synonyms)
VALUES
  ('00000000-0000-4000-9000-000000000201', 'steel', ARRAY['steel','carbon steel','mild steel','s355','s235','hot rolled']),
  ('00000000-0000-4000-9000-000000000202', 'stainless', ARRAY['stainless','316l','304','surgical grade','inox']),
  ('00000000-0000-4000-9000-000000000203', 'aluminum', ARRAY['aluminum','aluminium','6061','7075','aluminum housing','anodized']),
  ('00000000-0000-4000-9000-000000000204', 'cast iron', ARRAY['cast iron','high carbon','ductile iron','grey iron']),
  ('00000000-0000-4000-9000-000000000205', 'alloy steel', ARRAY['alloy steel','grade 8.8','grade 8','quenched']),
  ('00000000-0000-4000-9000-000000000206', 'polymer', ARRAY['polymer','nylon','abs','pa12','composite']),
  ('00000000-0000-4000-9000-000000000207', 'titanium', ARRAY['titanium','ti-6al-4v','ti64','grade 5']),
  ('00000000-0000-4000-9000-000000000208', 'brass', ARRAY['brass','cuzn','copper alloy'])
ON CONFLICT (id) DO NOTHING;

