'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ProductCard';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CADPreview3D from '@/components/CADPreview3D';
import { DrawingAnalysis, FileUploadState, APIResponse } from '@/types';
import { formatFileSize } from '@/lib/utils';
import { sampleAnalysisReport } from '@/data/sample-data';
import { CADModelData } from '@/lib/cad-parser';
import { ComplianceChecker, convertCADModelToGeometry } from '@/lib/compliance-checker';

const CADAnalyzerFull: React.FC = () => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    progress: 0,
    status: 'idle',
    error: undefined
  });
  
  const [analysis, setAnalysis] = useState<DrawingAnalysis | null>(null);
  const [cadModelData, setCADModelData] = useState<CADModelData | null>(null);
  const [sampleLoadSuccess, setSampleLoadSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'validation' | 'verification' | 'report'>('analysis');
  const [manufacturabilityResults, setManufacturabilityResults] = useState<any[]>([]);
  const [specificationResults, setSpecificationResults] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Check for stored analysis results on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showResults') === 'true') {
      const storedResult = sessionStorage.getItem('cadAnalysisResult');
      if (storedResult) {
        try {
          const analysisData = JSON.parse(storedResult);
          setAnalysis(analysisData);
          // Clear the stored result
          sessionStorage.removeItem('cadAnalysisResult');
          // Clean up URL
          window.history.replaceState({}, '', '/cad-analyzer');
          // Show success message
          setSampleLoadSuccess('Analysis results loaded successfully!');
        } catch (error) {
          console.error('Error parsing stored analysis result:', error);
        }
      }
    }
  }, []);


  const maxSizeInMB = 10;

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMessage = 'File rejected';
      
      if (rejection.errors?.find((e) => e.code === 'file-too-large')) {
        errorMessage = `File size exceeds ${maxSizeInMB}MB limit`;
      } else       if (rejection.errors?.find((e) => e.code === 'file-invalid-type')) {
        errorMessage = 'Invalid file type. Please upload PDF, PNG, JPG, STEP, STL, OBJ, DXF, glTF, or GLB files';
      }
      
      setUploadState({
        file: null,
        progress: 0,
        status: 'error',
        error: errorMessage
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadState({
        file,
        progress: 0,
        status: 'idle',
        error: undefined
      });
      
      // Clear previous analysis results and success messages
      setAnalysis(null);
      setSampleLoadSuccess(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/step': ['.step', '.stp'],
      'application/sla': ['.stl'],
      'model/obj': ['.obj'],
      'application/dxf': ['.dxf'],
      'model/gltf+json': ['.gltf'],
      'model/gltf-binary': ['.glb']
    },
    maxSize: maxSizeInMB * 1024 * 1024,
    multiple: false
  });

  const analyzeDrawing = async () => {
    if (!uploadState.file) return;

    setUploadState(prev => ({ ...prev, status: 'uploading', progress: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', uploadState.file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response = await fetch('/api/analyze-drawing', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const result: APIResponse<DrawingAnalysis> = await response.json();

      if (result.success && result.data) {
        setUploadState(prev => ({ ...prev, status: 'success', progress: 100 }));
        setAnalysis(result.data);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));
    }
  };

  const resetAnalysis = () => {
    setUploadState({
      file: null,
      progress: 0,
      status: 'idle',
      error: undefined
    });
    setAnalysis(null);
    setCADModelData(null);
    setManufacturabilityResults([]);
    setSpecificationResults([]);
    setReportGenerated(false);
    setSampleLoadSuccess(null);
  };

  const tryWithSample = (filename: string, displayName: string) => {
    // Clear previous analysis results when loading a new sample
    setAnalysis(null);
    setManufacturabilityResults([]);
    setSpecificationResults([]);
    setReportGenerated(false);
    
    // Simulate loading a sample drawing
    setUploadState({
      file: new File(['sample'], filename, { type: 'application/pdf' }),
      progress: 0,
      status: 'idle',
      error: undefined
    });
    
    // Show success indicator
    setSampleLoadSuccess(displayName);
    setTimeout(() => setSampleLoadSuccess(null), 3000); // Hide after 3 seconds
  };

  // Convert manufacturing analysis data to UI format
  const convertManufacturingDataToUI = (modelData: CADModelData) => {
    const results: any[] = [];

    // Bounding box dimensions
    if (modelData.boundingBoxWithTolerance) {
      const bbox = modelData.boundingBoxWithTolerance;
      results.push({
        check: 'Dimensional Tolerance (AISC 303)',
        value: `±${bbox.tolerance.toFixed(3)}"`,
        requirement: 'AISC 303 Section 6',
        status: 'Valid',
        message: `Tolerance calculated for ${Math.max(bbox.length, bbox.width, bbox.height).toFixed(1)}" maximum dimension`,
      });
    }

    // Material thickness analysis
    if (modelData.thicknessAnalysis) {
      const thickness = modelData.thicknessAnalysis;
      const status = thickness.isStandardGauge ? 'Valid' : 'Warning';
      results.push({
        check: 'Material Thickness',
        value: `${thickness.estimatedThickness.toFixed(3)}"`,
        requirement: 'Standard gauge sizes',
        status: status,
        message: thickness.isStandardGauge
          ? 'Material thickness matches standard gauge'
          : 'Non-standard thickness - may require special material ordering',
        suggestion: thickness.isStandardGauge
          ? undefined
          : 'Consider using standard gauge thickness to reduce cost and lead time',
      });

      // Weld size requirements
      results.push({
        check: 'Minimum Weld Size (AISC 360 J2.4)',
        value: `${thickness.minWeldSize.toFixed(3)}"`,
        requirement: `${thickness.maxWeldSize.toFixed(3)}" max`,
        status: 'Valid',
        message: `For ${thickness.estimatedThickness.toFixed(3)}" material thickness`,
      });

      // Preheat requirements
      if (thickness.requiresPreheat) {
        results.push({
          check: 'Preheat Requirement (AWS D1.1)',
          value: 'Required',
          requirement: '>1" thickness',
          status: 'Warning',
          message: 'Material thickness requires preheating before welding',
          suggestion: 'Preheat to minimum 150°F per AWS D1.1 Table 3.2',
        });
      }
    }

    // Hole analysis
    if (modelData.holeAnalysis && modelData.holeAnalysis.count > 0) {
      const holes = modelData.holeAnalysis;

      // Non-standard sizes
      holes.nonStandardSizes.forEach((ns) => {
        results.push({
          check: `Hole #${ns.holeIndex + 1} - Standard Size`,
          value: `${ns.actual.toFixed(4)}"`,
          requirement: `Nearest: ${ns.nearest}"`,
          status: 'Warning',
          message: 'Non-standard drill size detected - requires special tooling',
          suggestion: `Consider changing to standard size ${ns.nearest}" to reduce cost`,
        });
      });

      // Edge distance violations
      holes.edgeDistances.forEach((ed) => {
        const status = ed.compliance.sheared ? 'Valid' : 'Invalid';
        if (!ed.compliance.sheared) {
          results.push({
            check: `Hole #${ed.holeIndex + 1} - Edge Distance (AISC 360 J3.4)`,
            value: `${ed.minEdgeDistance.toFixed(3)}"`,
            requirement: `${ed.compliance.requiredSheared.toFixed(3)}" (sheared)`,
            status: 'Invalid',
            message: `Edge distance too small - violates AISC 360 Table J3.4`,
            suggestion: `Increase edge distance by at least ${Math.abs(ed.compliance.margin).toFixed(3)}"`,
          });
        }
      });

      // Spacing violations
      holes.spacingViolations.forEach((sv) => {
        results.push({
          check: `Holes #${sv.hole1 + 1} & #${sv.hole2 + 1} - Spacing (AISC 360 J3.3)`,
          value: `${sv.actual.toFixed(3)}"`,
          requirement: `${sv.minimum.toFixed(3)}" minimum`,
          status: 'Invalid',
          message: 'Hole spacing violates AISC 360 Section J3.3 minimum requirements',
          suggestion: `Increase spacing to at least ${sv.preferred.toFixed(3)}" (preferred)`,
        });
      });

      // If no violations, add success message
      if (
        holes.nonStandardSizes.length === 0 &&
        holes.spacingViolations.length === 0 &&
        holes.edgeDistances.every((ed) => ed.compliance.sheared)
      ) {
        results.push({
          check: `Hole Analysis (${holes.count} holes detected)`,
          value: 'All compliant',
          requirement: 'AISC 360 J3.3, J3.4',
          status: 'Valid',
          message: 'All holes meet edge distance and spacing requirements',
        });
      }
    }

    // Edge analysis
    if (modelData.edgeAnalysis && modelData.edgeAnalysis.sharpCorners.length > 0) {
      results.push({
        check: 'Sharp Corner Detection',
        value: `${modelData.edgeAnalysis.sharpCorners.length} found`,
        requirement: '≥1/8" radius recommended',
        status: 'Warning',
        message: 'Sharp corners detected - may cause stress concentrations',
        suggestion: 'Consider adding fillet radius ≥1/8" to reduce stress concentrations',
      });
    }

    // Weld joint analysis
    if (modelData.weldJointAnalysis && modelData.weldJointAnalysis.totalJoints > 0) {
      const welds = modelData.weldJointAnalysis;
      const accessible = welds.totalJoints - welds.accessibilityIssues;
      const status = welds.accessibilityIssues === 0 ? 'Valid' : 'Warning';

      results.push({
        check: 'Weld Accessibility (AWS D1.1)',
        value: `${accessible}/${welds.totalJoints} accessible`,
        requirement: 'AWS D1.1 accessibility',
        status: status,
        message:
          welds.accessibilityIssues === 0
            ? 'All weld joints are accessible'
            : `${welds.accessibilityIssues} joint(s) may be difficult to weld`,
        suggestion:
          welds.accessibilityIssues > 0
            ? 'Consider redesign or special fixturing for inaccessible joints'
            : undefined,
      });
    }

    // Bend analysis
    if (modelData.bendAnalysis && modelData.bendAnalysis.violations > 0) {
      results.push({
        check: `Bend Radius (${modelData.bendAnalysis.materialGrade})`,
        value: `${modelData.bendAnalysis.violations} violation(s)`,
        requirement: `≥${modelData.bendAnalysis.minBendRadius.toFixed(3)}"`,
        status: 'Invalid',
        message: 'Bend radius below minimum for material grade',
        suggestion: `Increase bend radius to ≥${modelData.bendAnalysis.minBendRadius.toFixed(3)}" for ${modelData.bendAnalysis.materialGrade}`,
      });
    }

    // If no data, return message
    if (results.length === 0) {
      results.push({
        check: 'Manufacturing Analysis',
        value: 'No data',
        requirement: 'N/A',
        status: 'Warning',
        message: 'No manufacturing analysis data available for this model',
        suggestion: 'Ensure the file format supports detailed geometry analysis (e.g., STEP files)',
      });
    }

    return results;
  };

  const validateManufacturability = async () => {
    if (!cadModelData) return;

    setIsValidating(true);

    // Simulate validation process
    await new Promise(resolve => setTimeout(resolve, 1000));

    const results = convertManufacturingDataToUI(cadModelData);
    setManufacturabilityResults(results);
    setIsValidating(false);
    setActiveTab('validation');
  };

  // Convert compliance data to UI format
  const convertSpecificationDataToUI = (modelData: CADModelData) => {
    const results: any[] = [];

    // Run compliance checking
    try {
      const checker = ComplianceChecker.fromCADModel(modelData, {
        materialGrade: 'A36',
        edgeType: 'sheared',
        ambientTemp: 70,
      });

      const complianceResults = checker.checkAll();
      const report = checker.generateReport();

      // Add overall summary
      results.push({
        specification: 'Overall Compliance',
        verified: report.summary.criticalViolations === 0,
        value: report.summary.overallStatus,
        standard: 'AISC/AWS/ASTM Standards',
        status: report.summary.criticalViolations === 0 ? 'Valid' : 'Invalid',
        notes: report.summary.statusMessage,
      });

      // Add violations
      complianceResults.violations.forEach((v) => {
        results.push({
          specification: v.code,
          verified: false,
          value: v.message,
          standard: v.standard || 'Manufacturing Standard',
          status: 'Invalid',
          notes: v.recommendation || v.message,
        });
      });

      // Add warnings as specification checks
      complianceResults.warnings.forEach((w) => {
        results.push({
          specification: w.code,
          verified: true,
          value: w.message,
          standard: w.standard || 'Best Practice',
          status: 'Warning',
          notes: w.recommendation || w.message,
        });
      });

      // Add sample passes
      if (complianceResults.passes.length > 0) {
        const samplePasses = complianceResults.passes.slice(0, 3);
        samplePasses.forEach((p) => {
          results.push({
            specification: p.code,
            verified: true,
            value: 'Compliant',
            standard: p.standard || 'Manufacturing Standard',
            status: 'Valid',
            notes: p.message,
          });
        });
      }
    } catch (error) {
      console.error('Error running compliance check:', error);
      results.push({
        specification: 'Compliance Check Error',
        verified: false,
        value: 'Analysis failed',
        standard: 'N/A',
        status: 'Missing',
        notes: 'Unable to perform compliance checking on this model',
      });
    }

    // Add manufacturing data summaries
    if (modelData.holeAnalysis && modelData.holeAnalysis.count > 0) {
      results.push({
        specification: 'Hole Count',
        verified: true,
        value: `${modelData.holeAnalysis.count} holes detected`,
        standard: 'AISC 360 J3.3, J3.4',
        status: 'Valid',
        notes: 'Hole geometry extracted for compliance checking',
      });
    }

    if (modelData.thicknessAnalysis) {
      results.push({
        specification: 'Material Thickness',
        verified: modelData.thicknessAnalysis.isStandardGauge,
        value: `${modelData.thicknessAnalysis.estimatedThickness.toFixed(3)}"`,
        standard: 'Standard Gauge Sizes',
        status: modelData.thicknessAnalysis.isStandardGauge ? 'Valid' : 'Warning',
        notes: modelData.thicknessAnalysis.isStandardGauge
          ? 'Standard gauge thickness'
          : 'Non-standard thickness',
      });
    }

    if (modelData.weldJointAnalysis && modelData.weldJointAnalysis.totalJoints > 0) {
      const compliantJoints = modelData.weldJointAnalysis.joints.filter(
        (j) => j.meetsAWSRequirement
      ).length;
      results.push({
        specification: 'Weld Joint Compliance',
        verified: compliantJoints === modelData.weldJointAnalysis.totalJoints,
        value: `${compliantJoints}/${modelData.weldJointAnalysis.totalJoints} compliant`,
        standard: 'AWS D1.1',
        status:
          compliantJoints === modelData.weldJointAnalysis.totalJoints ? 'Valid' : 'Warning',
        notes:
          compliantJoints === modelData.weldJointAnalysis.totalJoints
            ? 'All joints meet AWS D1.1 requirements'
            : `${modelData.weldJointAnalysis.totalJoints - compliantJoints} joint(s) below 60° minimum angle`,
      });
    }

    if (results.length === 0) {
      results.push({
        specification: 'Specification Verification',
        verified: false,
        value: 'No data',
        standard: 'N/A',
        status: 'Missing',
        notes: 'No specification data available for verification',
      });
    }

    return results;
  };

  const verifySpecifications = async () => {
    if (!cadModelData) return;

    setIsVerifying(true);

    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 1000));

    const results = convertSpecificationDataToUI(cadModelData);
    setSpecificationResults(results);
    setIsVerifying(false);
    setActiveTab('verification');
  };

  const generateReport = async () => {
    if (!analysis) return;
    
    setIsGeneratingReport(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setReportGenerated(true);
    setIsGeneratingReport(false);
    setShowReportModal(true);
  };

  const downloadReport = (format: 'pdf' | 'txt') => {
    // Simulate download
    const content = format === 'pdf' ? 'PDF Report Content' : 'Text Report Content';
    const blob = new Blob([content], { 
      type: format === 'pdf' ? 'application/pdf' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_report_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Upload and Controls */}
      <div className="space-y-6">
        {/* File Upload Area */}
        <div className="bg-white rounded-xl shadow-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Drawing</h2>
          
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-primary bg-blue-50' 
                : uploadState.status === 'error'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              {uploadState.file ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-primary rounded-lg mx-auto flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{uploadState.file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(uploadState.file.size)}</p>
                  </div>
                  
                  {uploadState.status === 'uploading' && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadState.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">Analyzing... {uploadState.progress}%</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragActive ? 'Drop your file here' : 'Drop your CAD file here'}
                    </p>
                    <p className="text-gray-500">or click to browse</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Supports PDF, PNG, JPG, STEP, STL, OBJ, DXF up to {maxSizeInMB}MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {uploadState.status === 'error' && uploadState.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{uploadState.error}</p>
            </div>
          )}

          {/* Sample Load Success */}
          {sampleLoadSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700 text-sm font-medium">
                  Sample &quot;{sampleLoadSuccess}&quot; loaded successfully!
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={analyzeDrawing}
              disabled={!uploadState.file || uploadState.status === 'uploading'}
              isLoading={uploadState.status === 'uploading'}
              className="flex-1"
            >
              {uploadState.status === 'uploading' ? 'Analyzing...' : 'Analyze Drawing'}
            </Button>
            
            {uploadState.file && (
              <Button
                variant="outline"
                onClick={resetAnalysis}
                disabled={uploadState.status === 'uploading'}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Sample Drawings */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Try Sample Drawings</h3>
          <p className="text-gray-600 text-sm mb-4">
            Test the analyzer with our sample technical drawings to see AI recommendations.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Servo Motor Sample */}
            <div className="bg-white rounded-lg p-3 border border-blue-200 text-center hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full" 
                 onClick={() => tryWithSample('servo-motor-drawing.pdf', 'Servo Motor')}>
              <div className="mb-2">
                <img 
                  src="/images/sample-cad-preview.svg" 
                  alt="Servo Motor Drawing"
                  className="w-20 h-16 mx-auto rounded border border-gray-200"
                />
              </div>
              <div className="mb-2 flex-1 flex flex-col justify-center text-center">
                <h4 className="font-medium text-gray-900 mb-1">Servo Motor Drawing</h4>
                <p className="text-sm text-gray-600">50Nm torque, aluminum housing</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full mt-auto"
                onClick={() => tryWithSample('servo-motor-drawing.pdf', 'Servo Motor')}
              >
                Load Sample
              </Button>
            </div>

            {/* Bracket Sample */}
            <div className="bg-white rounded-lg p-3 border border-blue-200 text-center hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                 onClick={() => tryWithSample('bracket-drawing.pdf', 'Mounting Bracket')}>
              <div className="mb-2">
                <img 
                  src="/images/bracket-cad-preview.svg" 
                  alt="Bracket Drawing"
                  className="w-20 h-16 mx-auto rounded border border-gray-200"
                />
              </div>
              <div className="mb-2 flex-1 flex flex-col justify-center text-center">
                <h4 className="font-medium text-gray-900 mb-1">Mounting Bracket</h4>
                <p className="text-sm text-gray-600">Steel, 500N load capacity</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full mt-auto"
                onClick={() => tryWithSample('bracket-drawing.pdf', 'Mounting Bracket')}
              >
                Load Sample
              </Button>
            </div>

            {/* Steel Beam Sample */}
            <div className="bg-white rounded-lg p-3 border border-blue-200 text-center hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                 onClick={() => tryWithSample('steel-beam-drawing.pdf', 'I-Beam Steel')}>
              <div className="mb-2">
                <img 
                  src="/images/steel-beam-cad-preview.svg" 
                  alt="Steel Beam Drawing"
                  className="w-20 h-16 mx-auto rounded border border-gray-200"
                />
              </div>
              <div className="mb-2 flex-1 flex flex-col justify-center text-center">
                <h4 className="font-medium text-gray-900 mb-1">I-Beam Steel</h4>
                <p className="text-sm text-gray-600">200x100mm structural beam</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full mt-auto"
                onClick={() => tryWithSample('steel-beam-drawing.pdf', 'I-Beam Steel')}
              >
                Load Sample
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Analysis Results */}
      <div className="space-y-6">
        {analysis ? (
          <>
            {/* Action Buttons
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={validateManufacturability}
                  disabled={isValidating}
                  variant="outline"
                  className="flex-1"
                >
                  {isValidating ? <LoadingSpinner size="sm" /> : 'Validate Manufacturability'}
                </Button>
                <Button
                  onClick={verifySpecifications}
                  disabled={isVerifying}
                  variant="outline"
                  className="flex-1"
                >
                  {isVerifying ? <LoadingSpinner size="sm" /> : 'Verify Specifications'}
                </Button>
                <Button
                  onClick={generateReport}
                  disabled={isGeneratingReport}
                  variant="outline"
                  className="flex-1"
                >
                  {isGeneratingReport ? <LoadingSpinner size="sm" /> : 'Generate Report'}
                </Button>
              </div>
            </div> */}

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-lg border">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-6 px-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'analysis'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Analysis Results
                  </button>
                  <button
                    onClick={() => setActiveTab('validation')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'validation'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Manufacturability
                    {manufacturabilityResults.length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {manufacturabilityResults.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'verification'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Specifications
                    {specificationResults.length > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {specificationResults.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'report'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Report
                    {reportGenerated && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ready
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'analysis' && (
                  <div className="space-y-6">
                    {/* 3D Model Preview - Show for CAD file formats */}
                    {uploadState.file && ['step', 'stp', 'stl', 'obj', 'dxf', 'gltf', 'glb'].includes(
                      uploadState.file.name.split('.').pop()?.toLowerCase() || ''
                    ) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">3D Model Preview</h3>
                        <CADPreview3D
                          file={uploadState.file}
                          showStats={true}
                          onModelDataParsed={(data) => {
                            setCADModelData(data);
                            console.log('Manufacturing data received:', {
                              holes: data.holeAnalysis?.count,
                              thickness: data.thicknessAnalysis?.estimatedThickness,
                              edges: data.edgeAnalysis?.totalEdges,
                              welds: data.weldJointAnalysis?.totalJoints,
                              bends: data.bendAnalysis?.totalBends,
                            });
                          }}
                        />
                      </div>
                    )}

                    {/* Analysis Summary */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">
                            {Math.round(analysis.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {Object.entries(analysis.extractedSpecs).map(([key, value]) => (
                            value && (
                              <div key={key} className="bg-gray-50 p-3 rounded-lg">
                                <span className="font-medium text-gray-700 capitalize block">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-gray-900">{value}</span>
                              </div>
                            )
                          ))}
                        </div>
                        
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Analysis:</span> {analysis.reasoning}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Products */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Recommended Products ({analysis.totalRecommendations})
                        </h3>
                        {analysis.totalRecommendations > 3 && (
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            +{Math.max(0, analysis.totalRecommendations - 3)} more available
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mb-6 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Button 
                            onClick={() => {
                              // Store analysis data and redirect to product recommender
                              const analysisData = {
                                drawingName: uploadState.file?.name || 'Analyzed Drawing',
                                extractedSpecs: analysis.extractedSpecs,
                                confidence: analysis.confidence
                              };
                              sessionStorage.setItem('analysisForRecommendation', JSON.stringify(analysisData));
                              window.location.href = '/product-recommender?fromAnalysis=true';
                            }}
                            className="w-full"
                          >
                            Get AI Recommendations
                          </Button>
                          {analysis.recommendedProducts.length > 0 && (
                            <Button 
                              onClick={() => window.open('/catalog', '_blank')} 
                              variant="outline" 
                              className="w-full"
                            >
                              Browse All Products
                            </Button>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => {
                            // Store analysis data for RFQ
                            const rfqData = {
                              drawingName: uploadState.file?.name || 'Analyzed Drawing',
                              specifications: Object.entries(analysis.extractedSpecs)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(', '),
                              material: analysis.extractedSpecs.material || 'Steel',
                              analysisConfidence: analysis.confidence
                            };
                            sessionStorage.setItem('analysisForRFQ', JSON.stringify(rfqData));
                            window.location.href = '/rfq?fromAnalysis=true';
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Create RFQ from Analysis
                        </Button>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        {analysis.recommendedProducts.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4">
                            {analysis.recommendedProducts.slice(0, 3).map((product) => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>No specific product matches found.</p>
                            <p className="text-sm mt-1">Try browsing our catalog or submit an RFQ for custom parts.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'validation' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Manufacturability Validation</h3>
                      {manufacturabilityResults.length === 0 && (
                        <Button onClick={validateManufacturability} disabled={isValidating} size="sm">
                          {isValidating ? <LoadingSpinner size="sm" /> : 'Run Validation'}
                        </Button>
                      )}
                    </div>
                    
                    {manufacturabilityResults.length > 0 ? (
                      <div className="space-y-4">
                        {manufacturabilityResults.map((result, index) => (
                          <div 
                            key={index}
                            className={`p-4 rounded-lg border-l-4 ${
                              result.status === 'Valid' ? 'bg-green-50 border-green-500' :
                              result.status === 'Warning' ? 'bg-yellow-50 border-yellow-500' :
                              'bg-red-50 border-red-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">{result.check}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.status === 'Valid' ? 'bg-green-100 text-green-800' :
                                result.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Current Value:</span> {result.value} | 
                              <span className="font-medium ml-2">Requirement:</span> {result.requirement}
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                            {result.suggestion && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                                <div className="flex items-start">
                                  <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">Suggestion:</p>
                                    <p className="text-sm text-blue-700">{result.suggestion}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No manufacturability validation results yet.</p>
                        <p className="text-sm mt-1">Click "Validate Manufacturability" to check manufacturing feasibility.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'verification' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Specification Verification</h3>
                      {specificationResults.length === 0 && (
                        <Button onClick={verifySpecifications} disabled={isVerifying} size="sm">
                          {isVerifying ? <LoadingSpinner size="sm" /> : 'Run Verification'}
                        </Button>
                      )}
                    </div>
                    
                    {specificationResults.length > 0 ? (
                      <div className="space-y-4">
                        {specificationResults.map((result, index) => (
                          <div 
                            key={index}
                            className={`p-4 rounded-lg border ${
                              result.status === 'Valid' ? 'bg-green-50 border-green-200' :
                              result.status === 'Missing' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  result.verified ? 'bg-green-500' : 'bg-gray-400'
                                }`}>
                                  {result.verified ? (
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                <h4 className="font-medium text-gray-900">{result.specification}</h4>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.status === 'Valid' ? 'bg-green-100 text-green-800' :
                                result.status === 'Missing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                              <div>
                                <span className="font-medium text-gray-700">Current Value:</span>
                                <p className="text-gray-900">{result.value}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Standard:</span>
                                <p className="text-gray-900">{result.standard}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-700">{result.notes}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No specification verification results yet.</p>
                        <p className="text-sm mt-1">Click "Verify Specifications" to check drawing specifications against standards.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'report' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Analysis Report</h3>
                      {!reportGenerated && (
                        <Button onClick={generateReport} disabled={isGeneratingReport} size="sm">
                          {isGeneratingReport ? <LoadingSpinner size="sm" /> : 'Generate Report'}
                        </Button>
                      )}
                    </div>
                    
                    {reportGenerated ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">Report Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Drawing:</span>
                              <p className="text-gray-900">{sampleAnalysisReport.drawingName}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Status:</span>
                              <p className="text-gray-900">{sampleAnalysisReport.overallStatus}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Manufacturability:</span>
                              <p className="text-gray-900">{sampleAnalysisReport.manufacturability}%</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Cost Estimate:</span>
                              <p className="text-gray-900">{sampleAnalysisReport.costEstimate}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {sampleAnalysisReport.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button onClick={() => downloadReport('pdf')} className="flex-1">
                            Download PDF
                          </Button>
                          <Button onClick={() => downloadReport('txt')} variant="outline" className="flex-1">
                            Download Text
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No report generated yet.</p>
                        <p className="text-sm mt-1">Click "Generate Report" to create a detailed analysis report.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Analysis</h3>
            <p className="text-gray-600">
              Upload a technical drawing or try one of our sample drawings to get started with AI-powered product recommendations.
            </p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Analysis Report Generated">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h4 className="font-medium text-green-900">Report Ready!</h4>
              <p className="text-sm text-green-700">Your detailed analysis report has been generated successfully.</p>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>The report includes:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Manufacturability assessment</li>
              <li>• Cost estimates and lead times</li>
              <li>• Technical specifications</li>
              <li>• Recommendations for optimization</li>
            </ul>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button onClick={() => downloadReport('pdf')} className="flex-1">
              Download PDF
            </Button>
            <Button onClick={() => downloadReport('txt')} variant="outline" className="flex-1">
              Download Text
            </Button>
          </div>
          
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReportModal(false);
                setActiveTab('report');
              }}
              className="text-sm"
            >
              View Report Details
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CADAnalyzerFull;