'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Map as MapIcon,
  Plus,
  Utensils,
  LockKeyhole,
  ArrowLeft,
  Star,
  MapPin,
  ArrowUpLeft,
  NotebookPen,
  X,
  Pencil,
  Trash2,
  CalendarDays,
  LoaderCircle,
  RefreshCw,
  Search,
  Images,
  Sparkles,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Toaster, toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { EXAMPLES, dateLabel, type Entry } from '@/lib/entries';
import PlacesMap from './places-map';
import EntryEditor from './entry-editor';
export default function Journal() {
  const [tab, setTab] = useState('map'),
    [saved, setSaved] = useState<Entry[]>([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [showExamples, setShowExamples] = useState(true),
    [selected, setSelected] = useState<Entry | null>(null),
    [editor, setEditor] = useState<{ entry?: Entry } | null>(null),
    [deleteOpen, setDeleteOpen] = useState(false),
    [deleting, setDeleting] = useState(false),
    [lightbox, setLightbox] = useState<string | null>(null),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState<'all' | 'rated' | 'unrated'>('all');
  const isExample =
    saved.length === 0 && showExamples && !loading && !loadError;
  const entries = isExample ? EXAMPLES : saved;
  const filteredEntries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ar');
    return entries.filter((entry) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'rated' && entry.rating > 0) ||
        (filter === 'unrated' && entry.rating === 0);
      const searchable = [entry.name, entry.area, entry.category, entry.notes]
        .join(' ')
        .toLocaleLowerCase('ar');
      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [entries, filter, search]);
  const ratedEntries = entries.filter((entry) => entry.rating > 0);
  const averageRating = ratedEntries.length
    ? ratedEntries.reduce((total, entry) => total + entry.rating, 0) /
      ratedEntries.length
    : 0;
  const photoCount = entries.reduce(
    (total, entry) => total + entry.photos.length,
    0,
  );
  async function refresh() {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/entries');
      const data = (await res.json()) as { error?: string; entries: Entry[] };
      if (!res.ok) throw new Error(data.error ?? 'تعذّر فتح دفترك.');
      setSaved(data.entries);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'تعذّر الاتصال.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  function switchTab(v: string) {
    setTab(v);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function save(e: Entry) {
    setSaved((v) =>
      [e, ...v.filter((x) => x.id !== e.id)].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    );
    setShowExamples(false);
    setEditor(null);
    setSelected(null);
    toast.add({
      title: 'انضمّت الذكرى إلى دفترك',
      description: 'تم حفظ التفاصيل والصور.',
      type: 'success',
    });
  }
  async function remove() {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/entries/' + selected.id, {
        method: 'DELETE',
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setSaved((v) => v.filter((e) => e.id !== selected.id));
      setShowExamples(false);
      setSelected(null);
      setDeleteOpen(false);
      toast.add({ title: 'تم حذف التجربة', type: 'success' });
    } catch (e) {
      toast.add({
        title: e instanceof Error ? e.message : 'تعذّر الحذف. حاول مجددًا.',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  }
  return (
    <Toaster>
      <div className="app-shell">
        <header className="app-header">
          <a href="/" className="brand" aria-label="ذائقتي، الصفحة الرئيسية">
            <span className="brand-mark">
              <Utensils size={23} />
            </span>
            <span>
              ذائقتي<span className="brand-sub">دفتر المطاعم</span>
            </span>
          </a>
          <span className="private-tag">
            <LockKeyhole size={14} />
            مساحة تخصّك
          </span>
        </header>
        <Tabs
          value={tab}
          onValueChange={(v) => switchTab(String(v))}
          className="app-tabs"
        >
          <main className="main-content">
            <section className="page-heading">
              <div>
                <span className="eyebrow">ذكرياتك، مرتبة على الخريطة</span>
                <h1>{tab === 'map' ? 'أماكن تستحق التذكّر.' : 'كل تجاربي.'}</h1>
                <p>
                  {tab === 'map'
                    ? 'خريطتك الخاصة للأطباق واللحظات الجميلة.'
                    : 'ابحث عن أي مطعم، ذكرى، أو طبق كتبته.'}
                </p>
              </div>
              <button
                className="primary-button desktop-add"
                onClick={() => setEditor({})}
              >
                <Plus size={20} />
                تجربة جديدة
              </button>
            </section>
            {loadError && (
              <div className="load-error" role="alert">
                <p>{loadError}</p>
                <button onClick={refresh}>
                  <RefreshCw size={16} />
                  إعادة المحاولة
                </button>
              </div>
            )}
            <TabsContent value="map">
              <div className="overview-strip" aria-label="ملخص الدفتر">
                <div>
                  <span className="overview-icon">
                    <MapPin size={18} />
                  </span>
                  <p>
                    <strong>{entries.length}</strong>
                    <span>أماكن محفوظة</span>
                  </p>
                </div>
                <div>
                  <span className="overview-icon gold">
                    <Star size={18} fill="currentColor" />
                  </span>
                  <p>
                    <strong>
                      {averageRating ? averageRating.toFixed(1) : '—'}
                    </strong>
                    <span>متوسط تقييمك</span>
                  </p>
                </div>
                <div>
                  <span className="overview-icon olive">
                    <Images size={18} />
                  </span>
                  <p>
                    <strong>{photoCount}</strong>
                    <span>صور وذكريات</span>
                  </p>
                </div>
              </div>
              <div className="journal-layout">
                <section className="map-section">
                  <div className="section-title">
                    <h2>
                      <MapPin size={19} />
                      خريطة ذكرياتي
                    </h2>
                    <span className="mini-label">
                      {isExample ? 'معاينة الدفتر' : `${saved.length} تجربة`}
                    </span>
                  </div>
                  <PlacesMap entries={entries} onSelect={setSelected} />
                  <div className="map-caption">
                    <span>
                      <i className="legend-dot" />
                      قيّمتها
                    </span>
                    <span>
                      <i className="legend-dot unrated" />
                      بانتظار تقييمي
                    </span>
                    <span className="caption-end">كل علامة، ذكرى</span>
                  </div>
                </section>
                <section className="recent-section">
                  <div className="section-title">
                    <h2>من صفحات الدفتر</h2>
                    <button
                      className="text-button"
                      onClick={() => switchTab('journal')}
                    >
                      عرض الكل
                      <ArrowLeft size={16} />
                    </button>
                  </div>
                  {loading ? (
                    <div
                      className="loading-memories"
                      aria-label="جارٍ تحميل تجاربك"
                    >
                      <Skeleton className="loading-image" />
                      <Skeleton className="loading-line" />
                      <Skeleton className="loading-line short" />
                    </div>
                  ) : (
                    <div className="memory-grid">
                      {entries.slice(0, 3).map((e) => (
                        <MemoryCard
                          key={e.id}
                          entry={e}
                          onClick={() => setSelected(e)}
                        />
                      ))}
                    </div>
                  )}
                  {!loading && !entries.length && !loadError && (
                    <EmptyState onAdd={() => setEditor({})} />
                  )}{' '}
                  {isExample && (
                    <div className="example-note">
                      <NotebookPen size={20} />
                      <p>
                        أماكن تخيّلية لتوضيح شكل الدفتر.
                        <br />
                        <strong>ابدأ بأول ذكرى تخصّك.</strong>
                      </p>
                      <button
                        className="icon-button"
                        aria-label="أضف أول تجربة"
                        onClick={() => setEditor({})}
                      >
                        <Plus />
                      </button>
                    </div>
                  )}
                  {!isExample && saved.length > 0 && (
                    <div className="journal-summary">
                      <span>
                        <strong>{saved.length}</strong> ذكريات محفوظة
                      </span>
                      <span>
                        <Star size={14} />
                        {saved.filter((e) => e.rating > 0).length} تجارب قيّمتها
                      </span>
                    </div>
                  )}
                </section>
              </div>
            </TabsContent>
            <TabsContent value="journal">
              {isExample && (
                <div className="journal-example-banner">
                  <span>معاينة بأماكن تخيّلية. تجاربك الحقيقية تبدأ بزر +</span>
                  <button onClick={() => setShowExamples(false)}>
                    إخفاء الأمثلة
                  </button>
                </div>
              )}
              <div className="journal-toolbar">
                <label className="search-control">
                  <Search size={19} aria-hidden="true" />
                  <span className="sr-only">ابحث في تجاربك</span>
                  <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ابحث باسم المطعم أو الحي…"
                    enterKeyHint="search"
                  />
                </label>
                <div className="filter-chips" aria-label="تصفية التجارب">
                  {(
                    [
                      ['all', 'الكل'],
                      ['rated', 'قيّمتها'],
                      ['unrated', 'بانتظار التقييم'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      className={filter === value ? 'active' : ''}
                      aria-pressed={filter === value}
                      onClick={() => setFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="loading-memories">
                  <Skeleton className="loading-image" />
                </div>
              ) : (
                <div className="all-memories memory-grid">
                  {filteredEntries.map((e) => (
                    <MemoryCard
                      key={e.id}
                      entry={e}
                      onClick={() => setSelected(e)}
                    />
                  ))}
                </div>
              )}
              {!loading && !entries.length && !loadError && (
                <EmptyState onAdd={() => setEditor({})} />
              )}
              {!loading &&
                entries.length > 0 &&
                filteredEntries.length === 0 && (
                  <div className="search-empty">
                    <Sparkles size={28} />
                    <h2>لم أجد ذكرى مطابقة</h2>
                    <p>جرّب كلمة أخرى أو اعرض كل التجارب.</p>
                    <button
                      onClick={() => {
                        setSearch('');
                        setFilter('all');
                      }}
                    >
                      مسح البحث
                    </button>
                  </div>
                )}
            </TabsContent>
            <footer className="desktop-footer">
              <span>ذائقتي — أماكن، أطباق، وذكريات.</span>
              <span>
                <LockKeyhole size={12} />
                دفترك الخاص، لك وحدك
              </span>
            </footer>
          </main>
          <nav className="bottom-navigation" aria-label="التنقل الرئيسي">
            <TabsList className="nav-tabs">
              <TabsTrigger value="map">
                <MapIcon />
                <span>خريطتي</span>
              </TabsTrigger>
              <div className="add-nav">
                <button
                  aria-label="أضف تجربة جديدة"
                  onClick={() => setEditor({})}
                >
                  <Plus size={27} />
                </button>
                <span>تجربة جديدة</span>
              </div>
              <TabsTrigger value="journal">
                <BookOpen />
                <span>دفتري</span>
              </TabsTrigger>
            </TabsList>
          </nav>
        </Tabs>
        <Sheet
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <SheetContent
            side="bottom"
            className="detail-sheet"
            showCloseButton={false}
          >
            <div className="sheet-handle" />
            {selected && (
              <>
                <div className="detail-top">
                  <span className="eyebrow">
                    {selected.demo
                      ? 'مثال تخيّلي · ليس من زياراتك'
                      : 'من دفتر تجاربي'}
                  </span>
                  <button
                    className="icon-button close-button"
                    onClick={() => setSelected(null)}
                    aria-label="إغلاق تفاصيل التجربة"
                  >
                    <X size={20} />
                  </button>
                </div>
                {selected.photos.length > 0 && (
                  <div className="detail-photos">
                    {selected.photos.map((url, i) => (
                      <button
                        key={url}
                        onClick={() => setLightbox(url)}
                        aria-label={`تكبير الصورة ${i + 1}`}
                      >
                        <img src={url} alt={`صورة من تجربة ${selected.name}`} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="detail-body">
                  <div className="detail-title-row">
                    <SheetTitle className="detail-title">
                      {selected.name}
                    </SheetTitle>
                    <span className="detail-category">{selected.category}</span>
                  </div>
                  <SheetDescription className="detail-meta">
                    <span>
                      <MapPin size={14} />
                      {selected.area || 'مكان محفوظ على الخريطة'}
                    </span>
                    <span>
                      <CalendarDays size={14} />
                      {dateLabel(selected.date)}
                    </span>
                  </SheetDescription>
                  <div
                    className="detail-stars"
                    aria-label={
                      selected.rating
                        ? `${selected.rating} من 5 نجوم`
                        : 'لم تقيّم هذه التجربة بعد'
                    }
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={21}
                        fill={n <= selected.rating ? 'currentColor' : 'none'}
                        className={n <= selected.rating ? 'filled' : ''}
                      />
                    ))}
                    <span>
                      {selected.rating ? 'تقييمي الخاص' : 'بانتظار تقييمي'}
                    </span>
                  </div>
                  <div className="memory-quote">
                    <span className="quote-mark">“</span>
                    <p>{selected.notes || 'لم أكتب تفاصيل هذه الذكرى بعد.'}</p>
                  </div>
                  {selected.demo ? (
                    <button
                      className="primary-button detail-add"
                      onClick={() => {
                        setSelected(null);
                        setEditor({});
                      }}
                    >
                      <Plus size={19} />
                      اكتب تجربتك الأولى
                    </button>
                  ) : (
                    <div className="detail-actions">
                      <button
                        className="primary-button"
                        onClick={() => {
                          const e = selected;
                          setSelected(null);
                          setEditor({ entry: e });
                        }}
                      >
                        <Pencil size={17} />
                        تعديل الذكرى
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 size={17} />
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
        {editor && (
          <EntryEditor
            entry={editor.entry}
            onClose={() => setEditor(null)}
            onSaved={save}
          />
        )}
        <AlertDialog
          open={deleteOpen}
          onOpenChange={(v) => {
            if (!deleting) setDeleteOpen(v);
          }}
        >
          <AlertDialogContent className="confirm-dialog">
            <AlertDialogTitle>حذف هذه الذكرى؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف «{selected?.name}» وصورها من دفترك. لا يمكن التراجع عن
              الحذف.
            </AlertDialogDescription>
            <div className="confirm-actions">
              <AlertDialogCancel disabled={deleting}>
                احتفظ بها
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={remove}
                disabled={deleting}
              >
                {deleting ? 'جارٍ الحذف…' : 'حذف الذكرى'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
        <Dialog
          open={!!lightbox}
          onOpenChange={(open) => {
            if (!open) setLightbox(null);
          }}
        >
          <DialogContent className="lightbox" showCloseButton={false}>
            <DialogTitle className="sr-only">صورة الذكرى</DialogTitle>
            <button
              className="lightbox-close icon-button"
              aria-label="إغلاق الصورة"
              onClick={() => setLightbox(null)}
            >
              <X />
            </button>
            {lightbox && <img src={lightbox} alt="الصورة بالحجم الكامل" />}
          </DialogContent>
        </Dialog>
      </div>
    </Toaster>
  );
}
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty-journal">
      <span className="empty-icon">
        <NotebookPen size={35} />
      </span>
      <h2>أول صفحة، تنتظر حكايتك.</h2>
      <p>ابدأ بمطعم زرته، واحتفظ بما أحببته فيه.</p>
      <button className="primary-button" onClick={onAdd}>
        <Plus size={18} />
        أضف أول تجربة
      </button>
    </div>
  );
}
function MemoryCard({
  entry: e,
  onClick,
}: {
  entry: Entry;
  onClick: () => void;
}) {
  return (
    <button
      className={'memory-card ' + (!e.photos.length ? 'text-memory' : '')}
      onClick={onClick}
    >
      <div className="memory-image">
        {e.photos[0] ? (
          <img
            src={e.photos[0]}
            alt={`صورة من تجربة ${e.name}`}
            loading="lazy"
          />
        ) : (
          <div className="no-photo">
            <Utensils size={35} />
            <span>تفاصيل تستحق أن تُحفظ</span>
          </div>
        )}
        <span className="category-chip">{e.category}</span>
        {e.demo && <span className="sample-chip">مثال</span>}
      </div>
      <div className="memory-body">
        <div className="card-title">
          <h3>{e.name}</h3>
          {e.rating > 0 ? (
            <span className="rating-number">
              <Star size={14} fill="currentColor" />
              {e.rating.toFixed(1)}
            </span>
          ) : (
            <span className="pending-label">لم أقيّمها بعد</span>
          )}
        </div>
        <span className="card-area">
          <MapPin size={13} />
          {e.area || 'مكان على خريطتي'}
        </span>
        <p>{e.notes || 'ذكرى جديدة، وتفاصيل تنتظر الكتابة.'}</p>
        <div className="card-footer">
          <span>{dateLabel(e.date)}</span>
          <ArrowUpLeft size={18} />
        </div>
      </div>
    </button>
  );
}
