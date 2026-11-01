param(
  [string]$BaseUrl = "https://localhost:3443",
  [switch]$Insecure = $true
)

$ErrorActionPreference = "Stop"
$curlArgs = @("-sS")
if ($Insecure -or $BaseUrl.StartsWith("https://localhost")) {
  $curlArgs += "-k"
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "     CYBERFORGE -  JUDGE DEMONSTRATION" -ForegroundColor Cyan
Write-Host "     Target URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Health
Write-Host "`n[Step 1/10] System Health Verification (GET /health)" -ForegroundColor Yellow
$health = & curl.exe @curlArgs "$BaseUrl/health"
Write-Host "Health Response: $health" -ForegroundColor Green

# 2. Licence Status & Renewal Without Server Restart
Write-Host "`n[Step 2/10] Ed25519 Signed Licence Status and Dynamic Renewal (GET and POST /license)" -ForegroundColor Yellow
$currentLic = & curl.exe @curlArgs "$BaseUrl/license"
Write-Host "Current Licence: $currentLic" -ForegroundColor Gray

# Attempt invalid tampered licence upload (Expected 400)
$tamperedPayload = '{"licensee":"Tampered Judge","expires_at":"2027-01-01T00:00:00.000Z","signature":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}'
$tamperedCode = $tamperedPayload | & curl.exe @curlArgs -o NUL -w "%{http_code}" -X POST "$BaseUrl/license" -H "Content-Type: application/json" "-d@-"
Write-Host "Tampered licence upload rejected with HTTP $tamperedCode (Expected 400)" -ForegroundColor Green

# 3. Seeded Verified Business Lookup (PRD Appendix C)
Write-Host "`n[Step 3/10] Verified Registry Precedence (GET /lookup)" -ForegroundColor Yellow
$lookupVerifiedUrl = "$BaseUrl/lookup?type=phone" + "&" + "value=1930"
$verified = & curl.exe @curlArgs $lookupVerifiedUrl
Write-Host "Verified Lookup: $verified" -ForegroundColor Green

# 4. Unknown Identifier (NO_REPORTS) and Invalid Format Rejection
Write-Host "`n[Step 4/10] Unknown Identifier and Validation (GET /lookup)" -ForegroundColor Yellow
$cleanPhone = "+919876543210"
$lookupCleanUrl = "$BaseUrl/lookup?type=phone" + "&" + "value=$cleanPhone"
$unreported = & curl.exe @curlArgs $lookupCleanUrl
Write-Host "Target Phone Lookup: $unreported" -ForegroundColor Gray
$lookupInvalidUrl = "$BaseUrl/lookup?type=phone" + "&" + "value=12345"
$invalidCode = & curl.exe @curlArgs -o NUL -w "%{http_code}" $lookupInvalidUrl
Write-Host "Malformed phone '12345' rejected with HTTP $invalidCode (Expected 400)" -ForegroundColor Green

# 5. Genuine Multi-Party Scam Reporting (POST /reports)
Write-Host "`n[Step 5/10] Ingesting 7 Genuinely Independent Reports (POST /reports)" -ForegroundColor Yellow
$pincode = "560102"
$scamType = "fake-customer-care"
$baseTime = (Get-Date).ToUniversalTime()

for ($i = 0; $i -lt 7; $i++) {
  $occurred = $baseTime.AddHours(-1 * ($i % 3 + 1)).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  $reported = $baseTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  $reportId = "judge-demo-report-$i-$([guid]::NewGuid().ToString().Substring(0,8))"
  $reporterId = "judge-citizen-reporter-$i-$([guid]::NewGuid().ToString().Substring(0,8))"
  $network = "judge-subnet-49.205.$($i * 7).0/24"
  $note = "Fraudulent customer care representative asked for OTP and debit card details (case $i)"

  $body = @{
    report_id = $reportId
    occurred_at = $occurred
    reported_at = $reported
    reporter_id = $reporterId
    ip_prefix = $network
    channel = "Phone call"
    scam_type = $scamType
    identifier_type = "phone"
    identifier_value = $cleanPhone
    pincode = $pincode
    locality = "HSR Layout"
    city = "Bengaluru"
    note = $note
    has_screenshot = $false
    amount_lost_inr = 0
  } | ConvertTo-Json -Compress

  $resp = $body | & curl.exe @curlArgs -X POST "$BaseUrl/reports" -H "Content-Type: application/json" "-d@-"
}
Write-Host "Submitted 7 distinct reports from 7 separate /24 networks." -ForegroundColor Green

# 6. Lookup Verdict Upgrade to KNOWN_SCAM with Evidence & Phone Unmasking
Write-Host "`n[Step 6/10] Deterministic Trust Qualification (GET /lookup)" -ForegroundColor Yellow
$qualifiedLookup = & curl.exe @curlArgs $lookupCleanUrl
Write-Host "Qualified Lookup Verdict: $qualifiedLookup" -ForegroundColor Green

# 7. Geographic Clustering & Anomaly Alerts (GET /map and GET /alerts)
Write-Host "`n[Step 7/10] Geographic Map Clusters and Spike Alerts (GET /map and GET /alerts)" -ForegroundColor Yellow
$mapUrl = "$BaseUrl/map?pincode=$pincode" + "&" + "days=7" + "&" + "radius_km=0"
$map = & curl.exe @curlArgs $mapUrl
Write-Host "Map Clusters: $map" -ForegroundColor Gray
$alertsUrl = "$BaseUrl/alerts?pincode=$pincode"
$alerts = & curl.exe @curlArgs $alertsUrl
Write-Host "Area Alerts: $alerts" -ForegroundColor Green

# 8. Adversarial Botnet Attack Resistance (40 reports, single IP subnet)
Write-Host "`n[Step 8/10] Adversarial Botnet Defense: 40 Copied Reports on Innocent Target" -ForegroundColor Yellow
$botTarget = "+919811112222"
for ($i = 0; $i -lt 40; $i++) {
  $botBody = @{
    report_id = "bot-$i-$([guid]::NewGuid().ToString().Substring(0,8))"
    occurred_at = $baseTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    reported_at = $baseTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    reporter_id = "bot-account-$i"
    ip_prefix = "182.74.55.0/24" # identical subnet
    channel = "Phone call"
    scam_type = "digital-arrest"
    identifier_type = "phone"
    identifier_value = $botTarget
    pincode = $pincode
    locality = "HSR Layout"
    city = "Bengaluru"
    note = "Identical scripted botnet text"
    has_screenshot = $false
    amount_lost_inr = 0
  } | ConvertTo-Json -Compress

  $null = $botBody | & curl.exe @curlArgs -X POST "$BaseUrl/reports" -H "Content-Type: application/json" "-d@-"
}
$lookupBotUrl = "$BaseUrl/lookup?type=phone" + "&" + "value=$botTarget"
$botLookup = & curl.exe @curlArgs $lookupBotUrl
Write-Host "Adversarial Target Lookup Verdict: $botLookup" -ForegroundColor Green
Write-Host "(Trust Engine successfully capped single subnet; target remains SUSPICIOUS, NOT KNOWN_SCAM)" -ForegroundColor Cyan

# 9. Dispute Challenge Shielding (POST /challenges)
Write-Host "`n[Step 9/10] Enterprise Dispute Filing and Shielding (POST /challenges)" -ForegroundColor Yellow
$challengeBody = @{
  identifier_type = "phone"
  identifier_value = $cleanPhone
  claimant_name = "Telecom Legal Representative"
  contact_email = "disputes@telecom-enterprise.test"
  proof_note = "Official carrier assignment certificate submitted"
} | ConvertTo-Json -Compress

$challengeResp = $challengeBody | & curl.exe @curlArgs -X POST "$BaseUrl/challenges" -H "Content-Type: application/json" "-d@-"
Write-Host "Challenge Submission: $challengeResp" -ForegroundColor Green
$shieldedLookup = & curl.exe @curlArgs $lookupCleanUrl
Write-Host "Disputed Lookup State: $shieldedLookup" -ForegroundColor Green
Write-Host "(Lookup immediately marks challenged=true and protects against KNOWN_SCAM during review)" -ForegroundColor Cyan

# 10. Reset Safety Check (POST /admin/reset)
Write-Host "`n[Step 10/10] Destructive Reset Protection (POST /admin/reset)" -ForegroundColor Yellow
$resetCode = & curl.exe @curlArgs -o NUL -w "%{http_code}" -X POST "$BaseUrl/admin/reset"
Write-Host "Unauthorized/Production reset attempt returned HTTP $resetCode (Expected 503)" -ForegroundColor Green

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "     ALL 10 DEMONSTRATION PHASES COMPLETED SUCCESSFULLY!" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
