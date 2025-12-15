import { AdminEditProductContent } from '@/components/admin/products/AdminEditProductContent';

interface EditProductPageProps {
  params: { id: string };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  return <AdminEditProductContent productId={params.id} />;
}
