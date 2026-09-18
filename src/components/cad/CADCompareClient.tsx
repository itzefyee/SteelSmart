'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CADPreview3D = dynamic(() => import('@/components/cad/CADPreview3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] items-center justify-center">
      <LoadingSpinner />
    </div>
  ),
});

const CURRENT_FIXTURE_URL = '/cad-compare-fixtures/current/stub-bracket.stl';
const CURRENT_FIXTURE_NAME = 'stub-bracket.stl';

type ColumnState = 'loading' | 'ready' | 'empty' | 'error';

function ExperimentalBanner() {
  return (
    <div
      role="status"
      className="mb-6 rounded-lg border border-amber-400/60 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="font-semibold tracking-wide">Experimental — CAD Compare (PR1)</p>
      <p className="mt-1 opacity-90">
        Fixture-only shell. No live Zoo / img2threejs / text-to-cad API calls. Columns 2–3 are
        placeholders. Do not use for production RFQ decisions.
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
    <section className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {badge}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </header>
      <div className="relative flex flex-1 flex-col p-3">{children}</div>
    </section>
  );
}

function PlaceholderPane({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center dark:border-slate-600 dark:bg-slate-800/50">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <p className="mt-2 max-w-xs text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function CurrentColumn() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ColumnState>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function loadFixture() {
      setState('loading');
      setError('');
      try {
        const res = await fetch(CURRENT_FIXTURE_URL);
        if (!res.ok) {
          throw new Error(`Fixture HTTP ${res.status}`);
        }
        const blob = await res.blob();
        if (cancelled) return;
        const next = new File([blob], CURRENT_FIXTURE_NAME, {
          type: blob.type || 'model/stl',
        });
        setFile(next);
        setState('ready');
      } catch (err) {
        if (cancelled) return;
        setFile(null);
        setState('empty');
        setError(err instanceof Error ? err.message : 'Failed to load fixture');
      }
    }

    loadFixture();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ColumnShell
      title="Current"
      subtitle="SteelSmart Zoo / KittyCAD path — static fixture only"
      badge="fixture"
    >
      {state === 'loading' && (
        <div className="flex min-h-[280px] flex-1 items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      {state === 'ready' && file && (
        <div className="min-h-[280px] flex-1 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <CADPreview3D file={file} className="h-[320px] w-full" showStats={false} />
          <p className="mt-2 px-1 text-[11px] text-slate-500">
            Static artifact: <code>{CURRENT_FIXTURE_URL}</code> (not live Zoo)
          </p>
        </div>
      )}
      {(state === 'empty' || state === 'error') && (
        <PlaceholderPane
          label="Current fixture unavailable"
          detail={
            error
              ? `Could not load ${CURRENT_FIXTURE_URL}: ${error}`
              : 'No prebaked Current artifact found. Place a stub under public/cad-compare-fixtures/current/.'
          }
        />
      )}
    </ColumnShell>
  );
}

export default function CADCompareClient() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="home-wavy-bg relative flex-1 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ExperimentalBanner />
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              CAD Compare
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Three-column research shell comparing SteelSmart&apos;s current generator with
              img2threejs and earthtojake/text-to-cad. PR1 = layout + one Current fixture.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <CurrentColumn />

            <ColumnShell
              title="img2threejs"
              subtitle="Image → procedural Three.js (visual, not STEP)"
              badge="placeholder"
            >
              <PlaceholderPane
                label="img2threejs — not wired yet"
                detail="PR1 placeholder. Future: static screenshot / optional GLB fixture. No live agent run."
              />
            </ColumnShell>

            <ColumnShell
              title="text-to-cad"
              subtitle="earthtojake / cadgen STEP-first pipeline"
              badge="placeholder"
            >
              <PlaceholderPane
                label="text-to-cad — not wired yet"
                detail="PR1 placeholder. Future: prebaked STEP/STL fixture. No live cadgen calls."
              />
            </ColumnShell>
          </div>

          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            License note (stub): SteelSmart CC BY-NC 4.0 · compare libs have their own licenses
            (img2threejs Apache-2.0, text-to-cad MIT).
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
