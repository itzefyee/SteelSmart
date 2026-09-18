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

type ColumnStatus = 'stub' | 'missing' | 'na' | 'success' | 'fail';

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
  status: ColumnStatus;
  format: string;
  step: string | null;
  stl: string | null;
  meta: ColumnMeta;
};

type TextToCadColumn = {
  status: ColumnStatus;
  format: string;
  step: string | null;
  stl: string | null;
  snapshot: string | null;
  meta: ColumnMeta;
};

type Img2Column = {
  status: ColumnStatus;
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
  imageCaptionPath?: string | null;
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

type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

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
        Fixture-only. No live Zoo / img2threejs / text-to-cad API calls. Engineering CAD ≠ procedural
        Three.js. Missing Meshcraft binaries show honest empty / N/A states.
      </p>
    </div>
  );
}

function ColumnShell({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {badge}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </header>
      <div className="relative flex flex-1 flex-col gap-3 p-3">{children}</div>
    </section>
  );
}

function PlaceholderPane({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center dark:border-slate-600 dark:bg-slate-800/50">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <p className="mt-2 max-w-xs text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function MetricsCard({ metrics }: { metrics: RuntimeMetrics }) {
  const rows: Array<[string, string, string?]> = [
    ['Status', metrics.status],
    ['Format', metrics.format],
    ['File size', metrics.fileSizeKiB],
    ['Viewer load', metrics.viewerLoadMs, 'Fetch + parse/preview callback when available'],
    ['Vertices', metrics.vertices],
    ['Faces', metrics.faces],
    ['BBox (mm)', metrics.bbox],
    ['Volume', metrics.volume, 'STEP analysis only'],
    ['Surface area', metrics.surfaceArea, 'STEP analysis only'],
    ['Holes', metrics.holes, 'STEP manufacturing analysis only'],
    ['Gen time (offline)', metrics.gen_s],
    ['Cost', metrics.cost, 'Never invented — UNKNOWN/N/A from meta'],
    ['Downloadable STEP?', metrics.downloadableStep],
    ['Editability', metrics.editability],
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Metrics</p>
      <dl className="grid grid-cols-1 gap-1 text-[11px]">
        {rows.map(([k, v, tip]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-slate-200/70 py-0.5 last:border-0 dark:border-slate-700/70">
            <dt className="text-slate-500" title={tip}>
              {k}
            </dt>
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
  const type =
    lower.endsWith('.stl')
      ? 'model/stl'
      : lower.endsWith('.step') || lower.endsWith('.stp')
        ? 'application/step'
        : lower.endsWith('.glb')
          ? 'model/gltf-binary'
          : blob.type || 'application/octet-stream';
  return { file: new File([blob], name, { type }), bytes: blob.size };
}

function CadColumnViewer({
  urls,
  onMetrics,
}: {
  urls: string[];
  onMetrics: (partial: Partial<RuntimeMetrics> & { loadState?: LoadState; error?: string }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState('');
  const [t0, setT0] = useState<number | null>(null);
  const urlKey = urls.join('|');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!urls.length) {
        setFile(null);
        setState('empty');
        onMetrics({ loadState: 'empty', fileSizeKiB: NA, viewerLoadMs: NA });
        return;
      }
      setState('loading');
      setError('');
      const start = performance.now();
      setT0(start);
      onMetrics({ loadState: 'loading', viewerLoadMs: '…' });
      let lastErr = '';
      for (const url of urls) {
        try {
          const { file: next, bytes } = await fetchAsFile(url);
          if (cancelled) return;
          setFile(next);
          setState('ready');
          onMetrics({
            loadState: 'ready',
            fileSizeKiB: `${(bytes / 1024).toFixed(1)} KiB`,
            format: fileNameFromUrl(url).split('.').pop() || NA,
          });
          return;
        } catch (e) {
          lastErr = e instanceof Error ? e.message : 'load failed';
        }
      }
      if (cancelled) return;
      setFile(null);
      setState('empty');
      setError(lastErr);
      onMetrics({ loadState: 'empty', fileSizeKiB: NA, viewerLoadMs: NA, error: lastErr });
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  const markPreview = useCallback(
    (ok: boolean) => {
      if (t0 == null) return;
      const ms = Math.round(performance.now() - t0);
      onMetrics({ viewerLoadMs: ok ? `${ms} ms` : `fail @ ${ms} ms` });
    },
    [onMetrics, t0],
  );

  if (state === 'loading' || state === 'idle') {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (state !== 'ready' || !file) {
    return (
      <PlaceholderPane
        label="Fixture unavailable"
        detail={error || 'No prebaked STEP/STL/GLB for this column yet.'}
      />
    );
  }
  return (
    <div className="min-h-[240px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <CADPreview3D
        file={file}
        className="h-[280px] w-full"
        showStats={false}
        onParsingComplete={markPreview}
        onPreviewLoaded={markPreview}
      />
    </div>
  );
}

function baseMetrics(
  status: string,
  format: string,
  meta: ColumnMeta,
  editability: string,
): RuntimeMetrics {
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

export default function CADCompareClient() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestError, setManifestError] = useState('');
  const [slotId, setSlotId] = useState<string>('');
  const [promptText, setPromptText] = useState('');
  const [zooMetrics, setZooMetrics] = useState<RuntimeMetrics | null>(null);
  const [imgMetrics, setImgMetrics] = useState<RuntimeMetrics | null>(null);
  const [ttcMetrics, setTtcMetrics] = useState<RuntimeMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/lab-fixtures/manifest.json');
        if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
        const data = (await res.json()) as Manifest;
        if (cancelled) return;
        setManifest(data);
        setSlotId(data.defaultSlotId || data.slots[0]?.id || '');
      } catch (e) {
        if (cancelled) return;
        setManifestError(e instanceof Error ? e.message : 'Failed to load manifest');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const slot = useMemo(
    () => manifest?.slots.find((s) => s.id === slotId) || null,
    [manifest, slotId],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadPrompt() {
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
    }
    loadPrompt();
    return () => {
      cancelled = true;
    };
  }, [slot]);

  useEffect(() => {
    if (!slot) return;
    setZooMetrics(baseMetrics(slot.zoo.status, slot.zoo.format, slot.zoo.meta, 're-prompt only (Zoo)'));
    setImgMetrics(
      baseMetrics(slot.img2threejs.status, slot.img2threejs.format, slot.img2threejs.meta, 'edit TS factory'),
    );
    setTtcMetrics(
      baseMetrics(
        slot.textToCad.status,
        slot.textToCad.format,
        slot.textToCad.meta,
        'edit Python @step script',
      ),
    );
  }, [slot]);

  const zooUrls = useMemo(() => {
    if (!slot) return [] as string[];
    return [slot.zoo.step, slot.zoo.stl].filter(Boolean) as string[];
  }, [slot]);

  const ttcUrls = useMemo(() => {
    if (!slot) return [] as string[];
    return [slot.textToCad.step, slot.textToCad.stl].filter(Boolean) as string[];
  }, [slot]);

  const imgGlbUrls = useMemo(() => {
    if (!slot?.img2threejs.glb) return [] as string[];
    return [slot.img2threejs.glb];
  }, [slot]);

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

  if (!manifest || !slot) {
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

  const licenses = manifest.licenses;

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
                Precomputed fixtures comparing SteelSmart Current (Zoo), img2threejs, and text-to-cad.
                Labels: Engineering CAD vs Procedural Three.js.
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
            {slot.kind === 'photo' ? (
              <p className="mt-2 text-xs text-slate-500">
                Photo slot: img2threejs uses the image; Zoo + text-to-cad use the shared text prompt. Image
                asset pending Meshcraft.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ColumnShell title="Current (Zoo)" subtitle={manifest.labels.zoo} badge={slot.zoo.status}>
              {zooUrls.length ? (
                <CadColumnViewer
                  urls={zooUrls}
                  onMetrics={(partial) =>
                    setZooMetrics((prev) => ({
                      ...(prev ||
                        baseMetrics(slot.zoo.status, slot.zoo.format, slot.zoo.meta, 're-prompt only (Zoo)')),
                      ...partial,
                      status: slot.zoo.status,
                      note: slot.zoo.meta.note || '',
                      downloadableStep: slot.zoo.meta.downloadableStep ? 'true' : 'false',
                      gen_s: slot.zoo.meta.gen_s != null ? `${slot.zoo.meta.gen_s} s` : NA,
                      cost: slot.zoo.meta.cost || NA,
                      editability: 're-prompt only (Zoo)',
                    }))
                  }
                />
              ) : (
                <PlaceholderPane
                  label="Zoo fixture pending"
                  detail={slot.zoo.meta.note || 'No STEP/STL path in manifest for this slot.'}
                />
              )}
              {zooMetrics ? <MetricsCard metrics={zooMetrics} /> : null}
            </ColumnShell>

            <ColumnShell
              title="img2threejs"
              subtitle={manifest.labels.img2threejs}
              badge={slot.img2threejs.status}
            >
              {slot.img2threejs.status === 'na' ? (
                <PlaceholderPane
                  label="N/A — image pipeline"
                  detail={slot.img2threejs.meta.note || 'No photo for this text-only slot.'}
                />
              ) : (
                <>
                  {slot.img2threejs.comparisonPng ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.img2threejs.comparisonPng}
                      alt="img2threejs comparison"
                      className="max-h-[280px] w-full rounded-lg border border-slate-200 object-contain dark:border-slate-700"
                    />
                  ) : (
                    <PlaceholderPane
                      label="Comparison PNG pending"
                      detail={slot.img2threejs.meta.note || 'Awaiting Meshcraft comparison sheet.'}
                    />
                  )}
                  {imgGlbUrls.length ? (
                    <CadColumnViewer
                      urls={imgGlbUrls}
                      onMetrics={(partial) =>
                        setImgMetrics((prev) => ({
                          ...(prev ||
                            baseMetrics(
                              slot.img2threejs.status,
                              slot.img2threejs.format,
                              slot.img2threejs.meta,
                              'edit TS factory',
                            )),
                          ...partial,
                          status: slot.img2threejs.status,
                          note: slot.img2threejs.meta.note || '',
                          downloadableStep: 'false',
                          editability: 'edit TS factory',
                        }))
                      }
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {slot.img2threejs.ts ? (
                      <a className="underline" href={slot.img2threejs.ts}>
                        TS factory
                      </a>
                    ) : (
                      <span className="text-slate-500">TS: N/A</span>
                    )}
                    {slot.img2threejs.spec ? (
                      <a className="underline" href={slot.img2threejs.spec}>
                        ObjectSculptSpec JSON
                      </a>
                    ) : (
                      <span className="text-slate-500">JSON: N/A</span>
                    )}
                    <span className="text-slate-500" title="Pipeline does not produce STEP">
                      STEP: N/A
                    </span>
                  </div>
                </>
              )}
              {imgMetrics ? <MetricsCard metrics={imgMetrics} /> : null}
            </ColumnShell>

            <ColumnShell
              title="text-to-cad"
              subtitle={manifest.labels.textToCad}
              badge={slot.textToCad.status}
            >
              {ttcUrls.length ? (
                <CadColumnViewer
                  urls={ttcUrls}
                  onMetrics={(partial) =>
                    setTtcMetrics((prev) => ({
                      ...(prev ||
                        baseMetrics(
                          slot.textToCad.status,
                          slot.textToCad.format,
                          slot.textToCad.meta,
                          'edit Python @step script',
                        )),
                      ...partial,
                      status: slot.textToCad.status,
                      note: slot.textToCad.meta.note || '',
                      downloadableStep: slot.textToCad.meta.downloadableStep ? 'true' : 'false',
                      editability: 'edit Python @step script',
                    }))
                  }
                />
              ) : (
                <PlaceholderPane
                  label="text-to-cad fixture pending"
                  detail={slot.textToCad.meta.note || 'No STEP/STL path in manifest for this slot.'}
                />
              )}
              {slot.textToCad.snapshot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slot.textToCad.snapshot}
                  alt="text-to-cad snapshot"
                  className="max-h-32 w-full rounded border border-slate-200 object-contain dark:border-slate-700"
                />
              ) : null}
              {ttcMetrics ? <MetricsCard metrics={ttcMetrics} /> : null}
            </ColumnShell>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Compare fixtures are precomputed offline. SteelSmart under{' '}
            <a className="underline" href={licenses.steelsmart.url} target="_blank" rel="noreferrer">
              {licenses.steelsmart.spdx || 'CC BY-NC 4.0'}
            </a>
            . Column tools: Zoo text-to-CAD (
            <a className="underline" href={licenses.zoo.url} target="_blank" rel="noreferrer">
              zoo.dev Terms
            </a>
            ), img2threejs (
            <a className="underline" href={licenses.img2threejs.url} target="_blank" rel="noreferrer">
              {licenses.img2threejs.spdx}
            </a>
            ), text-to-cad/cadgen (
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
