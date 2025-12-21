import { AdminEditProductContent } from '@/components/admin/products/AdminEditProductContent';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  return <AdminEditProductContent productId={id} />;
}
