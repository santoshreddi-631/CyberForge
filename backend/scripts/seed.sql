-- Seed script for  (CyberForge)
BEGIN;

-- 1. Areas (Appendix B centroids)
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560102', 'HSR Layout', 'Bengaluru', '12.9116', '77.6473') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560038', 'Indiranagar', 'Bengaluru', '12.9784', '77.6408') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560034', 'Koramangala', 'Bengaluru', '12.9352', '77.6245') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560066', 'Whitefield', 'Bengaluru', '12.9698', '77.7500') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560076', 'BTM Layout', 'Bengaluru', '12.9166', '77.6101') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560011', 'Jayanagar', 'Bengaluru', '12.9299', '77.5826') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560037', 'Marathahalli', 'Bengaluru', '12.9591', '77.6974') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560103', 'Bellandur', 'Bengaluru', '12.9260', '77.6762') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560100', 'Electronic City', 'Bengaluru', '12.8452', '77.6602') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560078', 'JP Nagar', 'Bengaluru', '12.9077', '77.5851') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560003', 'Malleshwaram', 'Bengaluru', '13.0035', '77.5709') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560010', 'Rajajinagar', 'Bengaluru', '12.9915', '77.5520') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560024', 'Hebbal', 'Bengaluru', '13.0358', '77.5970') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560064', 'Yelahanka', 'Bengaluru', '13.1007', '77.5963') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('560070', 'Banashankari', 'Bengaluru', '12.9250', '77.5468') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('400050', 'Bandra West', 'Mumbai', '19.0596', '72.8295') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('110016', 'Hauz Khas', 'Delhi', '28.5494', '77.2001') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('500081', 'Madhapur', 'Hyderabad', '17.4486', '78.3908') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('600020', 'Adyar', 'Chennai', '13.0012', '80.2565') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('411014', 'Viman Nagar', 'Pune', '18.5679', '73.9143') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('700091', 'Salt Lake Sector V', 'Kolkata', '22.5790', '88.4290') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('380015', 'Satellite', 'Ahmedabad', '23.0260', '72.5085') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('302017', 'Malviya Nagar', 'Jaipur', '26.8570', '75.8080') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('226010', 'Gomti Nagar', 'Lucknow', '26.8540', '80.9990') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;
INSERT INTO areas (pincode, locality, city, lat, lng) VALUES ('682030', 'Kakkanad', 'Kochi', '10.0159', '76.3419') ON CONFLICT (pincode) DO UPDATE SET locality = EXCLUDED.locality, city = EXCLUDED.city, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

-- 2. Scam Types (Appendix C)
INSERT INTO scam_types (value) VALUES ('digital-arrest') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('fake-kyc-link') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('upi-refund-qr') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('investment-group') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('courier-customs') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('job-offer') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('lottery-prize') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('loan-app-harassment') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('electricity-disconnection') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('fake-customer-care') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('otp-call') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('sextortion') ON CONFLICT (value) DO NOTHING;
INSERT INTO scam_types (value) VALUES ('other') ON CONFLICT (value) DO NOTHING;

-- 3. Channels (Appendix C)
INSERT INTO channels (value) VALUES ('Phone call') ON CONFLICT (value) DO NOTHING;
INSERT INTO channels (value) VALUES ('SMS or WhatsApp') ON CONFLICT (value) DO NOTHING;
INSERT INTO channels (value) VALUES ('QR code') ON CONFLICT (value) DO NOTHING;
INSERT INTO channels (value) VALUES ('Fake website') ON CONFLICT (value) DO NOTHING;
INSERT INTO channels (value) VALUES ('UPI request') ON CONFLICT (value) DO NOTHING;
INSERT INTO channels (value) VALUES ('Something else') ON CONFLICT (value) DO NOTHING;

-- 4. Verified Identifiers (Appendix C)
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '1930')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'National Cybercrime Helpline' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '1909')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'TRAI Do Not Disturb' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '18001600')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'HDFC Bank customer care' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '18002600')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'HDFC Bank customer care' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '18001080')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'ICICI Bank customer care' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '18001234')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'State Bank of India customer care' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '18002100')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'State Bank of India customer care' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '18604195555')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'Axis Bank customer care' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '18602662666')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'Kotak Mahindra Bank customer care' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('sender_id', 'HDFCBK')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'HDFC Bank SMS sender' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('sender_id', 'ICICIB')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'ICICI Bank SMS sender' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('sender_id', 'SBIINB')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'State Bank of India SMS sender' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('sender_id', 'AXISBK')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'Axis Bank SMS sender' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('sender_id', 'KOTAKB')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'Kotak Mahindra Bank SMS sender' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('url', 'https://cybercrime.gov.in')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'National Cyber Crime Reporting Portal' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('url', 'https://sancharsaathi.gov.in')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'Sanchar Saathi' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '+918041002233')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'Fresh Bakes, Indiranagar (made up)' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('phone', '+918025530190')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'Koramangala Pharmacy (made up)' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;
WITH ins AS (
  INSERT INTO identifiers (identifier_type, normalized_value) VALUES ('upi', 'freshbakes@okaxis')
  ON CONFLICT (identifier_type, normalized_value) DO UPDATE SET normalized_value = EXCLUDED.normalized_value
  RETURNING id
)
INSERT INTO verified_identifiers (identifier_id, label)
SELECT id, 'Fresh Bakes, Indiranagar (made up)' FROM ins
ON CONFLICT (identifier_id) DO UPDATE SET label = EXCLUDED.label;

-- 5. Baseline 1-Year Production License
INSERT INTO license_state (id, licensee, expires_at, signature)
VALUES (1, 'Demo Bank - 1 Year Production', '2027-11-01T00:19:27.675Z', 'D8cBr3/Chxj7CHPQAccZdDbOxJc1+4iNdM/yl05DuReBYzyPHnk6V8OcBkRUcdVh/vq8YqxmoEdhxrqsxXKYCA==')
ON CONFLICT (id) DO UPDATE SET licensee = EXCLUDED.licensee, expires_at = EXCLUDED.expires_at, signature = EXCLUDED.signature;

COMMIT;
