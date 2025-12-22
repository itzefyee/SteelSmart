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
import { ArrowLeft, Save, X, Upload, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { createClient } from '@supabase/supabase-js';

interface Product {
  id: string;
  name: string;
  category: string;
}

export function AdminNewProductContent() {
  const router = useRouter();
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    material: '',
    price: '',
    description: '',
    technical_details: '',
    lead_time: '',
    in_stock: true,
    imageFiles: [] as File[], // Store File objects instead of base64
    imagePreviewUrls: [] as string[], // For preview purposes
    compatible_with: [] as string[],
    specifications: {
      dimensions: '',
      weight: '',
      tolerance: '',
      loadCapacity: '',
      operatingTemp: '',
    },
  });

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
    }
  };

  // Function to upload images to Supabase storage
  const uploadImagesToStorage = async (productId: string, imageFiles: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${productId}/image-${i + 1}.${fileExtension}`;
        
        console.log(`Uploading image ${i + 1}/${imageFiles.length}: ${fileName}`);
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) {
          console.error('Storage upload error:', error);
          throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
        console.log(`Successfully uploaded: ${publicUrl}`);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error in uploadImagesToStorage:', error);
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

    try {
      setUploading(true);

      // Step 1: Create the product first (without images)
      const productData = {
        name: formData.name,
        category: formData.category,
        material: formData.material,
        price: parseFloat(formData.price),
        description: formData.description,
        technical_details: formData.technical_details,
        lead_time: formData.lead_time,
        in_stock: formData.in_stock,
        specifications: formData.specifications,
        compatible_with: formData.compatible_with,
        images: [], // Empty initially
      };

      const createResponse = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Failed to create product');
      }

      const createdProduct = await createResponse.json();
      const productId = createdProduct.data.id;

      // Step 2: Upload images to storage if any
      let imageUrls: string[] = [];
      if (formData.imageFiles.length > 0) {
        addToast({
          title: 'Uploading Images',
          description: `Uploading ${formData.imageFiles.length} image(s)...`,
          type: 'info',
        });

        imageUrls = await uploadImagesToStorage(productId, formData.imageFiles);
      }

      // Step 3: Update the product with image URLs
      if (imageUrls.length > 0) {
        const updateResponse = await fetch(`/api/admin/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: imageUrls }),
        });

        if (!updateResponse.ok) {
          console.error('Failed to update product with image URLs');
        }
      }

      addToast({
        title: 'Product Created',
        description: 'The product has been successfully created with images.',
        type: 'success',
      });
      
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Upload error:', error);
      addToast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product for your catalog</p>
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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) => handleInputChange('material', e.target.value)}
                    placeholder="e.g., Aluminum, Steel, Plastic"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category || undefined} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="in_stock">Stock Status</Label>
                  <Select
                    value={formData.in_stock ? 'true' : 'false'}
                    onValueChange={(value) => handleInputChange('in_stock', value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={formData.specifications.weight}
                    onChange={(e) => handleInputChange('spec_weight', e.target.value)}
                    placeholder="e.g., 9.2 kg per rotor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tolerance">Tolerance</Label>
                  <Input
                    id="tolerance"
                    value={formData.specifications.tolerance}
                    onChange={(e) => handleInputChange('spec_tolerance', e.target.value)}
                    placeholder="e.g., Face runout ≤ 0.03 mm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loadCapacity">Load Capacity</Label>
                  <Input
                    id="loadCapacity"
                    value={formData.specifications.loadCapacity}
                    onChange={(e) => handleInputChange('spec_loadCapacity', e.target.value)}
                    placeholder="e.g., Clamp load up to 45 kN"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingTemp">Operating Temperature</Label>
                  <Input
                    id="operatingTemp"
                    value={formData.specifications.operatingTemp}
                    onChange={(e) => handleInputChange('spec_operatingTemp', e.target.value)}
                    placeholder="e.g., Up to 650°C continuous"
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
              {formData.imagePreviewUrls.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.imagePreviewUrls.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Product ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border"
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
                              description: 'Image removed from preview',
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
                            description: `${newFiles.length} image(s) added`,
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
                    {uploading ? 'Processing images...' : 'Click to select product images'}
                  </div>
                  <div
                    className={`px-4 py-2 bg-primary text-primary-foreground rounded-md transition-colors flex items-center gap-2 ${
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
                      {availableProducts.map((product) => (
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
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={uploading}>
            <Save className="h-4 w-4 mr-2" />
            {uploading ? 'Creating Product...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}