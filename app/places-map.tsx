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
    [locating, setLocating] = useState(false),
    [currentPosition, setCurrentPosition] = useState<[number, number] | null>(
      position ?? null,
    );
  pickRef.current = onPick;
  selectRef.current = onSelect;
  useEffect(() => {
    let active = true;
    let observer: ResizeObserver | undefined;
    let resizeFrame = 0;
    const refreshMapSize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => map.current?.invalidateSize());
    };
    const reportOffline = () =>
      setError('لا يوجد اتصال بالإنترنت. ستظهر الخريطة عند عودة الاتصال.');
    const clearOfflineError = () => setError('');
    import('leaflet')
      .then((lib) => {
        if (!active || !container.current) return;
        L.current = lib;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const m = lib
          .map(container.current, {
            zoomControl: false,
            scrollWheelZoom: false,
            attributionControl: true,
            dragging: true,
            touchZoom: true,
            keyboard: true,
            preferCanvas: true,
            worldCopyJump: true,
            zoomAnimation: !isIOS,
            fadeAnimation: !isIOS,
            markerZoomAnimation: !isIOS,
          })
          .setView(position ?? picked ?? [24.705, 46.683], 13);
        map.current = m;
        lib
          .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            minZoom: 3,
            maxZoom: 19,
            maxNativeZoom: 19,
            updateWhenIdle: isIOS,
            keepBuffer: 2,
          })
          .on('tileerror', () =>
            setError('تعذّر تحميل بعض أجزاء الخريطة. تحقق من اتصالك.'),
          )
          .addTo(m);
        layer.current = lib.layerGroup().addTo(m);
        m.on('click', (event: Leaflet.LeafletMouseEvent) =>
          pickRef.current?.([event.latlng.lat, event.latlng.lng]),
        );
        observer = new ResizeObserver(refreshMapSize);
        observer.observe(container.current);
        window.addEventListener('resize', refreshMapSize, { passive: true });
        window.addEventListener('orientationchange', refreshMapSize, {
          passive: true,
        });
        window.visualViewport?.addEventListener('resize', refreshMapSize, {
          passive: true,
        });
        window.addEventListener('offline', reportOffline);
        window.addEventListener('online', clearOfflineError);
        m.whenReady(() => {
          refreshMapSize();
          setReady(true);
        });
      })
      .catch(() => setError('تعذّر تحميل الخريطة. أعد تحميل الصفحة.'));
    return () => {
      active = false;
      cancelAnimationFrame(resizeFrame);
      observer?.disconnect();
      window.removeEventListener('resize', refreshMapSize);
      window.removeEventListener('orientationchange', refreshMapSize);
      window.visualViewport?.removeEventListener('resize', refreshMapSize);
      window.removeEventListener('offline', reportOffline);
      window.removeEventListener('online', clearOfflineError);
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
    if (currentPosition)
      lib
        .circleMarker(currentPosition, {
          radius: 9,
          color: '#0c0f0d',
          weight: 4,
          fillColor: '#7cc6b4',
          fillOpacity: 1,
        })
        .bindTooltip('موقعك الحالي', { direction: 'top' })
        .addTo(layer.current);
  }, [entries, ready, picked, currentPosition]);
  useEffect(() => {
    if (position) setCurrentPosition(position);
  }, [position]);
  useEffect(() => {
    if (ready && currentPosition) map.current?.setView(currentPosition, 15);
  }, [ready, currentPosition]);
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
        setCurrentPosition(latlng);
        map.current?.setView(latlng, 15);
        if (pickRef.current) pickRef.current(latlng);
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
        aria-describedby="map-touch-help"
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
      <div id="map-touch-help" className="map-touch-hint">
        اسحب للتنقّل · قرّب بإصبعين
      </div>
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
