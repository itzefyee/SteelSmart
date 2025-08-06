'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { RFQFormData, ValidationErrors, APIResponse } from '@/types';
import { validateEmail, formatFileSize, isValidFileType, isValidFileSize } from '@/lib/utils';

const RFQForm: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [rfqId, setRfqId] = useState<string>('');

  const [formData, setFormData] = useState<RFQFormData>({
    contactInfo: {
      name: '',
      email: '',
      company: '',
      phone: ''
    },
    requirements: {
      projectDescription: '',
      quantity: 1,
      material: '',
      specifications: '',
      deadline: '',
      budget: ''
    },
    files: []
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const totalSteps = 4;

  const updateContactInfo = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const updateRequirements = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      if (!formData.contactInfo.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!formData.contactInfo.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.contactInfo.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.contactInfo.company.trim()) {
        newErrors.company = 'Company name is required';
      }
    }

    if (step === 2) {
      if (!formData.requirements.projectDescription.trim()) {
        newErrors.projectDescription = 'Project description is required';
      }
      if (formData.requirements.quantity < 1) {
        newErrors.quantity = 'Quantity must be at least 1';
      }
      if (!formData.requirements.specifications.trim()) {
        newErrors.specifications = 'Technical specifications are required';
      }
      if (!formData.requirements.deadline.trim()) {
        newErrors.deadline = 'Project deadline is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const fileErrors: string[] = [];

    files.forEach(file => {
      if (!isValidFileType(file, ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.ms-excel', 'text/plain'])) {
        fileErrors.push(`${file.name}: Invalid file type`);
      } else if (!isValidFileSize(file, 10)) {
        fileErrors.push(`${file.name}: File size exceeds 10MB`);
      } else {
        validFiles.push(file);
      }
    });

    if (fileErrors.length > 0) {
      setErrors(prev => ({
        ...prev,
        files: fileErrors.join(', ')
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        files: undefined
      }));
    }

    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const submitRFQ = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);

    try {
      const formDataToSubmit = new FormData();
      
      // Add contact info
      Object.entries(formData.contactInfo).forEach(([key, value]) => {
        formDataToSubmit.append(key, value);
      });

      // Add requirements
      Object.entries(formData.requirements).forEach(([key, value]) => {
        formDataToSubmit.append(key, value.toString());
      });

      // Add files
      formData.files.forEach((file, index) => {
        formDataToSubmit.append(`file_${index}`, file);
      });

      const response = await fetch('/api/submit-rfq', {
        method: 'POST',
        body: formDataToSubmit,
      });

      const result: APIResponse<{ rfqId: string }> = await response.json();

      if (result.success && result.data) {
        setRfqId(result.data.rfqId);
        setSubmitSuccess(true);
        setCurrentStep(4);
      } else {
        throw new Error(result.error || 'Failed to submit RFQ');
      }
    } catch (error) {
      console.error('Error submitting RFQ:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to submit RFQ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Contact Information';
      case 2: return 'Project Requirements';
      case 3: return 'Files & Review';
      case 4: return 'Confirmation';
      default: return '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                required
                value={formData.contactInfo.name}
                onChange={(value) => updateContactInfo('name', value)}
                error={errors.name}
                placeholder="John Doe"
              />
              <Input
                label="Email Address"
                type="email"
                required
                value={formData.contactInfo.email}
                onChange={(value) => updateContactInfo('email', value)}
                error={errors.email}
                placeholder="john@company.com"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Company Name"
                required
                value={formData.contactInfo.company}
                onChange={(value) => updateContactInfo('company', value)}
                error={errors.company}
                placeholder="Acme Manufacturing"
              />
              <Input
                label="Phone Number"
                type="tel"
                value={formData.contactInfo.phone || ''}
                onChange={(value) => updateContactInfo('phone', value)}
                error={errors.phone}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Input
              label="Project Description"
              type="textarea"
              required
              value={formData.requirements.projectDescription}
              onChange={(value) => updateRequirements('projectDescription', value)}
              error={errors.projectDescription}
              placeholder="Describe your project and what you need manufactured..."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Quantity"
                type="number"
                required
                value={formData.requirements.quantity.toString()}
                onChange={(value) => updateRequirements('quantity', parseInt(value) || 1)}
                error={errors.quantity}
                placeholder="1"
              />
              <Input
                label="Preferred Material"
                value={formData.requirements.material || ''}
                onChange={(value) => updateRequirements('material', value)}
                error={errors.material}
                placeholder="e.g., Stainless Steel, Aluminum"
              />
            </div>

            <Input
              label="Technical Specifications"
              type="textarea"
              required
              value={formData.requirements.specifications}
              onChange={(value) => updateRequirements('specifications', value)}
              error={errors.specifications}  
              placeholder="Include dimensions, tolerances, surface finish requirements, etc."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Project Deadline"
                type="text"
                required
                value={formData.requirements.deadline}
                onChange={(value) => updateRequirements('deadline', value)}
                error={errors.deadline}
                placeholder="e.g., 2 weeks, End of March"
              />
              <Input
                label="Budget Range (Optional)"
                value={formData.requirements.budget || ''}
                onChange={(value) => updateRequirements('budget', value)}
                error={errors.budget}
                placeholder="e.g., $1000-5000"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Files (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className="text-lg font-medium text-gray-900">Upload Additional Files</p>
                      <p className="text-gray-500">Technical drawings, specifications, or reference images</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Supports PDF, PNG, JPG, XLS, TXT up to 10MB each
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              {errors.files && (
                <p className="mt-2 text-sm text-red-600">{errors.files}</p>
              )}
            </div>

            {/* Uploaded Files */}
            {formData.files.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files</h4>
                <div className="space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Review Your Request</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Contact Information</h5>
                  <p><strong>Name:</strong> {formData.contactInfo.name}</p>
                  <p><strong>Email:</strong> {formData.contactInfo.email}</p>
                  <p><strong>Company:</strong> {formData.contactInfo.company}</p>
                  {formData.contactInfo.phone && (
                    <p><strong>Phone:</strong> {formData.contactInfo.phone}</p>
                  )}
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Project Details</h5>
                  <p><strong>Quantity:</strong> {formData.requirements.quantity}</p>
                  <p><strong>Deadline:</strong> {formData.requirements.deadline}</p>
                  {formData.requirements.material && (
                    <p><strong>Material:</strong> {formData.requirements.material}</p>
                  )}
                  {formData.requirements.budget && (
                    <p><strong>Budget:</strong> {formData.requirements.budget}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully!</h2>
              <p className="text-gray-600 mb-4">
                Thank you for your request. We'll review your requirements and get back to you within 24 hours.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>Reference Number:</strong> {rfqId}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Please keep this number for your records. We've also sent a confirmation email to {formData.contactInfo.email}.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push('/catalog')}>
                Browse Products
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step}
              </div>
              {step < 4 && (
                <div className={`
                  h-1 w-24 mx-2
                  ${currentStep > step ? 'bg-primary' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
          </h2>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow border p-8">
        {renderStepContent()}

        {/* Error Display */}
        {errors.submit && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep === 3 ? (
              <Button
                onClick={submitRFQ}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RFQForm;