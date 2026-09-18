import type { Metadata } from 'next';
import CADCompareClient from '@/components/cad/CADCompareClient';

export const metadata: Metadata = {
  title: 'CAD Compare (Experimental) | SteelSmart',
  description:
    'Side-by-side experimental comparison of Current (Zoo), img2threejs, and text-to-cad pipelines.',
};

export default function CADComparePage() {
  return <CADCompareClient />;
}
