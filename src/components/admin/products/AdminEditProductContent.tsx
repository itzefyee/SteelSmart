'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useUpdateAdminProduct } from '@/hooks/admin/useAdminProducts';

interface Product {
  id: string;
  name: string;
  category: string;
}

interface ComponentTaxonomy {
  id: string;
  canonical_name: string;
  category: string;
  description: string;
}

interface AdminEditProductContentProps {
  productId: string;
}

export function AdminEditProductContent({ productId }: AdminEditProductContentProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [componentTaxonomies, setComponentTaxonomies] = useState<ComponentTaxonomy[]>([]);
  const [materialFamilies, setMaterialFamilies] = useState<string[]>([]);
  const [loadingTaxonomies, setLoadingTaxonomies] = useState(true);

  // React Query mutation for updating products
  const updateProductMutation = useUpdateAdminProduct();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    material: '',
    material_family: '',
    component_type_id: '',
    price: '',
    description: '',
    technical_details: '',
    lead_time: '',
    in_stock: true,
    images: [] as string[],
    imageFiles: [] as File[], // Store File objects for new uploads
    imagePreviewUrls: [] as string[], // For preview purposes of new uploads
    compatible_with: [] as string[],
    specifications: {
      dimensions: '',
      weight: '',
      tolerance: '',
      loadCapacity: '',
      operatingTemp: '',
    },
  });

  const [originalSku, setOriginalSku] = useState(''); // Track original SKU for folder renaming

  const [skuValidation, setSkuValidation] = useState({
    isChecking: false,
    isAvailable: true,
    message: ''
  });

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Fetch available products for compatibility selection
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/admin/products?limit=100');
        if (response.ok) {
          const data = await response.json();
          setAvailableProducts(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch component taxonomies and material families
  useEffect(() => {
    const fetchTaxonomiesAndMaterials = async () => {
      try {
        const [taxonomyResponse, materialResponse] = await Promise.all([
          fetch('/api/component-taxonomy'),
          fetch('/api/material-families')
        ]);

        if (taxonomyResponse.ok) {
          const taxonomyData = await taxonomyResponse.json();
          setComponentTaxonomies(taxonomyData.data || []);
        }

        if (materialResponse.ok) {
          const materialData = await materialResponse.json();
          setMaterialFamilies(materialData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch taxonomies or materials:', error);
      } finally {
        setLoadingTaxonomies(false);
      }
    };

    fetchTaxonomiesAndMaterials();
  }, []);

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      const data = await response.json();

      if (data.data) {
        const product: Product = data.data;
        const specs =
          typeof (product as any).specifications === 'object' && (product as any).specifications !== null
            ? ((product as any).specifications as Record<string, any>)
            : {};

        setFormData({
          name: product.name,
          sku: (product as any).sku || '',
          category: product.category || '',
          material: (product as any).material || '',
          material_family: (product as any).material_family || 'none',
          component_type_id: (product as any).component_type_id || 'none',
          price: (product as any).price?.toString() || '',
          description: (product as any).description || '',
          technical_details: (product as any).technical_details || '',
          lead_time: (product as any).lead_time || '',
          in_stock: (product as any).in_stock !== false,
          images: (product as any).images || [],
          imageFiles: [],
          imagePreviewUrls: [],
          compatible_with: (product as any).compatible_with || [],
          specifications: {
            dimensions: specs.dimensions || '',
            weight: specs.weight || '',
            tolerance: specs.tolerance || '',
            loadCapacity: specs.loadCapacity || '',
            operatingTemp: specs.operatingTemp || '',
          },
        });
        
        // Store original SKU for folder renaming
        setOriginalSku((product as any).sku || '');
      }
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load product',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSkuAvailability = async (sku: string) => {
    if (!sku.trim()) {
      setSkuValidation({ isChecking: false, isAvailable: true, message: '' });
      return;
    }

    setSkuValidation({ isChecking: true, isAvailable: true, message: 'Checking SKU availability...' });

    try {
      const response = await fetch(`/api/admin/products/check-sku?sku=${encodeURIComponent(sku)}&excludeId=${productId}`);
      const result = await response.json();

      if (response.ok) {
        setSkuValidation({
          isChecking: false,
          isAvailable: result.available,
          message: result.available ? 'SKU is available' : 'SKU already exists'
        });
      } else {
        setSkuValidation({
          isChecking: false,
          isAvailable: false,
          message: 'Error checking SKU'
        });
      }
    } catch (error) {
      setSkuValidation({
        isChecking: false,
        isAvailable: false,
        message: 'Error checking SKU'
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    if (field === 'in_stock') {
      setFormData((prev) => ({
        ...prev,
        in_stock: value === 'true' || value === true,
      }));
    } else if (field === 'compatible_with') {
      setFormData((prev) => ({
        ...prev,
        compatible_with: value as string[],
      }));
    } else if (field.startsWith('spec_')) {
      const specField = field.replace('spec_', '');
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Check SKU availability when SKU field changes
      if (field === 'sku' && typeof value === 'string') {
        const timeoutId = setTimeout(() => {
          checkSkuAvailability(value);
        }, 500); // Debounce for 500ms

        return () => clearTimeout(timeoutId);
      }
    }
  };

  // Function to upload images via API endpoint
  const uploadImagesToStorage = async (productId: string, imageFiles: File[]): Promise<string[]> => {
    try {
      const formData = new FormData();
      
      // Add all files to FormData
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
      
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || `Failed to upload images (${response.status})`);
      }
      
      const result = await response.json();
      return result.urls || [];
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      addToast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        type: 'error',
      });
      return;
    }

    // Check SKU availability if SKU is provided
    if (formData.sku && !skuValidation.isAvailable) {
      addToast({
        title: 'Validation Error',
        description: 'SKU already exists. Please choose a different SKU.',
        type: 'error',
      });
      return;
    }

    try {
      setUploading(true);

      // Upload new images to storage if any
      let currentImages = formData.images; // Start with current form images
      if (formData.imageFiles.length > 0) {
        addToast({
          title: 'Uploading Images',
          description: `Uploading ${formData.imageFiles.length} new image(s)...`,
          type: 'info',
        });

        const uploadResult = await uploadImagesToStorage(productId, formData.imageFiles);
        
        // Fetch the updated product to get the latest image URLs
        try {
          const productResponse = await fetch(`/api/admin/products/${productId}`);
          if (productResponse.ok) {
            const productData = await productResponse.json();
            currentImages = productData.data.images || [];
            
            // Update form state for UI consistency
            setFormData(prev => ({ 
              ...prev, 
              images: currentImages,
              imageFiles: [], // Clear uploaded files
              imagePreviewUrls: [] // Clear preview URLs
            }));
            
            // Small delay to ensure state update completes
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          // Handle error silently
        }
      }

      // Check if SKU has changed and handle folder renaming
      let updatedImages = currentImages; // Use the current images (updated by upload if any)
      if (originalSku && formData.sku && originalSku !== formData.sku) {
        addToast({
          title: 'Updating Images',
          description: 'Moving images to new folder location...',
          type: 'info',
        });

        const renameResponse = await fetch(`/api/admin/products/${productId}/rename-folder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldSku: originalSku,
            newSku: formData.sku
          }),
        });

        if (!renameResponse.ok) {
          const error = await renameResponse.json();
          addToast({
            title: 'Warning',
            description: 'Product updated but failed to move images to new folder',
            type: 'warning',
          });
        } else {
          const renameResult = await renameResponse.json();
          // Use the updated image URLs from the rename operation
          if (renameResult.newImageUrls && renameResult.newImageUrls.length > 0) {
            updatedImages = renameResult.newImageUrls;
          }
        }
      }

      const productData = {
        id: productId,
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        material: formData.material,
        material_family: formData.material_family === 'none' ? null : formData.material_family,
        component_type_id: formData.component_type_id === 'none' ? null : formData.component_type_id,
        price: parseFloat(formData.price),
        description: formData.description,
        technical_details: formData.technical_details,
        lead_time: formData.lead_time,
        in_stock: formData.in_stock,
        images: updatedImages, // Use updated images (either from form or rename operation)
        specifications: formData.specifications,
        compatible_with: formData.compatible_with,
      };

      // Use React Query mutation to update product
      await updateProductMutation.mutateAsync(productData);

      addToast({
        title: 'Product Updated',
        description: 'The product has been successfully updated.',
        type: 'success',
      });
      router.push(`/admin/products/${productId}`);
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Loading product...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">Update product information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    className={formData.name ? 'bg-blue-50' : 'bg-white'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Enter product SKU (e.g., PSR-001)"
                    className={`${formData.sku ? 'bg-blue-50' : 'bg-white'} ${
                      formData.sku && !skuValidation.isAvailable ? 'border-red-500' : ''
                    }`}
                  />
                  {formData.sku && (
                    <div className={`text-sm ${
                      skuValidation.isChecking 
                        ? 'text-gray-500' 
                        : skuValidation.isAvailable 
                          ? 'text-green-600' 
                          : 'text-red-600'
                    }`}>
                      {skuValidation.message}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) => handleInputChange('material', e.target.value)}
                    placeholder="e.g., Aluminum, Steel, Plastic"
                    className={formData.material ? 'bg-blue-50' : 'bg-white'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material_family">Material Family</Label>
                  <Select 
                    value={formData.material_family || undefined} 
                    onValueChange={(value) => handleInputChange('material_family', value)}
                    disabled={loadingTaxonomies}
                  >
                    <SelectTrigger className={formData.material_family && formData.material_family !== 'none' ? 'bg-blue-50' : 'bg-white'}>
                      <SelectValue placeholder={loadingTaxonomies ? "Loading..." : "Select material family"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="none">None</SelectItem>
                      {materialFamilies.map((family) => (
                        <SelectItem key={family} value={family}>
                          {family}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="component_type_id">Component Type</Label>
                  <Select 
                    value={formData.component_type_id || undefined} 
                    onValueChange={(value) => handleInputChange('component_type_id', value)}
                    disabled={loadingTaxonomies}
                  >
                    <SelectTrigger className={formData.component_type_id && formData.component_type_id !== 'none' ? 'bg-blue-50' : 'bg-white'}>
                      <SelectValue placeholder={loadingTaxonomies ? "Loading..." : "Select component type"}>
                        {formData.component_type_id && formData.component_type_id !== 'none' ? (
                          componentTaxonomies.find(t => t.id === formData.component_type_id)?.canonical_name || 'Select component type'
                        ) : (
                          formData.component_type_id === 'none' ? 'None' : 'Select component type'
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="none">None</SelectItem>
                      {componentTaxonomies.map((taxonomy) => (
                        <SelectItem key={taxonomy.id} value={taxonomy.id}>
                          <div className="flex flex-col items-start">
                            <span>{taxonomy.canonical_name}</span>
                            {taxonomy.description && (
                              <span className="text-xs text-muted-foreground">{taxonomy.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category || undefined} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className={formData.category ? 'bg-blue-50' : 'bg-white'}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="robotic">Robotic</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="fasteners">Fasteners</SelectItem>
                      <SelectItem value="structural">Structural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      className={formData.price ? 'bg-blue-50' : 'bg-white'}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead_time">Lead Time</Label>
                    <Input
                      id="lead_time"
                      value={formData.lead_time}
                      onChange={(e) => handleInputChange('lead_time', e.target.value)}
                      placeholder="e.g., 2-3 weeks"
                      className={formData.lead_time ? 'bg-blue-50' : 'bg-white'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="in_stock">Stock Status</Label>
                  <Select
                    value={formData.in_stock ? 'true' : 'false'}
                    onValueChange={(value) => handleInputChange('in_stock', value === 'true')}
                  >
                    <SelectTrigger className="bg-blue-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="true">In Stock</SelectItem>
                      <SelectItem value="false">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter product description"
                    className={formData.description ? 'bg-blue-50' : 'bg-white'}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technical_details">Technical Details</Label>
                  <Textarea
                    id="technical_details"
                    value={formData.technical_details}
                    onChange={(e) => handleInputChange('technical_details', e.target.value)}
                    placeholder="Enter technical specifications and details"
                    className={formData.technical_details ? 'bg-blue-50' : 'bg-white'}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Input
                    id="dimensions"
                    value={formData.specifications.dimensions}
                    onChange={(e) => handleInputChange('spec_dimensions', e.target.value)}
                    placeholder="e.g., Ø320 mm x 32 mm vented rotor"
                    className={formData.specifications.dimensions ? 'bg-blue-50' : 'bg-white'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={formData.specifications.weight}
                    onChange={(e) => handleInputChange('spec_weight', e.target.value)}
                    placeholder="e.g., 9.2 kg per rotor"
                    className={formData.specifications.weight ? 'bg-blue-50' : 'bg-white'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tolerance">Tolerance</Label>
                  <Input
                    id="tolerance"
                    value={formData.specifications.tolerance}
                    onChange={(e) => handleInputChange('spec_tolerance', e.target.value)}
                    placeholder="e.g., Face runout ≤ 0.03 mm"
                    className={formData.specifications.tolerance ? 'bg-blue-50' : 'bg-white'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loadCapacity">Load Capacity</Label>
                  <Input
                    id="loadCapacity"
                    value={formData.specifications.loadCapacity}
                    onChange={(e) => handleInputChange('spec_loadCapacity', e.target.value)}
                    placeholder="e.g., Clamp load up to 45 kN"
                    className={formData.specifications.loadCapacity ? 'bg-blue-50' : 'bg-white'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingTemp">Operating Temperature</Label>
                  <Input
                    id="operatingTemp"
                    value={formData.specifications.operatingTemp}
                    onChange={(e) => handleInputChange('spec_operatingTemp', e.target.value)}
                    placeholder="e.g., Up to 650°C continuous"
                    className={formData.specifications.operatingTemp ? 'bg-blue-50' : 'bg-white'}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.images.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Current Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            setFormData((prev) => ({ ...prev, images: newImages }));
                            addToast({
                              title: 'Image Removed',
                              description: 'Image removed from current images',
                              type: 'info',
                            });
                          }}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.imagePreviewUrls.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">New Images (to be uploaded)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.imagePreviewUrls.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`New Product ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border border-primary/50"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImageFiles = formData.imageFiles.filter((_, i) => i !== index);
                            const newPreviewUrls = formData.imagePreviewUrls.filter((_, i) => i !== index);
                            setFormData((prev) => ({ 
                              ...prev, 
                              imageFiles: newImageFiles,
                              imagePreviewUrls: newPreviewUrls
                            }));
                            addToast({
                              title: 'Image Removed',
                              description: 'New image removed from preview',
                              type: 'info',
                            });
                          }}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;

                    const MAX_TOTAL_SIZE = 10 * 1024 * 1024;
                    let totalSize = 0;

                    for (const file of Array.from(files)) {
                      totalSize += file.size;
                    }

                    if (totalSize > MAX_TOTAL_SIZE) {
                      addToast({
                        title: 'File Size Exceeded',
                        description: `Total file size exceeds the 10MB limit`,
                        type: 'error',
                      });
                      e.target.value = '';
                      return;
                    }

                    setUploading(true);
                    const newFiles: File[] = [];
                    const newPreviewUrls: string[] = [];

                    Array.from(files).forEach((file) => {
                      newFiles.push(file);
                      
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64String = reader.result as string;
                        newPreviewUrls.push(base64String);

                        if (newPreviewUrls.length === files.length) {
                          setFormData((prev) => ({
                            ...prev,
                            imageFiles: [...prev.imageFiles, ...newFiles],
                            imagePreviewUrls: [...prev.imagePreviewUrls, ...newPreviewUrls],
                          }));

                          addToast({
                            title: 'Images Added',
                            description: `${newFiles.length} image(s) added to preview`,
                            type: 'success',
                          });

                          setUploading(false);
                          e.target.value = '';
                        }
                      };

                      reader.readAsDataURL(file);
                    });
                  }}
                />
                <label
                  htmlFor="image-upload"
                  className={`flex flex-col items-center space-y-2 ${
                    uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                >
                  <div className="text-muted-foreground">
                    {uploading ? 'Processing images...' : 'Click to add more product images'}
                  </div>
                  <div
                    className={`px-4 py-2 bg-primary text-white rounded-md transition-colors flex items-center gap-2 ${
                      uploading ? 'opacity-50' : 'hover:bg-primary/90'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Processing...' : 'Choose Files'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    All image formats supported • Maximum 10MB total
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compatible Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Compatible Products</Label>
                <p className="text-sm text-muted-foreground">
                  Choose products that are compatible with this product for recommendations.
                </p>
                
                {loadingProducts ? (
                  <div className="text-sm text-muted-foreground">Loading products...</div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                      {availableProducts.filter(p => p.id !== productId).map((product) => (
                        <label
                          key={product.id}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.compatible_with.includes(product.id)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              const currentCompatible = formData.compatible_with;
                              
                              if (isChecked) {
                                handleInputChange('compatible_with', [...currentCompatible, product.id]);
                              } else {
                                handleInputChange('compatible_with', currentCompatible.filter(id => id !== product.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                                {product.category}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    {formData.compatible_with.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2">
                          Selected Products ({formData.compatible_with.length}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.compatible_with.map((productId) => {
                            const product = availableProducts.find(p => p.id === productId);
                            return product ? (
                              <div
                                key={productId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                              >
                                <span>{product.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleInputChange('compatible_with', 
                                      formData.compatible_with.filter(id => id !== productId)
                                    );
                                  }}
                                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={`/admin/products/${productId}`}>
            <Button type="button" variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={uploading}>
            <Save className="h-4 w-4 mr-2" />
            {uploading ? 'Updating Product...' : 'Update Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}