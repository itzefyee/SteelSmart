'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    material: '',
    price: '',
    description: '',
    technical_details: '',
    lead_time: '',
    in_stock: true,
    images: [] as string[],
    specifications: {
      dimensions: '',
      weight: '',
      tolerance: '',
      loadCapacity: '',
      operatingTemp: '',
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === 'in_stock') {
      setFormData((prev) => ({
        ...prev,
        in_stock: value === 'true' || value === true,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const productData = {
      name: formData.name,
      category: formData.category,
      material: formData.material,
      price: parseFloat(formData.price),
      description: formData.description,
      image_url: formData.images[0] || null,
      specifications: formData.specifications,
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast({
          title: 'Product Created',
          description: 'The product has been successfully created.',
        });
        router.push('/admin/products');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
              {formData.images.length > 0 && (
                <div className="space-y-4">
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
                            toast({
                              title: 'Image Removed',
                              description: 'Image removed from preview',
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
                      toast({
                        title: 'File Size Exceeded',
                        description: `Total file size exceeds the 10MB limit`,
                        variant: 'destructive',
                      });
                      e.target.value = '';
                      return;
                    }

                    setUploading(true);
                    const imageUrls: string[] = [];

                    Array.from(files).forEach((file) => {
                      const reader = new FileReader();

                      reader.onloadend = () => {
                        const base64String = reader.result as string;
                        imageUrls.push(base64String);

                        if (imageUrls.length === files.length) {
                          setFormData((prev) => ({
                            ...prev,
                            images: [...prev.images, ...imageUrls],
                          }));

                          toast({
                            title: 'Images Added',
                            description: `${imageUrls.length} image(s) added`,
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

        <div className="flex justify-end gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}
