'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Camera,
  Check,
  LoaderCircle,
  MapPin,
  Star,
  X,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { today, type Entry } from '@/lib/entries';
import PlacesMap from './places-map';
const categories = [
  'مطعم',
  'إيطالي',
  'سعودي',
  'ياباني',
  'برجر',
  'مقهى',
  'حلويات',
  'أخرى',
];
export default function EntryEditor({
  entry,
  onClose,
  onSaved,
}: {
  entry?: Entry;
  onClose: () => void;
  onSaved: (e: Entry) => void;
}) {
  const [id] = useState(() => entry?.id ?? crypto.randomUUID());
  const [name, setName] = useState(entry?.name ?? ''),
    [area, setArea] = useState(entry?.area ?? ''),
    [category, setCategory] = useState(entry?.category ?? 'مطعم'),
    [date, setDate] = useState(entry?.date ?? today()),
    [rating, setRating] = useState(entry?.rating ?? 0),
    [notes, setNotes] = useState(entry?.notes ?? ''),
    [picked, setPicked] = useState<[number, number] | null>(
      entry ? [entry.lat, entry.lng] : null,
    );
  const [existing, setExisting] = useState(entry?.photos ?? []),
    [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]),
    [saving, setSaving] = useState(false),
    [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false),
    [error, setError] = useState(''),
    [progress, setProgress] = useState(''),
    [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const urls = useRef<string[]>([]),
    uploaded = useRef(new Map<File, string>());
  useEffect(
    () => () => urls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );
  useEffect(() => {
    const updateViewportHeight = () =>
      setViewportHeight(window.visualViewport?.height ?? window.innerHeight);
    updateViewportHeight();
    window.visualViewport?.addEventListener('resize', updateViewportHeight, {
      passive: true,
    });
    window.addEventListener('orientationchange', updateViewportHeight, {
      passive: true,
    });
    return () => {
      window.visualViewport?.removeEventListener(
        'resize',
        updateViewportHeight,
      );
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);
  function close() {
    if (saving) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  function pick(p: [number, number]) {
    setPicked(p);
    setDirty(true);
  }
  function addPhotos(files: FileList | null) {
    if (!files) return;
    setError('');
    const selected = Array.from(files);
    if (selected.length + photos.length + existing.length > 6) {
      setError('يمكنك إضافة ٦ صور لكل تجربة.');
      return;
    }
    if (selected.some((f) => f.size > 25 * 1024 * 1024)) {
      setError('اختر صورًا أصغر من ٢٥ ميغابايت للصورة الواحدة.');
      return;
    }
    if (selected.some((f) => !f.type.startsWith('image/'))) {
      setError('اختر ملفات صور فقط.');
      return;
    }
    setPhotos((p) => [
      ...p,
      ...selected.map((file) => {
        const preview = URL.createObjectURL(file);
        urls.current.push(preview);
        return { file, preview };
      }),
    ]);
    setDirty(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!picked) {
      setError('حدد موقع المطعم على الخريطة قبل الحفظ.');
      return;
    }
    setSaving(true);
    try {
      const savedPhotos = [...existing];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        let url = uploaded.current.get(photo.file);
        if (!url) {
          setProgress(`جارٍ حفظ الصورة ${i + 1} من ${photos.length}…`);
          const file = await resize(photo.file);
          const form = new FormData();
          form.append('photo', file, 'memory.jpg');
          const res = await fetch('/api/photos', {
            method: 'POST',
            body: form,
          });
          const data = (await res.json()) as { error?: string; url: string };
          if (!res.ok)
            throw new Error(data.error ?? 'تعذّر حفظ الصورة. حاول مجددًا.');
          url = data.url;
          uploaded.current.set(photo.file, url!);
        }
        savedPhotos.push(url!);
      }
      setProgress('جارٍ حفظ الذكرى…');
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name,
          area,
          category,
          date,
          rating,
          notes,
          lat: picked[0],
          lng: picked[1],
          photos: savedPhotos,
        }),
      });
      const data = (await res.json()) as { error?: string; entry: Entry };
      if (!res.ok) throw new Error(data.error ?? 'تعذّر الحفظ. حاول مرة أخرى.');
      onSaved(data.entry);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'تعذّر الاتصال. مدخلاتك ما زالت هنا.',
      );
    } finally {
      setSaving(false);
      setProgress('');
    }
  }
  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent
          className="editor-dialog"
          showCloseButton={false}
          initialFocus={false}
          style={
            {
              '--visual-viewport-height': viewportHeight
                ? `${viewportHeight}px`
                : '94dvh',
            } as CSSProperties
          }
        >
          <div className="modal-heading">
            <div>
              <span className="eyebrow">صفحة في دفتر ذائقتي</span>
              <DialogTitle className="modal-title">
                {entry ? 'تفاصيل الذكرى' : 'ذكرى جديدة'}
              </DialogTitle>
              <DialogDescription className="modal-description">
                احفظ الطعم، والمكان، والشعور.
              </DialogDescription>
            </div>
            <button
              className="icon-button close-button"
              onClick={close}
              disabled={saving}
              aria-label="إغلاق"
            >
              <X size={21} />
            </button>
          </div>
          <form
            onSubmit={save}
            className="entry-form"
            onChange={() => setDirty(true)}
          >
            <fieldset disabled={saving} className="form-fields">
              <div className="form-section-label">
                <span>٠١</span>المكان واللحظة
              </div>
              <label className="field-label" htmlFor="restaurant-name">
                اسم المطعم <span>*</span>
              </label>
              <Input
                id="restaurant-name"
                className="form-input"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أين كانت التجربة؟"
                autoComplete="off"
              />
              <div className="two-fields">
                <div>
                  <label className="field-label" htmlFor="visit-date">
                    تاريخ الزيارة <span>*</span>
                  </label>
                  <Input
                    className="form-input date-input"
                    id="visit-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" id="cuisine-label">
                    نوع المكان
                  </label>
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      setCategory(v ?? 'مطعم');
                      setDirty(true);
                    }}
                  >
                    <SelectTrigger
                      className="form-input cuisine-select"
                      aria-labelledby="cuisine-label"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="cuisine-options">
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="field-label" htmlFor="area">
                المدينة أو الحي <small>اختياري</small>
              </label>
              <Input
                id="area"
                className="form-input"
                value={area}
                maxLength={150}
                onChange={(e) => setArea(e.target.value)}
                placeholder="مثلاً: الرياض، حي العليا"
              />
              <div className="field-label location-label">
                <span>
                  موقع المطعم <span>*</span>
                </span>
                {picked && (
                  <span className="location-selected">
                    <Check size={14} />
                    تم التحديد
                  </span>
                )}
              </div>
              <PlacesMap entries={[]} onPick={pick} picked={picked} />
              <p className="field-hint">
                حرّك الخريطة واضغط على المكان، أو استخدم زر موقعي.
              </p>
              <details className="coordinate-details">
                <summary>أدخل الإحداثيات يدويًا</summary>
                <div className="two-fields" dir="ltr">
                  <label>
                    Latitude
                    <Input
                      className="form-input"
                      type="number"
                      min={-85}
                      max={85}
                      step="any"
                      value={picked?.[0] ?? ''}
                      placeholder="24.7003"
                      onChange={(e) => {
                        if (e.target.value)
                          pick([Number(e.target.value), picked?.[1] ?? 0]);
                      }}
                    />
                  </label>
                  <label>
                    Longitude
                    <Input
                      className="form-input"
                      type="number"
                      min={-180}
                      max={180}
                      step="any"
                      value={picked?.[1] ?? ''}
                      placeholder="46.6802"
                      onChange={(e) => {
                        if (e.target.value)
                          pick([picked?.[0] ?? 0, Number(e.target.value)]);
                      }}
                    />
                  </label>
                </div>
              </details>
              <div className="form-section-label">
                <span>٠٢</span>كيف كانت التجربة؟
              </div>
              <div
                className="rating-picker"
                role="group"
                aria-label="تقييمك من خمس نجوم"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={n <= rating ? 'chosen' : ''}
                    aria-label={`${n} من 5 نجوم`}
                    aria-pressed={rating === n}
                    onClick={() => {
                      setRating(n === rating ? 0 : n);
                      setDirty(true);
                    }}
                  >
                    <Star
                      size={31}
                      fill={n <= rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>
              <p className="rating-description">
                {
                  [
                    'يمكنك ترك التقييم لوقت آخر',
                    'لم تكن على ذائقتي',
                    'أقل من المتوقع',
                    'تجربة جيدة',
                    'أحببتها كثيرًا',
                    'تجربة تستحق العودة',
                  ][rating]
                }
              </p>
              <label className="field-label" htmlFor="notes">
                ما الذي يستحق أن تتذكره؟
              </label>
              <Textarea
                id="notes"
                className="form-input notes-input"
                rows={4}
                maxLength={5000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="الطبق الذي أحببته، الأجواء، أو لحظة صغيرة…"
              />
              <div className="form-section-label">
                <span>٠٣</span>صور من اللحظة{' '}
                <small>{existing.length + photos.length} / 6</small>
              </div>
              <div className="upload-grid">
                {existing.map((url) => (
                  <div className="photo-preview" key={url}>
                    <img src={url} alt="صورة محفوظة للتجربة" />
                    <button
                      type="button"
                      aria-label="إزالة الصورة"
                      onClick={() => {
                        setExisting((v) => v.filter((p) => p !== url));
                        setDirty(true);
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
                {photos.map((p, i) => (
                  <div className="photo-preview" key={p.preview}>
                    <img src={p.preview} alt={`صورة جديدة ${i + 1}`} />
                    <button
                      type="button"
                      aria-label={`إزالة الصورة الجديدة ${i + 1}`}
                      onClick={() => {
                        setPhotos((v) => v.filter((x) => x !== p));
                        setDirty(true);
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
                {photos.length + existing.length < 6 && (
                  <label className="upload-button">
                    <Camera size={24} />
                    <span>أضف صورًا</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      aria-label="إضافة صور الطلب أو المطعم"
                      onChange={(e) => {
                        addPhotos(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="field-hint">
                من ألبومك أو الكاميرا. صورك تظهر في دفترك الخاص فقط.
              </p>
            </fieldset>
            <div className="save-footer">
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="primary-button save-button"
                disabled={saving}
              >
                {saving ? (
                  <LoaderCircle className="spin" size={19} />
                ) : (
                  <Check size={20} />
                )}
                <span>
                  {saving
                    ? progress
                    : entry
                      ? 'حفظ التعديلات'
                      : 'احفظ هذه الذكرى'}
                </span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogTitle>تغادر دون حفظ؟</AlertDialogTitle>
          <AlertDialogDescription>
            ستُفقد التغييرات التي لم تحفظها في هذه التجربة.
          </AlertDialogDescription>
          <div className="confirm-actions">
            <AlertDialogCancel>أكمل الكتابة</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onClose}>
              تجاهل التغييرات
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
async function resize(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      throw new Error(
        'تعذّر قراءة إحدى الصور. صدّرها بصيغة JPG أو اختر صورة أخرى.',
      );
    }
    const scale = Math.min(
      1,
      1600 / Math.max(img.naturalWidth, img.naturalHeight),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذّرت معالجة الصورة.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('تعذّر تجهيز الصورة.'))),
        'image/jpeg',
        0.85,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
