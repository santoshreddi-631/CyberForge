/**
 * Standard definitions from Community Scam Map PRD (Appendix B and C)
 */

export interface AreaInfo {
  code: string; // pincode
  area: string; // locality
  city: string;
  lat: number;
  lng: number;
}

export const MONITORED_AREAS: AreaInfo[] = [
  { code: "560102", area: "HSR Layout", city: "Bengaluru", lat: 12.9116, lng: 77.6473 },
  { code: "560038", area: "Indiranagar", city: "Bengaluru", lat: 12.9784, lng: 77.6408 },
  { code: "560034", area: "Koramangala", city: "Bengaluru", lat: 12.9352, lng: 77.6245 },
  { code: "560066", area: "Whitefield", city: "Bengaluru", lat: 12.9698, lng: 77.75 },
  { code: "560076", area: "BTM Layout", city: "Bengaluru", lat: 12.9166, lng: 77.6101 },
  { code: "560011", area: "Jayanagar", city: "Bengaluru", lat: 12.9299, lng: 77.5826 },
  { code: "560037", area: "Marathahalli", city: "Bengaluru", lat: 12.9591, lng: 77.6974 },
  { code: "560103", area: "Bellandur", city: "Bengaluru", lat: 12.926, lng: 77.6762 },
  { code: "560100", area: "Electronic City", city: "Bengaluru", lat: 12.8452, lng: 77.6602 },
  { code: "560078", area: "JP Nagar", city: "Bengaluru", lat: 12.9077, lng: 77.5851 },
  { code: "560003", area: "Malleshwaram", city: "Bengaluru", lat: 13.0035, lng: 77.5709 },
  { code: "560010", area: "Rajajinagar", city: "Bengaluru", lat: 12.9915, lng: 77.552 },
  { code: "560024", area: "Hebbal", city: "Bengaluru", lat: 13.0358, lng: 77.597 },
  { code: "560064", area: "Yelahanka", city: "Bengaluru", lat: 13.1007, lng: 77.5963 },
  { code: "560070", area: "Banashankari", city: "Bengaluru", lat: 12.925, lng: 77.5468 },
  { code: "400050", area: "Bandra West", city: "Mumbai", lat: 19.0596, lng: 72.8295 },
  { code: "110016", area: "Hauz Khas", city: "Delhi", lat: 28.5494, lng: 77.2001 },
  { code: "500081", area: "Madhapur", city: "Hyderabad", lat: 17.4486, lng: 78.3908 },
  { code: "600020", area: "Adyar", city: "Chennai", lat: 13.0012, lng: 80.2565 },
  { code: "411014", area: "Viman Nagar", city: "Pune", lat: 18.5679, lng: 73.9143 },
  { code: "700091", area: "Salt Lake Sector V", city: "Kolkata", lat: 22.579, lng: 88.429 },
  { code: "380015", area: "Satellite", city: "Ahmedabad", lat: 23.026, lng: 72.5085 },
  { code: "302017", area: "Malviya Nagar", city: "Jaipur", lat: 26.857, lng: 75.808 },
  { code: "226010", area: "Gomti Nagar", city: "Lucknow", lat: 26.854, lng: 80.999 },
  { code: "682030", area: "Kakkanad", city: "Kochi", lat: 10.0159, lng: 76.3419 },
  { code: "530001", area: "Dwaraka Nagar", city: "Visakhapatnam", lat: 17.7231, lng: 83.3012 },
  { code: "520001", area: "Governorpet", city: "Vijayawada", lat: 16.5103, lng: 80.6276 },
  { code: "522001", area: "Arundelpet", city: "Guntur", lat: 16.3008, lng: 80.4428 },
  { code: "535579", area: "Vizianagaram Locality", city: "Vizianagaram", lat: 18.1124, lng: 83.3978 },
];

export type ReportChannel =
  | "Phone call"
  | "SMS or WhatsApp"
  | "QR code"
  | "Fake website"
  | "UPI request"
  | "Something else";

export const REPORT_CHANNELS: { value: ReportChannel; label: string; labelHi: string }[] = [
  { value: "Phone call", label: "Phone Call", labelHi: "फ़ोन कॉल" },
  { value: "SMS or WhatsApp", label: "SMS or WhatsApp Message", labelHi: "एसएमएस या व्हाट्सएप संदेश" },
  { value: "UPI request", label: "UPI Request / Collect Link", labelHi: "यूपीआई अनुरोध / कलेक्ट लिंक" },
  { value: "QR code", label: "QR Code", labelHi: "क्यूआर कोड" },
  { value: "Fake website", label: "Fake Website / Phishing Link", labelHi: "नकली वेबसाइट / फ़िशिंग लिंक" },
  { value: "Something else", label: "Something else", labelHi: "अन्य माध्यम" },
];

export type ReportScamType =
  | "digital-arrest"
  | "fake-kyc-link"
  | "upi-refund-qr"
  | "investment-group"
  | "courier-customs"
  | "job-offer"
  | "lottery-prize"
  | "loan-app-harassment"
  | "electricity-disconnection"
  | "fake-customer-care"
  | "otp-call"
  | "sextortion"
  | "other";

export const REPORT_SCAM_TYPES: { type: ReportScamType; label: string; description: string }[] = [
  {
    type: "digital-arrest",
    label: "Digital Arrest Video Call",
    description: "Fake police or law enforcement video call threatening arrest",
  },
  {
    type: "fake-kyc-link",
    label: "Fake Bank / KYC Update Link",
    description: "Phishing link mimicking bank portal, PAN or Aadhaar update",
  },
  {
    type: "upi-refund-qr",
    label: "UPI Refund QR Code Scam",
    description: "Asked to scan QR code or enter UPI PIN to receive money or refunds",
  },
  {
    type: "investment-group",
    label: "Investment / WhatsApp Trading Group",
    description: "High-yield investment group promising fake guaranteed returns",
  },
  {
    type: "job-offer",
    label: "Part-Time Job / Task Scam",
    description: "Work-from-home task job demanding prepaid deposits",
  },
  {
    type: "courier-customs",
    label: "Parcel / Customs Fine Scam",
    description: "Claims that a drug parcel or courier is held at customs",
  },
  {
    type: "lottery-prize",
    label: "Lottery / KBC Prize Scam",
    description: "Fake lottery winning notification requiring clearance fee",
  },
  {
    type: "loan-app-harassment",
    label: "Instant Loan App Harassment",
    description: "Illegal micro-lending app blackmailing contacts",
  },
  {
    type: "electricity-disconnection",
    label: "Electricity / Utility Disconnection",
    description: "Urgent SMS claiming power will be cut tonight unless bill paid to number",
  },
  {
    type: "fake-customer-care",
    label: "Fake Customer Care Number",
    description: "Fraudulent support contact number from search engine ad",
  },
  {
    type: "otp-call",
    label: "OTP / Card Verification Call",
    description: "Impersonator asking for one-time password or card numbers",
  },
  {
    type: "sextortion",
    label: "Video Call Extortion",
    description: "Compromising video call recording used for financial extortion",
  },
  {
    type: "other",
    label: "Other Scam Pattern",
    description: "Any other suspicious fraudulent activity",
  },
];

export function getScamTypeLabel(scamType?: string): string {
  if (!scamType) return "Unspecified Scam";
  const match = REPORT_SCAM_TYPES.find(
    (item) => item.type === scamType || item.type.replace(/-/g, "_") === scamType.replace(/-/g, "_")
  );
  if (match) return match.label;
  return scamType
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
