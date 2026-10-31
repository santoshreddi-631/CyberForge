import postgres from 'postgres';
import crypto from 'crypto';

const sql = postgres('postgres://postgres:S%40nthuu631@localhost:5432/cyberforge');

const additionalAreas = [
  { pincode: '530001', locality: 'Dwaraka Nagar', city: 'Visakhapatnam', lat: 17.7231, lng: 83.3012 },
  { pincode: '520001', locality: 'Governorpet', city: 'Vijayawada', lat: 16.5103, lng: 80.6276 },
  { pincode: '522001', locality: 'Arundelpet', city: 'Guntur', lat: 16.3008, lng: 80.4428 },
  { pincode: '535579', locality: 'Vizianagaram Locality', city: 'Vizianagaram', lat: 18.1124, lng: 83.3978 },
];

for (const a of additionalAreas) {
  await sql`
    INSERT INTO areas (pincode, locality, city, lat, lng)
    VALUES (${a.pincode}, ${a.locality}, ${a.city}, ${a.lat}, ${a.lng})
    ON CONFLICT (pincode) DO UPDATE
    SET locality = EXCLUDED.locality,
        city = EXCLUDED.city,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng
  `;
}
console.log('Areas upserted.');

// Target cases for the cities
const clustersToSeed = [
  {
    phone: '+919440112233',
    city: 'Hyderabad',
    locality: 'Madhapur',
    pincode: '500081',
    scamType: 'fake-kyc-link',
    reportCount: 8,
    channel: 'SMS or WhatsApp',
    note: 'Bank KYC expired message containing phishing link to fake netbanking portal'
  },
  {
    phone: '+919810112233',
    city: 'Delhi',
    locality: 'Hauz Khas',
    pincode: '110016',
    scamType: 'digital-arrest',
    reportCount: 12,
    channel: 'Phone call',
    note: 'Impersonating CBI officer claiming parcel with contraband caught at customs'
  },
  {
    phone: '+918912112233',
    city: 'Visakhapatnam',
    locality: 'Dwaraka Nagar',
    pincode: '530001',
    scamType: 'investment-group',
    reportCount: 6,
    channel: 'SMS or WhatsApp',
    note: 'Added to VIP stock trading Telegram group promising 400 percent weekly profit'
  },
  {
    phone: '+918662112233',
    city: 'Vijayawada',
    locality: 'Governorpet',
    pincode: '520001',
    scamType: 'upi-refund-qr',
    reportCount: 5,
    channel: 'QR code',
    note: 'Sent electricity bill refund QR code that debited money instead of crediting'
  },
  {
    phone: '+918632112233',
    city: 'Guntur',
    locality: 'Arundelpet',
    pincode: '522001',
    scamType: 'job-offer',
    reportCount: 4,
    channel: 'SMS or WhatsApp',
    note: 'YouTube video review part-time job scam demanding upfront deposit fee'
  }
];

const secret = 'replace-with-a-separate-random-secret-of-at-least-32-bytes';

for (const cluster of clustersToSeed) {
  // Ensure identifier exists
  const [ident] = await sql`
    INSERT INTO identifiers (identifier_type, normalized_value)
    VALUES ('phone', ${cluster.phone})
    ON CONFLICT (identifier_type, normalized_value) DO UPDATE
    SET normalized_value = EXCLUDED.normalized_value
    RETURNING id
  `;

  // Ensure case exists
  const [c] = await sql`
    INSERT INTO cases (identifier_id)
    VALUES (${ident.id})
    ON CONFLICT (identifier_id) DO UPDATE
    SET identifier_id = EXCLUDED.identifier_id
    RETURNING id
  `;

  const now = new Date();

  for (let i = 0; i < cluster.reportCount; i++) {
    const reportId = `seed-${cluster.city.toLowerCase()}-${i}-${Date.now().toString(36)}`;
    const reporterId = `citizen-${cluster.city.toLowerCase()}-${i}-${Date.now().toString(36)}`;
    const ipPrefix = `49.205.${(i * 13) % 250}.0/24`;
    const occurredAt = new Date(now.getTime() - (i + 1) * 3600 * 1000 * 4); // Spaced across hours

    const reporterHmac = crypto.createHmac('sha256', secret).update(`reporter:${reporterId}`).digest('hex');
    const ipHmac = crypto.createHmac('sha256', secret).update(`ip:${ipPrefix}`).digest('hex');

    const [reporterSignal] = await sql`
      INSERT INTO reporter_signals (reporter_hmac)
      VALUES (${reporterHmac})
      ON CONFLICT (reporter_hmac) DO UPDATE
      SET reporter_hmac = EXCLUDED.reporter_hmac
      RETURNING id
    `;

    const [rep] = await sql`
      INSERT INTO reports (
        report_id, case_id, reporter_signal_id, ip_prefix_hmac,
        occurred_at, reported_at, pincode, scam_type, channel,
        sanitized_note, has_screenshot, amount_lost_inr, created_at
      ) VALUES (
        ${reportId}, ${c.id}, ${reporterSignal.id}, ${ipHmac},
        ${occurredAt.toISOString()}, ${now.toISOString()}, ${cluster.pincode},
        ${cluster.scamType}, ${cluster.channel},
        ${cluster.note + ' (independent incident ' + (i + 1) + ')'},
        ${i % 2 === 0}, ${(i * 1500).toFixed(2)}, clock_timestamp()
      )
      RETURNING id
    `;

    await sql`
      INSERT INTO trust_decisions (
        report_id, status, weight, reason_code, algorithm_version, decided_at
      ) VALUES (
        ${rep.id}, 'eligible', 0.2500,
        'Representative report from a distinct reporter and IP prefix contributes one trusted voice.',
        'phase5-v1', now()
      )
      ON CONFLICT (report_id) DO UPDATE
      SET status = 'eligible',
          weight = 0.2500,
          reason_code = 'Representative report from a distinct reporter and IP prefix contributes one trusted voice.',
          decided_at = now()
    `;
  }

  console.log(`Seeded ${cluster.reportCount} eligible reports for ${cluster.city} (${cluster.locality})`);
}

await sql.end();
console.log('Seeding finished successfully.');
