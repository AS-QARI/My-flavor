import type { Entry } from './entries';

const googleHosts = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'google.com.sa',
  'www.google.com.sa',
  'maps.google.com.sa',
  'maps.app.goo.gl',
  'goo.gl',
]);

export function googleMapsURL(value: string): URL | null {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.port ||
      url.username ||
      url.password ||
      !googleHosts.has(url.hostname)
    )
      return null;
    if (url.hostname === 'maps.app.goo.gl') return url;
    if (url.hostname === 'goo.gl')
      return url.pathname.startsWith('/maps/') ? url : null;
    return url.hostname.startsWith('maps.') ||
      /^\/maps(?:\/|$)/.test(url.pathname)
      ? url
      : null;
  } catch {
    return null;
  }
}

export function coordinates(lat: number, lng: number): [number, number] | null {
  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 85 &&
    Math.abs(lng) <= 180
    ? [lat, lng]
    : null;
}

// Place coordinates take precedence over the map's camera centre (@lat,lng).
export function parseGooglePlace(value: string) {
  const url = googleMapsURL(value);
  if (!url) throw new Error('الصق رابط مشاركة من قوقل ماب يبدأ بـ https://');
  let decoded: string;
  try {
    decoded = decodeURIComponent(url.href);
  } catch {
    decoded = url.href;
  }
  const pin = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const query =
    url.searchParams.get('query') || url.searchParams.get('q') || '';
  const pair = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  // A bare map link is a view, not a restaurant: never silently save its centre.
  const match = pin || pair;
  const position = match
    ? coordinates(Number(match[1]), Number(match[2]))
    : null;
  const place = url.pathname.match(/\/place\/([^/]+)/)?.[1];
  let name = '';
  if (place) {
    try {
      name = decodeURIComponent(place.replace(/\+/g, ' '));
    } catch {
      /* optional label */
    }
  }
  return { position, name: name.slice(0, 100), url: url.href };
}

export function mapsSearch(query: string) {
  return (
    'https://www.google.com/maps/search/?' +
    new URLSearchParams({ api: '1', query })
  );
}

export function mapsPlace(entry: Pick<Entry, 'lat' | 'lng' | 'googleMapsUrl'>) {
  return (
    (entry.googleMapsUrl && googleMapsURL(entry.googleMapsUrl)?.href) ||
    mapsSearch(`${entry.lat},${entry.lng}`)
  );
}

export function mapsDirections(entry: Pick<Entry, 'lat' | 'lng'>) {
  return (
    'https://www.google.com/maps/dir/?' +
    new URLSearchParams({
      api: '1',
      destination: `${entry.lat},${entry.lng}`,
      travelmode: 'driving',
      dir_action: 'navigate',
    })
  );
}
