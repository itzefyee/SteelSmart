'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { RFQFormData, ValidationErrors, APIResponse } from '@/types';
import { validateEmail, formatFileSize, isValidFileType, isValidFileSize } from '@/lib/utils';
import { sampleDrawings, cadTemplates } from '@/data/sample-data';
import { useToast } from '@/components/ui/ToastProvider';

const RFQForm: React.FC = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [selectedDrawing, setSelectedDrawing] = useState<number | null>(null);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const totalSteps = 4;

  // Check for drawing ID in URL params for auto-fill
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const drawingId = urlParams.get('drawingId');
    if (drawingId) {
      const drawing = sampleDrawings.find(d => d.id === parseInt(drawingId));
      if (drawing) {
        setSelectedDrawing(drawing.id);
        setShowAutoFill(true);
      }
    }
  }, []);

  // Check for auto-fill from analysis
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('fromAnalysis') === 'true') {
      const analysisData = sessionStorage.getItem('analysisForRFQ');
      if (analysisData) {
        const data = JSON.parse(analysisData);
        setAnalysisSource(data);
        autoFillFromAnalysis(data);
        sessionStorage.removeItem('analysisForRFQ');
      }
    }
  }, []);

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

  const autoFillFromAnalysis = (analysisData: any) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        projectDescription: `Analysis-based RFQ for ${analysisData.drawingName || 'analyzed component'}`,
        material: analysisData.material || 'Steel',
        specifications: analysisData.specifications || 'Based on CAD analysis results',
        quantity: prev.requirements.quantity || 1,
        budget: prev.requirements.budget || ''
      }
    }));
    setShowAutoFill(false);
  };

  const autoFillFromTemplate = (template: any) => {
    const specifications = Object.entries(template.parameters)
      .map(([key, param]: [string, any]) => {
        if (param.value) {
          return `${param.label || key}: ${param.value}${param.unit || ''}`;
        }
        return null;
      })
      .filter(Boolean)
      .join(', ');

    const material = template.parameters.material?.value || 'Steel';

    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        projectDescription: `Manufacturing request for ${template.name} - ${template.description}`,
        material: material,
        specifications: specifications,
        quantity: prev.requirements.quantity || 1,
        budget: prev.requirements.budget || ''
      }
    }));
    setShowTemplateModal(false);
    setSelectedTemplate(template);
  };

  const submitRFQ = async () => {
    if (!validateStep(2)) {
      addToast({
        type: 'warning',
        title: 'Complete form',
        description: 'Please finish the required project details before submitting.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('You must be logged in to submit an RFQ. Please log in and try again.');
      }
      
      const formDataToSubmit = new FormData();
      
      // Add contact info
      Object.entries(formData.contactInfo).forEach(([key, value]) => {
        const cleanValue = value?.trim() || '';
        formDataToSubmit.append(key, cleanValue);
      });

      // Add requirements
      Object.entries(formData.requirements).forEach(([key, value]) => {
        const cleanValue = value?.toString().trim() || '';
        formDataToSubmit.append(key, cleanValue);
      });

      // Add files
      formData.files.forEach((file, index) => {
        formDataToSubmit.append('files', file);
      });

      const response = await fetch('/api/submit-rfq', {
        method: 'POST',
        body: formDataToSubmit,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: APIResponse<{ rfqId: string }> = await response.json();

      if (result.success && result.data) {
        setRfqId(result.data.rfqId);
        setCurrentStep(4);
        addToast({
          type: 'success',
          title: 'RFQ submitted',
          description: `Request ID ${result.data.rfqId}`
        });
      } else {
        // Handle authentication errors specifically
        if (response.status === 401) {
          throw new Error('Please log in to submit an RFQ. You need to be authenticated to save your request.');
        }
        throw new Error(result.error || 'Failed to submit RFQ');
      }
    } catch (error) {
      console.error('Error submitting RFQ:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to submit RFQ' });
      addToast({
        type: 'error',
        title: 'RFQ submission failed',
        description: error instanceof Error ? error.message : 'Unknown error while submitting.'
      });
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
            {/* Analysis Source Information */}
            {analysisSource && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-blue-900">RFQ Based on CAD Analysis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Drawing:</span>
                    <span className="ml-2 text-gray-900">{analysisSource.drawingName || 'Analyzed Component'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Material:</span>
                    <span className="ml-2 text-gray-900">{analysisSource.material || 'Steel'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Confidence:</span>
                    <span className="ml-2 text-gray-900">{analysisSource.analysisConfidence || 'High'}</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Form fields have been pre-filled based on the CAD analysis results. You can modify them as needed.
                </p>
              </div>
            )}
            
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

            {/* Analysis Source Information or Template Auto-fill Section */}
            {analysisSource ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-blue-900">RFQ Based on CAD Analysis</h3>
                  </div>
                  <Button
                    onClick={() => setShowTemplateModal(true)}
                    variant="outline"
                    size="sm"
                  >
                    Browse Templates
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <span className="font-medium text-gray-700">Drawing:</span>
                    <span className="ml-2 text-gray-900">{analysisSource.drawingName || 'Analyzed Component'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Material:</span>
                    <span className="ml-2 text-gray-900">{analysisSource.material || 'Steel'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Confidence:</span>
                    <span className="ml-2 text-gray-900">{analysisSource.analysisConfidence || 'High'}</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700">
                  Form fields have been pre-filled based on the CAD analysis results. You can modify them as needed or use templates for additional options.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900">Quick Fill from Templates</h3>
                  </div>
                  <Button
                    onClick={() => setShowTemplateModal(true)}
                    variant="outline"
                    size="sm"
                  >
                    Browse Templates
                  </Button>
                </div>
                {selectedTemplate && (
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Currently using:</span> {selectedTemplate.name}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Select from predefined CAD templates to quickly populate specifications and requirements.
                </p>
              </div>
            )}
            
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
                Thank you for your request. We&apos;ll review your requirements and get back to you within 24 hours.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>Reference Number:</strong> {rfqId}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Please keep this number for your records. We&apos;ve also sent a confirmation email to {formData.contactInfo.email}.
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
        <div className="flex items-center mb-4">
          {[1, 2, 3, 4].map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex justify-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {step}
                </div>
              </div>
              {step < 4 && (
                <div className={`
                  h-1 flex-1 mx-4
                  ${currentStep > step ? 'bg-primary' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
          </h2>
        </div>
      </div>

      {/* Form Content */}
      <div className="glass-container p-8">
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

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Select CAD Template</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Choose a template to auto-fill your RFQ with predefined specifications and parameters.
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cadTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="glass-card-compact cursor-pointer"
                    onClick={() => autoFillFromTemplate(template)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        <img
                          src={template.preview}
                          alt={template.name}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <div className="text-xs text-gray-500">
                          <div className="mb-1">
                            <span className="font-medium">Material:</span> {template.parameters.material?.value || 'Steel'}
                          </div>
                          <div className="mb-1">
                            <span className="font-medium">Category:</span> {template.category}
                          </div>
                          <div>
                            <span className="font-medium">Parameters:</span> {Object.keys(template.parameters).length} included
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Click to use template</span>
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowTemplateModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQForm;