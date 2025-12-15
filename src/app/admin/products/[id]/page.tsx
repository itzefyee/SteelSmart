import { AdminProductDetailsContent } from '@/components/admin/products/AdminProductDetailsContent';

interface ProductDetailPageProps {
  params: { id: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return <AdminProductDetailsContent productId={params.id} />;
}
