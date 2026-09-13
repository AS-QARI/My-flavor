import test from 'node:test';
import assert from 'node:assert/strict';
import {
  googleMapsURL,
  parseGooglePlace,
  mapsDirections,
  mapsPlace,
} from '../lib/google-maps.ts';

test('imports the restaurant pin, not a different camera centre', () => {
  const place = parseGooglePlace(
    'https://www.google.com/maps/place/مطعم+الرياض/@21.1,39.2,12z/data=!3d24.7!4d46.68',
  );
  assert.deepEqual(place.position, [24.7, 46.68]);
  assert.equal(place.name, 'مطعم الرياض');
});

test('accepts coordinate sharing links, including zero and negative values', () => {
  assert.deepEqual(
    parseGooglePlace(
      'https://www.google.com/maps/search/?api=1&query=0%2C-46.68',
    ).position,
    [0, -46.68],
  );
  assert.deepEqual(
    parseGooglePlace('https://maps.google.com/?q=24.7,46.68').position,
    [24.7, 46.68],
  );
});

test('does not confuse a camera centre or search name with a confirmed location', () => {
  for (const path of [
    '@24.7,46.68,15z',
    '?ll=24.7,46.68',
    'search/?api=1&query=Restaurant',
  ]) {
    assert.equal(
      parseGooglePlace('https://www.google.com/maps/' + path).position,
      null,
    );
  }
});

test('rejects unsafe URLs and host lookalikes before any fetch', () => {
  for (const url of [
    'http://maps.app.goo.gl/test',
    'https://google.com.evil.test/maps/',
    'https://maps.app.goo.gl@127.0.0.1/',
    'https://www.google.com:8443/maps/',
    'https://user:pass@maps.app.goo.gl/test',
    'javascript:alert(1)',
    'https://goo.gl/anything',
    'https://www.google.com/url?q=http://127.0.0.1',
  ]) {
    assert.equal(googleMapsURL(url), null, url);
  }
  assert.ok(googleMapsURL('https://maps.app.goo.gl/test'));
  assert.ok(googleMapsURL('https://goo.gl/maps/test'));
});

test('rejects coordinates outside the displayed map range', () => {
  assert.equal(
    parseGooglePlace('https://www.google.com/maps/?q=90,46').position,
    null,
  );
  assert.equal(
    parseGooglePlace('https://www.google.com/maps/?q=24,181').position,
    null,
  );
});

test('directions use the saved pin and let Google determine the origin', () => {
  const url = new URL(mapsDirections({ lat: 21.5433, lng: 39.1728 }));
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('destination'), '21.5433,39.1728');
  assert.equal(url.searchParams.has('origin'), false);
});

test('preserves the Google place link and falls back to a coordinate pin', () => {
  const link = 'https://www.google.com/maps/place/Test/data=!3d24.7!4d46.68';
  assert.equal(mapsPlace({ lat: 24.7, lng: 46.68, googleMapsUrl: link }), link);
  assert.equal(
    new URL(
      mapsPlace({
        lat: 24.7,
        lng: 46.68,
        googleMapsUrl: 'javascript:alert(1)',
      }),
    ).searchParams.get('query'),
    '24.7,46.68',
  );
});
