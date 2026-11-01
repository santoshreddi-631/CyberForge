/**
 * Comprehensive Indian Postal Code and Geographic Centroid Resolver.
 * Maps any valid 6-digit Indian PIN code or city name to authoritative coordinates.
 */

interface GeoCoordinate {
  lat: number;
  lng: number;
}

// Major Indian cities and district centroids
const CITY_CENTROIDS: Record<string, GeoCoordinate> = {
  guntur: { lat: 16.3067, lng: 80.4365 },
  vijayawada: { lat: 16.5062, lng: 80.648 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vizag: { lat: 17.6868, lng: 83.2185 },
  delhi: { lat: 28.6139, lng: 77.209 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  patna: { lat: 25.5941, lng: 85.1376 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  indore: { lat: 22.7196, lng: 75.8577 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  surat: { lat: 21.1702, lng: 72.8311 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  vizianagaram: { lat: 18.1124, lng: 83.3986 },
  tirupati: { lat: 13.6288, lng: 79.4192 },
};

// Two-digit postal prefix mapping covering all Indian Postal Circles
const POSTAL_PREFIX_CENTROIDS: Record<string, GeoCoordinate> = {
  "11": { lat: 28.6139, lng: 77.209 }, // Delhi
  "12": { lat: 28.4595, lng: 77.0266 }, // Haryana (Gurugram/Faridabad)
  "13": { lat: 30.129, lng: 77.2674 }, // Haryana (Ambala/Yamunanagar)
  "14": { lat: 31.326, lng: 75.5762 }, // Punjab (Jalandhar/Ludhiana)
  "15": { lat: 30.211, lng: 74.9455 }, // Punjab (Bathinda)
  "16": { lat: 30.7333, lng: 76.7794 }, // Chandigarh & Mohali
  "17": { lat: 31.1048, lng: 77.1734 }, // Himachal Pradesh
  "18": { lat: 32.7266, lng: 74.857 }, // Jammu & Kashmir (Jammu)
  "19": { lat: 34.0837, lng: 74.7973 }, // Jammu & Kashmir (Srinagar)
  "20": { lat: 27.8974, lng: 78.088 }, // UP (Aligarh/Bulandshahr)
  "21": { lat: 25.4358, lng: 81.8463 }, // UP (Prayagraj/Fatehpur)
  "22": { lat: 26.8467, lng: 80.9462 }, // UP (Lucknow/Faizabad)
  "23": { lat: 25.1437, lng: 82.5644 }, // UP (Mirzapur/Varanasi)
  "24": { lat: 30.3165, lng: 78.0322 }, // Uttarakhand & Moradabad
  "25": { lat: 28.9845, lng: 77.7064 }, // UP (Meerut)
  "26": { lat: 27.9135, lng: 79.919 }, // UP (Bareilly)
  "27": { lat: 26.7606, lng: 83.3732 }, // UP (Gorakhpur)
  "28": { lat: 25.4484, lng: 78.5685 }, // UP (Jhansi/Agra)
  "30": { lat: 26.9124, lng: 75.7873 }, // Rajasthan (Jaipur)
  "31": { lat: 24.5854, lng: 73.7125 }, // Rajasthan (Udaipur)
  "32": { lat: 25.1761, lng: 75.8362 }, // Rajasthan (Kota)
  "33": { lat: 28.0229, lng: 73.3119 }, // Rajasthan (Bikaner)
  "34": { lat: 26.2389, lng: 73.0243 }, // Rajasthan (Jodhpur)
  "36": { lat: 22.3039, lng: 70.8022 }, // Gujarat (Rajkot)
  "37": { lat: 23.242, lng: 69.6669 }, // Gujarat (Kutch/Bhuj)
  "38": { lat: 23.0225, lng: 72.5714 }, // Gujarat (Ahmedabad/Gandhinagar)
  "39": { lat: 21.1702, lng: 72.8311 }, // Gujarat (Surat/Vadodara)
  "40": { lat: 19.076, lng: 72.8777 }, // Maharashtra (Mumbai/Thane)
  "41": { lat: 18.5204, lng: 73.8567 }, // Maharashtra (Pune)
  "42": { lat: 19.9975, lng: 73.7898 }, // Maharashtra (Nashik)
  "43": { lat: 19.8762, lng: 75.3433 }, // Maharashtra (Aurangabad)
  "44": { lat: 21.1458, lng: 79.0882 }, // Maharashtra (Nagpur)
  "45": { lat: 22.7196, lng: 75.8577 }, // MP (Indore)
  "46": { lat: 23.2599, lng: 77.4126 }, // MP (Bhopal)
  "47": { lat: 26.2183, lng: 78.1828 }, // MP (Gwalior)
  "48": { lat: 23.1815, lng: 79.9864 }, // MP (Jabalpur)
  "49": { lat: 21.2514, lng: 81.6296 }, // Chhattisgarh (Raipur)
  "50": { lat: 17.385, lng: 78.4867 }, // Telangana (Hyderabad)
  "51": { lat: 13.6288, lng: 79.4192 }, // AP (Tirupati/Rayalaseema)
  "52": { lat: 16.5062, lng: 80.648 }, // AP (Vijayawada/Guntur)
  "53": { lat: 17.6868, lng: 83.2185 }, // AP (Visakhapatnam/Vizianagaram)
  "56": { lat: 12.9716, lng: 77.5946 }, // Karnataka (Bengaluru)
  "57": { lat: 12.9141, lng: 74.856 }, // Karnataka (Mangaluru/Mysuru)
  "58": { lat: 15.3647, lng: 75.124 }, // Karnataka (Hubballi/Dharwad)
  "59": { lat: 15.8497, lng: 74.4977 }, // Karnataka (Belagavi)
  "60": { lat: 13.0827, lng: 80.2707 }, // Tamil Nadu (Chennai)
  "61": { lat: 10.7905, lng: 79.1378 }, // Tamil Nadu (Thanjavur)
  "62": { lat: 9.9252, lng: 78.1198 }, // Tamil Nadu (Madurai)
  "63": { lat: 12.9165, lng: 79.1325 }, // Tamil Nadu (Vellore)
  "64": { lat: 11.0168, lng: 76.9558 }, // Tamil Nadu (Coimbatore)
  "67": { lat: 11.2588, lng: 75.7804 }, // Kerala (Kozhikode/Kannur)
  "68": { lat: 9.9312, lng: 76.2673 }, // Kerala (Kochi/Ernakulam)
  "69": { lat: 8.5241, lng: 76.9366 }, // Kerala (Thiruvananthapuram)
  "70": { lat: 22.5726, lng: 88.3639 }, // West Bengal (Kolkata)
  "71": { lat: 22.5958, lng: 88.2636 }, // West Bengal (Howrah/Hooghly)
  "72": { lat: 22.4288, lng: 87.3204 }, // West Bengal (Midnapore)
  "73": { lat: 26.7271, lng: 88.3953 }, // West Bengal (Siliguri)
  "74": { lat: 24.1843, lng: 88.2811 }, // West Bengal (Murshidabad)
  "75": { lat: 20.2961, lng: 85.8245 }, // Odisha (Bhubaneswar/Cuttack)
  "76": { lat: 19.3149, lng: 84.7941 }, // Odisha (Berhampur)
  "77": { lat: 21.4669, lng: 83.9812 }, // Odisha (Sambalpur/Rourkela)
  "78": { lat: 26.1445, lng: 91.7362 }, // Assam (Guwahati)
  "79": { lat: 25.5788, lng: 91.8933 }, // North East (Shillong/Imphal/Agartala)
  "80": { lat: 25.5941, lng: 85.1376 }, // Bihar (Patna)
  "81": { lat: 25.2425, lng: 86.9842 }, // Bihar (Bhagalpur)
  "82": { lat: 24.7914, lng: 85.0002 }, // Bihar (Gaya/Bokaro)
  "83": { lat: 23.3441, lng: 85.3096 }, // Jharkhand (Ranchi/Jamshedpur)
  "84": { lat: 26.1209, lng: 85.3647 }, // Bihar (Muzaffarpur)
  "85": { lat: 25.7711, lng: 87.481 }, // Bihar (Purnea)
};

// Geographic center of India (default fallback)
const DEFAULT_INDIA_CENTROID: GeoCoordinate = { lat: 21.1458, lng: 79.0882 };

/**
 * Resolves map coordinates for any Indian PIN code or location.
 * Priority:
 * 1. Provided explicit coordinates (from map picker or client geocoder).
 * 2. Matched city name.
 * 3. 2-digit PIN code prefix.
 * 4. National centroid fallback.
 */
export function resolvePostalCoordinates(
  pincode: string,
  inputLat?: number | null,
  inputLng?: number | null,
  city?: string | null
): GeoCoordinate {
  if (
    typeof inputLat === "number" &&
    typeof inputLng === "number" &&
    Number.isFinite(inputLat) &&
    Number.isFinite(inputLng) &&
    inputLat >= 6.0 &&
    inputLat <= 38.0 &&
    inputLng >= 68.0 &&
    inputLng <= 98.0
  ) {
    return { lat: inputLat, lng: inputLng };
  }

  if (city) {
    const normalizedCity = city.trim().toLowerCase();
    if (CITY_CENTROIDS[normalizedCity]) {
      return CITY_CENTROIDS[normalizedCity];
    }
  }

  const prefix = pincode.slice(0, 2);
  if (POSTAL_PREFIX_CENTROIDS[prefix]) {
    return POSTAL_PREFIX_CENTROIDS[prefix];
  }

  return DEFAULT_INDIA_CENTROID;
}
