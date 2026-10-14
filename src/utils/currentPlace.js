import * as Location from 'expo-location';

export async function getCurrentPlace() {
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error('Turn on location (GPS) in your phone settings.');
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied. Allow it in your phone settings.');
  }
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude } = pos.coords;
  let region = '', town = '';
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (a) {
      region = a.region || a.subregion || '';
      town = a.district || a.city || a.subregion || '';
    }
  } catch {}
  return { lat: latitude, lng: longitude, region, town };
}

const norm = s => String(s || '').toLowerCase().replace(/\b(county|city)\b/g, '').replace(/[^a-z]/g, '');

export function matchCounty(region, counties = []) {
  const r = norm(region);
  if (!r) return null;
  return counties.find(c => norm(c) === r)
    || counties.find(c => norm(c) && (norm(c).includes(r) || r.includes(norm(c))))
    || null;
}
