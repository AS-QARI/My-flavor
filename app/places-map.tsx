'use client';
import { useEffect, useRef, useState, useId } from 'react';
import type { Entry } from '@/lib/entries';
import {
  LocateFixed,
  Plus,
  Minus,
  LoaderCircle,
  MapPinned,
  Maximize,
  Minimize,
} from 'lucide-react';
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
  const helpId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const tileLayer = useRef<Leaflet.TileLayer | null>(null);
  const [expanded, setExpanded] = useState(false);
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
    let resizeFrame = 0;
    const refreshMapSize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => map.current?.invalidateSize());
    };
    const reportOffline = () =>
      setError('لا يوجد اتصال بالإنترنت. ستظهر الخريطة عند عودة الاتصال.');
    const clearOfflineError = () => {
      setError('');
      tileLayer.current?.redraw();
    };
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
            zoomAnimation: false,
            fadeAnimation: !isIOS,
            markerZoomAnimation: false,
          })
          .setView(position ?? picked ?? [24.705, 46.683], 13);
        map.current = m;
        tileLayer.current = lib
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
          pickRef.current?.([
            Math.max(-85, Math.min(85, event.latlng.lat)),
            event.latlng.wrap().lng,
          ]),
        );
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
      window.removeEventListener('resize', refreshMapSize);
      window.removeEventListener('orientationchange', refreshMapSize);
      window.visualViewport?.removeEventListener('resize', refreshMapSize);
      window.removeEventListener('offline', reportOffline);
      window.removeEventListener('online', clearOfflineError);
      map.current?.stop();
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
        .bindTooltip(
          Object.assign(document.createElement('span'), {
            textContent: e.name,
          }),
          { direction: 'top', offset: [0, -40] },
        )
        .on('click', () => selectRef.current?.(e))
        .addTo(layer.current!);
    });
    if (picked)
      lib
        .marker(picked, {
          draggable: true,
          title: 'اسحب لتعديل موقع المطعم',
          icon: lib.divIcon({
            html: '<span class="place-pin"><span>＋</span></span>',
            className: 'custom-marker',
            iconSize: [48, 48],
            iconAnchor: [24, 48],
          }),
        })
        .on('dragend', (event) => {
          const point = (event.target as Leaflet.Marker).getLatLng().wrap();
          pickRef.current?.([
            Math.max(-85, Math.min(85, point.lat)),
            point.lng,
          ]);
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
    if (ready && picked)
      map.current?.setView(picked, Math.max(map.current.getZoom(), 15));
  }, [ready, picked]);
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
  function fitPlaces() {
    if (!map.current || !L.current) return;
    if (entries.length)
      map.current.fitBounds(
        L.current.latLngBounds(entries.map((e) => [e.lat, e.lng])),
        { padding: [60, 65], maxZoom: 15 },
      );
    else if (picked) map.current.setView(picked, 15);
    else map.current.setView([24.705, 46.683], 13);
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => map.current?.invalidateSize());
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    if (expanded) window.addEventListener('keydown', escape);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', escape);
    };
  }, [expanded]);
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
    <div
      ref={wrap}
      className={
        'map-wrap ' +
        (onPick ? 'picker-map ' : '') +
        (expanded ? 'expanded-map' : '')
      }
    >
      <div
        className="leaflet-map"
        ref={container}
        role="region"
        aria-label={
          onPick ? 'اضغط على الخريطة لتحديد المطعم' : 'خريطة المطاعم التي زرتها'
        }
        aria-describedby={helpId}
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
          onClick={fitPlaces}
          aria-label="عرض كل المطاعم"
          title="عرض كل المطاعم"
        >
          <MapPinned size={20} />
        </button>
        {!onPick && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'تصغير عرض الخريطة' : 'توسيع الخريطة'}
            title={expanded ? 'تصغير عرض الخريطة' : 'توسيع الخريطة'}
          >
            {expanded ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        )}
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
      {onPick && (
        <button
          type="button"
          className="pick-hint"
          onClick={() => {
            const point = map.current?.getCenter().wrap();
            if (point)
              pickRef.current?.([
                Math.max(-85, Math.min(85, point.lat)),
                point.lng,
              ]);
          }}
        >
          اختيار وسط الخريطة
        </button>
      )}
      <div id={helpId} className="map-touch-hint">
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
