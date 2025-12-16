import { AdminProductDetailsContent } from '@/components/admin/products/AdminProductDetailsContent';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  return <AdminProductDetailsContent productId={id} />;
}
