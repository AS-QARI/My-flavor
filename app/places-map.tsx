'use client';
import { useEffect, useRef, useState } from 'react';
import type { Entry } from '@/lib/entries';
import { LocateFixed, Plus, Minus, LoaderCircle } from 'lucide-react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
export default function PlacesMap({
  entries,
  onSelect,
  onPick,
  picked,
  position,
}: {
  entries: Entry[];
  onSelect?: (e: Entry) => void;
  onPick?: (p: [number, number]) => void;
  picked?: [number, number] | null;
  position?: [number, number] | null;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<Leaflet.Map | null>(null),
    L = useRef<typeof Leaflet | null>(null),
    layer = useRef<Leaflet.LayerGroup | null>(null),
    pickRef = useRef(onPick),
    selectRef = useRef(onSelect);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [locating, setLocating] = useState(false);
  pickRef.current = onPick;
  selectRef.current = onSelect;
  useEffect(() => {
    let active = true;
    let observer: ResizeObserver | undefined;
    import('leaflet')
      .then((lib) => {
        if (!active || !container.current) return;
        L.current = lib;
        const m = lib
          .map(container.current, {
            zoomControl: false,
            scrollWheelZoom: false,
            attributionControl: true,
          })
          .setView(position ?? picked ?? [24.705, 46.683], 13);
        map.current = m;
        lib
          .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          })
          .on('tileerror', () =>
            setError('تعذّر تحميل بعض أجزاء الخريطة. تحقق من اتصالك.'),
          )
          .addTo(m);
        layer.current = lib.layerGroup().addTo(m);
        m.on('click', (event: Leaflet.LeafletMouseEvent) =>
          pickRef.current?.([event.latlng.lat, event.latlng.lng]),
        );
        observer = new ResizeObserver(() => m.invalidateSize());
        observer.observe(container.current);
        setReady(true);
      })
      .catch(() => setError('تعذّر تحميل الخريطة. أعد تحميل الصفحة.'));
    return () => {
      active = false;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !L.current || !map.current || !layer.current) return;
    const lib = L.current;
    layer.current.clearLayers();
    entries.forEach((e) => {
      const html = `<span class="place-pin ${e.rating ? '' : 'unrated-pin'}"><span>${e.rating ? '★ ' + e.rating : '○'}</span></span>`;
      lib
        .marker([e.lat, e.lng], {
          icon: lib.divIcon({
            html,
            className: 'custom-marker',
            iconSize: [48, 48],
            iconAnchor: [24, 48],
          }),
          title: e.name,
          alt: e.name,
        })
        .on('click', () => selectRef.current?.(e))
        .addTo(layer.current!);
    });
    if (picked)
      lib
        .marker(picked, {
          icon: lib.divIcon({
            html: '<span class="place-pin"><span>＋</span></span>',
            className: 'custom-marker',
            iconSize: [48, 48],
            iconAnchor: [24, 48],
          }),
        })
        .addTo(layer.current);
    if (position)
      lib
        .circleMarker(position, {
          radius: 8,
          color: '#fff',
          weight: 3,
          fillColor: '#3b786f',
          fillOpacity: 1,
        })
        .addTo(layer.current);
  }, [entries, ready, picked, position]);
  useEffect(() => {
    if (ready && position) map.current?.setView(position, 15);
  }, [ready, position]);
  useEffect(() => {
    if (!ready || !map.current || !L.current || picked) return;
    if (entries.length)
      map.current.fitBounds(
        L.current.latLngBounds(entries.map((e) => [e.lat, e.lng])),
        { padding: [60, 65], maxZoom: 14 },
      );
  }, [ready, entries, picked]);
  function locate() {
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        const latlng: [number, number] = [
          p.coords.latitude,
          p.coords.longitude,
        ];
        map.current?.setView(latlng, 15);
        if (pickRef.current) pickRef.current(latlng);
        else if (L.current && map.current)
          L.current
            .circleMarker(latlng, {
              radius: 8,
              color: '#fff',
              weight: 3,
              fillColor: '#3b786f',
              fillOpacity: 1,
            })
            .bindTooltip('أنت هنا')
            .addTo(map.current);
      },
      (e) => {
        setLocating(false);
        setError(
          e.code === 1
            ? 'السماح بالموقع متوقف. فعّله من إعدادات المتصفح، أو اختر المكان على الخريطة.'
            : 'تعذّر تحديد موقعك. حاول مرة أخرى.',
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }
  return (
    <div className={'map-wrap ' + (onPick ? 'picker-map' : '')}>
      <div
        className="leaflet-map"
        ref={container}
        role="region"
        aria-label={
          onPick ? 'اضغط على الخريطة لتحديد المطعم' : 'خريطة المطاعم التي زرتها'
        }
      />
      {!ready && (
        <div className="map-loading">
          <LoaderCircle className="spin" />
          جارٍ فتح الخريطة…
        </div>
      )}
      <div className="map-controls">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          aria-label="عرض موقعي الحالي"
        >
          {locating ? (
            <LoaderCircle className="spin" size={20} />
          ) : (
            <LocateFixed size={20} />
          )}
        </button>
        <div className="zoom-controls">
          <button
            type="button"
            onClick={() => map.current?.zoomIn()}
            aria-label="تكبير الخريطة"
          >
            <Plus size={19} />
          </button>
          <button
            type="button"
            onClick={() => map.current?.zoomOut()}
            aria-label="تصغير الخريطة"
          >
            <Minus size={19} />
          </button>
        </div>
      </div>
      {onPick && <div className="pick-hint">اضغط لتثبيت موقع المطعم</div>}
      {error && (
        <div className="map-error" role="status">
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="إغلاق التنبيه"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
