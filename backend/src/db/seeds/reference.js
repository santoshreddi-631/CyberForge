// Appendix B centroids are public reference points, never reporter coordinates.
const areas = [
    ['560102', 'HSR Layout', 'Bengaluru', '12.9116', '77.6473'],
    ['560038', 'Indiranagar', 'Bengaluru', '12.9784', '77.6408'],
    ['560034', 'Koramangala', 'Bengaluru', '12.9352', '77.6245'],
    ['560066', 'Whitefield', 'Bengaluru', '12.9698', '77.7500'],
    ['560076', 'BTM Layout', 'Bengaluru', '12.9166', '77.6101'],
    ['560011', 'Jayanagar', 'Bengaluru', '12.9299', '77.5826'],
    ['560037', 'Marathahalli', 'Bengaluru', '12.9591', '77.6974'],
    ['560103', 'Bellandur', 'Bengaluru', '12.9260', '77.6762'],
    ['560100', 'Electronic City', 'Bengaluru', '12.8452', '77.6602'],
    ['560078', 'JP Nagar', 'Bengaluru', '12.9077', '77.5851'],
    ['560003', 'Malleshwaram', 'Bengaluru', '13.0035', '77.5709'],
    ['560010', 'Rajajinagar', 'Bengaluru', '12.9915', '77.5520'],
    ['560024', 'Hebbal', 'Bengaluru', '13.0358', '77.5970'],
    ['560064', 'Yelahanka', 'Bengaluru', '13.1007', '77.5963'],
    ['560070', 'Banashankari', 'Bengaluru', '12.9250', '77.5468'],
    ['400050', 'Bandra West', 'Mumbai', '19.0596', '72.8295'],
    ['110016', 'Hauz Khas', 'Delhi', '28.5494', '77.2001'],
    ['500081', 'Madhapur', 'Hyderabad', '17.4486', '78.3908'],
    ['600020', 'Adyar', 'Chennai', '13.0012', '80.2565'],
    ['411014', 'Viman Nagar', 'Pune', '18.5679', '73.9143'],
    ['700091', 'Salt Lake Sector V', 'Kolkata', '22.5790', '88.4290'],
    ['380015', 'Satellite', 'Ahmedabad', '23.0260', '72.5085'],
    ['302017', 'Malviya Nagar', 'Jaipur', '26.8570', '75.8080'],
    ['226010', 'Gomti Nagar', 'Lucknow', '26.8540', '80.9990'],
    ['682030', 'Kakkanad', 'Kochi', '10.0159', '76.3419']
];
const verified = [
    ['phone', '1930', 'National Cybercrime Helpline'], ['phone', '1909', 'TRAI Do Not Disturb'],
    ['phone', '18001600', 'HDFC Bank customer care'], ['phone', '18002600', 'HDFC Bank customer care'],
    ['phone', '18001080', 'ICICI Bank customer care'], ['phone', '18001234', 'State Bank of India customer care'], ['phone', '18002100', 'State Bank of India customer care'],
    ['phone', '18604195555', 'Axis Bank customer care'], ['phone', '18602662666', 'Kotak Mahindra Bank customer care'],
    ['sender_id', 'HDFCBK', 'HDFC Bank SMS sender'], ['sender_id', 'ICICIB', 'ICICI Bank SMS sender'], ['sender_id', 'SBIINB', 'State Bank of India SMS sender'], ['sender_id', 'AXISBK', 'Axis Bank SMS sender'], ['sender_id', 'KOTAKB', 'Kotak Mahindra Bank SMS sender'],
    ['url', 'https://cybercrime.gov.in', 'National Cyber Crime Reporting Portal'], ['url', 'https://sancharsaathi.gov.in', 'Sanchar Saathi'],
    ['phone', '+918041002233', 'Fresh Bakes, Indiranagar (made up)'], ['phone', '+918025530190', 'Koramangala Pharmacy (made up)'], ['upi', 'freshbakes@okaxis', 'Fresh Bakes, Indiranagar (made up)']
];
const scamTypes = ['digital-arrest', 'fake-kyc-link', 'upi-refund-qr', 'investment-group', 'courier-customs', 'job-offer', 'lottery-prize', 'loan-app-harassment', 'electricity-disconnection', 'fake-customer-care', 'otp-call', 'sextortion'];
const channels = ['Phone call', 'SMS or WhatsApp', 'QR code', 'Fake website', 'UPI request', 'Something else'];
function normalizeScamType(value) { return scamTypes.includes(value) ? value : 'other'; }
function validateChannel(value) { if (!channels.includes(value))
    throw new Error('Invalid report channel'); return value; }
module.exports = { areas, verified, scamTypes, channels, normalizeScamType, validateChannel };
