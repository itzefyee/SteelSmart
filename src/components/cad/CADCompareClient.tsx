'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CADPreview3D = dynamic(() => import('@/components/cad/CADPreview3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[240px] items-center justify-center">
      <LoadingSpinner />
    </div>
  ),
});

type ColumnKey = 'zoo' | 'img2threejs' | 'textToCad';
type ActiveColumn = ColumnKey | null;

type ColumnMeta = {
  source?: string;
  note?: string;
  units?: string;
  gen_s?: number | null;
  cost?: string | null;
  downloadableStep?: boolean;
  closedSolid?: string;
  silhouette?: number | null;
};

type ZooColumn = {
  status: string;
  format: string;
  step: string | null;
  stl: string | null;
  meta: ColumnMeta;
};

type TextToCadColumn = {
  status: string;
  format: string;
  step: string | null;
  stl: string | null;
  snapshot: string | null;
  meta: ColumnMeta;
};

type Img2Column = {
  status: string;
  format: string;
  comparisonPng: string | null;
  glb: string | null;
  ts: string | null;
  spec: string | null;
  meta: ColumnMeta;
};

type FixtureSlot = {
  id: string;
  title: string;
  kind: string;
  promptPath: string;
  imagePath?: string | null;
  zoo: ZooColumn;
  textToCad: TextToCadColumn;
  img2threejs: Img2Column;
};

type Manifest = {
  version: number;
  defaultSlotId: string;
  labels: { zoo: string; img2threejs: string; textToCad: string };
  licenses: Record<string, { spdx?: string; name?: string; url: string }>;
  slots: FixtureSlot[];
};

type RuntimeMetrics = {
  status: string;
  format: string;
  fileSizeKiB: string;
  viewerLoadMs: string;
  vertices: string;
  faces: string;
  bbox: string;
  volume: string;
  surfaceArea: string;
  holes: string;
  gen_s: string;
  cost: string;
  downloadableStep: string;
  editability: string;
  note: string;
};

const NA = 'N/A';

function ExperimentalBanner() {
  return (
    <div
      role="status"
      className="mb-6 rounded-lg border border-amber-400/60 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="font-semibold tracking-wide">Experimental — CAD Compare</p>
      <p className="mt-1 opacity-90">
        Fixture-only demo. Cold load idle until a slot is clicked. Lazy 3D: only one WebGL viewer mounts (active column). Demo
        assets are existing repo STL/images — not Meshcraft STEP packs. Engineering CAD ≠ procedural
        Three.js.
      </p>
    </div>
  );
}

function ColumnShell({
  title,
  subtitle,
  badge,
  active,
  onActivate,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  active: boolean;
  onActivate: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex min-h-[480px] flex-col overflow-hidden rounded-xl border shadow-sm ${
        active
          ? 'border-sky-400 ring-2 ring-sky-300/50 dark:border-sky-500'
          : 'border-slate-200 dark:border-slate-700'
      } bg-white/90 dark:bg-slate-900/80`}
    >
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onActivate}
            className="text-left text-base font-semibold text-slate-900 hover:underline dark:text-slate-50"
          >
            {title}
          </button>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {badge}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        {!active ? (
          <button
            type="button"
            onClick={onActivate}
            className="mt-2 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Activate column (loads 3D if available)
          </button>
        ) : (
          <p className="mt-2 text-[11px] font-medium text-sky-700 dark:text-sky-300">Active — 3D mounted here only</p>
        )}
      </header>
      <div className="relative flex flex-1 flex-col gap-3 p-3">{children}</div>
    </section>
  );
}

function PlaceholderPane({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center dark:border-slate-600 dark:bg-slate-800/50">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <p className="mt-2 max-w-xs text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function MetricsCard({ metrics }: { metrics: RuntimeMetrics }) {
  const rows: Array<[string, string]> = [
    ['Status', metrics.status],
    ['Format', metrics.format],
    ['File size', metrics.fileSizeKiB],
    ['Viewer load', metrics.viewerLoadMs],
    ['Vertices', metrics.vertices],
    ['Faces', metrics.faces],
    ['BBox', metrics.bbox],
    ['Volume', metrics.volume],
    ['Surface', metrics.surfaceArea],
    ['Holes', metrics.holes],
    ['Gen time', metrics.gen_s],
    ['Cost', metrics.cost],
    ['STEP download?', metrics.downloadableStep],
    ['Editability', metrics.editability],
  ];
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Metrics</p>
      <dl className="grid grid-cols-1 gap-1 text-[11px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-slate-200/70 py-0.5 last:border-0 dark:border-slate-700/70">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-right font-medium text-slate-800 dark:text-slate-100">{v}</dd>
          </div>
        ))}
      </dl>
      {metrics.note ? <p className="mt-2 text-[10px] text-slate-500">{metrics.note}</p> : null}
    </div>
  );
}

function fileNameFromUrl(url: string) {
  return url.split('/').pop() || 'fixture.bin';
}

async function fetchAsFile(url: string): Promise<{ file: File; bytes: number }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const blob = await res.blob();
  const name = fileNameFromUrl(url);
  const lower = name.toLowerCase();
  const type = lower.endsWith('.stl')
    ? 'model/stl'
    : lower.endsWith('.step') || lower.endsWith('.stp')
      ? 'application/step'
      : lower.endsWith('.glb')
        ? 'model/gltf-binary'
        : blob.type || 'application/octet-stream';
  return { file: new File([blob], name, { type }), bytes: blob.size };
}

/** Single WebGL mount — parent must render at most one of these. */
function LazyCadViewer({
  mountKey,
  urls,
  onMetrics,
}: {
  mountKey: string;
  urls: string[];
  onMetrics: (partial: Partial<RuntimeMetrics>) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [t0, setT0] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFile(null);
    setError('');
    setLoading(true);
    async function run() {
      if (!urls.length) {
        setLoading(false);
        onMetrics({ fileSizeKiB: NA, viewerLoadMs: NA });
        return;
      }
      const start = performance.now();
      setT0(start);
      let lastErr = '';
      for (const url of urls) {
        try {
          const { file: next, bytes } = await fetchAsFile(url);
          if (cancelled) return;
          setFile(next);
          setLoading(false);
          onMetrics({
            fileSizeKiB: `${(bytes / 1024).toFixed(1)} KiB`,
            format: fileNameFromUrl(url).split('.').pop() || NA,
          });
          return;
        } catch (e) {
          lastErr = e instanceof Error ? e.message : 'load failed';
        }
      }
      if (cancelled) return;
      setError(lastErr);
      setLoading(false);
      onMetrics({ fileSizeKiB: NA, viewerLoadMs: NA });
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountKey, urls.join('|')]);

  const markPreview = useCallback(
    (ok: boolean) => {
      if (t0 == null) return;
      const ms = Math.round(performance.now() - t0);
      onMetrics({ viewerLoadMs: ok ? `${ms} ms` : `fail @ ${ms} ms` });
    },
    [onMetrics, t0],
  );

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (!file) {
    return <PlaceholderPane label="3D unavailable" detail={error || 'No mesh URL for this column.'} />;
  }
  return (
    <div className="min-h-[240px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <CADPreview3D
        key={mountKey}
        file={file}
        className="h-[280px] w-full"
        showStats={false}
        onParsingComplete={markPreview}
        onPreviewLoaded={markPreview}
      />
    </div>
  );
}

function baseMetrics(status: string, format: string, meta: ColumnMeta, editability: string): RuntimeMetrics {
  return {
    status,
    format,
    fileSizeKiB: NA,
    viewerLoadMs: NA,
    vertices: NA,
    faces: NA,
    bbox: NA,
    volume: NA,
    surfaceArea: NA,
    holes: NA,
    gen_s: meta.gen_s != null ? `${meta.gen_s} s` : NA,
    cost: meta.cost || NA,
    downloadableStep: meta.downloadableStep ? 'true' : 'false',
    editability,
    note: meta.note || '',
  };
}

function meshUrlsFor(slot: FixtureSlot, col: ActiveColumn): string[] {
  if (!col) return [];
  if (col === 'zoo') return [slot.zoo.step, slot.zoo.stl].filter(Boolean) as string[];
  if (col === 'textToCad') return [slot.textToCad.step, slot.textToCad.stl].filter(Boolean) as string[];
  if (col === 'img2threejs') return slot.img2threejs.glb ? [slot.img2threejs.glb] : [];
  return [];
}

export default function CADCompareClient() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestError, setManifestError] = useState('');
  const [slotId, setSlotId] = useState('');
  const [activeColumn, setActiveColumn] = useState<ActiveColumn>(null);
  const [promptText, setPromptText] = useState('');
  const [metrics, setMetrics] = useState<RuntimeMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/lab-fixtures/manifest.json');
        if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
        const data = (await res.json()) as Manifest;
        if (cancelled) return;
        setManifest(data);
        // Hard gate: cold load idle — no slot until user clicks.
      } catch (e) {
        if (!cancelled) setManifestError(e instanceof Error ? e.message : 'manifest failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slot = useMemo(() => manifest?.slots.find((s) => s.id === slotId) || null, [manifest, slotId]);

  useEffect(() => {
    // Slot change: unmount viewers; require column Activate click.
    setActiveColumn(null);
    setMetrics(null);
  }, [slotId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slot?.promptPath) {
        setPromptText('');
        return;
      }
      try {
        const res = await fetch(slot.promptPath);
        const text = res.ok ? await res.text() : '';
        if (!cancelled) setPromptText(text.trim());
      } catch {
        if (!cancelled) setPromptText('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slot]);

  useEffect(() => {
    if (!slot || !activeColumn) {
      setMetrics(null);
      return;
    }
    if (activeColumn === 'zoo') {
      setMetrics(baseMetrics(slot.zoo.status, slot.zoo.format, slot.zoo.meta, 're-prompt only (Zoo)'));
    } else if (activeColumn === 'img2threejs') {
      setMetrics(baseMetrics(slot.img2threejs.status, slot.img2threejs.format, slot.img2threejs.meta, 'edit TS factory'));
    } else {
      setMetrics(
        baseMetrics(slot.textToCad.status, slot.textToCad.format, slot.textToCad.meta, 'edit Python @step script'),
      );
    }
  }, [slot, activeColumn]);

  if (manifestError) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto max-w-3xl flex-1 p-8">
          <PlaceholderPane label="Manifest failed" detail={manifestError} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (!slot) {
    const licenses = manifest.licenses;
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="home-wavy-bg relative flex-1 overflow-hidden">
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ExperimentalBanner />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">CAD Compare</h1>
            <p className="mt-2 mb-6 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Cold load is idle — click a fixture slot to load anything (no 3D / no model fetch until then).
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {manifest.slots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlotId(s.id)}
                  className="rounded-xl border border-slate-200 bg-white/90 p-4 text-left shadow-sm hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900/80"
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{s.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.id}</p>
                </button>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-500">
              SteelSmart under{" "}
              <a className="underline" href={licenses.steelsmart.url} target="_blank" rel="noreferrer">
                {licenses.steelsmart.spdx}
              </a>
              .
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const licenses = manifest.licenses;
  const activeUrls = meshUrlsFor(slot, activeColumn);
  const mountKey = `${slotId}:${activeColumn}`;

  const renderColumnBody = (col: ColumnKey) => {
    const isActive = activeColumn === col;
    if (col === 'img2threejs') {
      const png = slot.img2threejs.comparisonPng;
      return (
        <>
          {png ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={png}
              alt="visual comparison"
              className="max-h-[220px] w-full rounded-lg border border-slate-200 object-contain dark:border-slate-700"
            />
          ) : (
            <PlaceholderPane label="No comparison image" detail="Missing product/demo PNG." />
          )}
          <p className="text-[11px] text-slate-500">
            Procedural / visual only — not STEP. {slot.img2threejs.meta.note}
          </p>
          {isActive && activeUrls.length ? (
            <LazyCadViewer
              mountKey={mountKey}
              urls={activeUrls}
              onMetrics={(partial) => setMetrics((prev) => (prev ? { ...prev, ...partial } : prev))}
            />
          ) : isActive ? (
            <PlaceholderPane label="No GLB for this demo" detail="Image-only stand-in; activate Zoo/text-to-cad for 3D STL." />
          ) : (
            <PlaceholderPane label="3D idle" detail="Activate this column to mount WebGL (if GLB exists)." />
          )}
        </>
      );
    }

    const metaNote = col === 'zoo' ? slot.zoo.meta.note : slot.textToCad.meta.note;
    if (!isActive) {
      return (
        <PlaceholderPane
          label="3D not mounted"
          detail={`Click Activate to load the single WebGL viewer here. ${metaNote || ''}`}
        />
      );
    }
    return (
      <>
        <LazyCadViewer
          mountKey={mountKey}
          urls={activeUrls}
          onMetrics={(partial) => setMetrics((prev) => (prev ? { ...prev, ...partial } : prev))}
        />
        <p className="text-[11px] text-slate-500">{metaNote}</p>
      </>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="home-wavy-bg relative flex-1 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ExperimentalBanner />

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">CAD Compare</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                One fixture slot + one active column WebGL mount. Demo assets from existing repo STL/images.
              </p>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Fixture slot
              </span>
              <select
                className="min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
              >
                {manifest.slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.id})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-4 rounded-lg border border-slate-200 bg-white/80 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prompt / input</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-800 dark:text-slate-100">{promptText || '—'}</p>
            {slot.imagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slot.imagePath}
                alt="slot input"
                className="mt-3 max-h-40 rounded border border-slate-200 object-contain dark:border-slate-700"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ColumnShell
              title="Current (Zoo)"
              subtitle={manifest.labels.zoo}
              badge={slot.zoo.status}
              active={activeColumn === 'zoo'}
              onActivate={() => setActiveColumn('zoo')}
            >
              {renderColumnBody('zoo')}
              {activeColumn === 'zoo' && metrics ? <MetricsCard metrics={metrics} /> : null}
            </ColumnShell>

            <ColumnShell
              title="img2threejs"
              subtitle={manifest.labels.img2threejs}
              badge={slot.img2threejs.status}
              active={activeColumn === 'img2threejs'}
              onActivate={() => setActiveColumn('img2threejs')}
            >
              {renderColumnBody('img2threejs')}
              {activeColumn === 'img2threejs' && metrics ? <MetricsCard metrics={metrics} /> : null}
            </ColumnShell>

            <ColumnShell
              title="text-to-cad"
              subtitle={manifest.labels.textToCad}
              badge={slot.textToCad.status}
              active={activeColumn === 'textToCad'}
              onActivate={() => setActiveColumn('textToCad')}
            >
              {renderColumnBody('textToCad')}
              {activeColumn === 'textToCad' && metrics ? <MetricsCard metrics={metrics} /> : null}
            </ColumnShell>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Compare fixtures are precomputed / demo-only. SteelSmart under{' '}
            <a className="underline" href={licenses.steelsmart.url} target="_blank" rel="noreferrer">
              {licenses.steelsmart.spdx}
            </a>
            . Zoo (
            <a className="underline" href={licenses.zoo.url} target="_blank" rel="noreferrer">
              Terms
            </a>
            ), img2threejs (
            <a className="underline" href={licenses.img2threejs.url} target="_blank" rel="noreferrer">
              {licenses.img2threejs.spdx}
            </a>
            ), text-to-cad (
            <a className="underline" href={licenses.textToCad.url} target="_blank" rel="noreferrer">
              {licenses.textToCad.spdx}
            </a>
            ). Engineering CAD ≠ procedural Three.js.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
