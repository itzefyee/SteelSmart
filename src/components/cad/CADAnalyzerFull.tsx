'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/products/ProductCard';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import CADPreview3D from '@/components/cad/CADPreview3D';
import CAD2DViewExtractor from '@/components/cad/CAD2DViewExtractor';
import { DrawingAnalysis, FileUploadState, APIResponse } from '@/types';
import { formatFileSize } from '@/lib/utils';
import { CADModelData, getCADParser } from '@/lib/cad-parser';
import { ComplianceChecker, convertCADModelToGeometry } from '@/lib/compliance-checker';
import { useToast } from '@/components/ui/ToastProvider';

type KeyFinding = {
  title: string;
  status: 'Valid' | 'Warning' | 'Invalid';
  message: string;
  detail?: string;
  suggestion?: string;
};

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
  const [reportTimestamp, setReportTimestamp] = useState<string | null>(null);
  const [isAnalyzingManufacturing, setIsAnalyzingManufacturing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { addToast } = useToast();

  const clearPreviewCache = useCallback(() => {
    setCADModelData(null);
    setManufacturabilityResults([]);
    setSpecificationResults([]);
    setReportGenerated(false);
    setReportTimestamp(null);

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('cadFileToAnalyze');
      sessionStorage.removeItem('cadAnalysisResult');
    }
  }, []);

  // Check for stored analysis results or file to analyze on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for stored analysis results
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
    
    // Check for file to auto-analyze
    if (urlParams.get('autoAnalyze') === 'true') {
      const storedFile = sessionStorage.getItem('cadFileToAnalyze');
      if (storedFile) {
        try {
          const fileData = JSON.parse(storedFile);
          
          // Convert base64 data to File object
          let base64Data = fileData.data;
          if (base64Data.startsWith('data:')) {
            const parts = base64Data.split(',');
            base64Data = parts.length > 1 ? parts[1] : base64Data.replace(/^data:.*;base64,/, '');
          }
          
          // Decode base64 to binary
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Determine MIME type
          const mimeTypes: Record<string, string> = {
            'step': 'application/step',
            'stp': 'application/step',
            'stl': 'model/stl',
            'obj': 'model/obj',
            'dxf': 'application/dxf',
            'gltf': 'model/gltf+json',
            'glb': 'model/gltf-binary',
          };
          
          const mimeType = mimeTypes[fileData.type.toLowerCase()] || 'application/octet-stream';
          
          // Create File object
          const file = new File([bytes], fileData.name, { type: mimeType });
          
          // Set the file in upload state
          setUploadState({
            file,
            progress: 0,
            status: 'idle',
            error: undefined
          });
          
          // Clear the stored file
          sessionStorage.removeItem('cadFileToAnalyze');
          
          // Clean up URL
          window.history.replaceState({}, '', '/cad-analyzer');
          
          // Show success message
          setSampleLoadSuccess('File loaded from CAD Generator. Click "Analyze Drawing" to proceed.');
          
        } catch (error) {
          console.error('Error loading file from storage:', error);
          sessionStorage.removeItem('cadFileToAnalyze');
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
      clearPreviewCache();
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
  }, [clearPreviewCache]);

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

      // Include CAD model data if available (for enhanced analysis)
      if (cadModelData) {
        // Create a clean copy without internal data to reduce payload size
        const cleanedCADData = {
          boundingBox: cadModelData.boundingBox,
          boundingBoxWithTolerance: cadModelData.boundingBoxWithTolerance,
          faceCount: cadModelData.faces,
          edgeCount: cadModelData.edges,
          vertexCount: cadModelData.vertices_count,
          holeAnalysis: cadModelData.holeAnalysis,
          thicknessAnalysis: cadModelData.thicknessAnalysis,
          edgeAnalysis: cadModelData.edgeAnalysis,
          weldJointAnalysis: cadModelData.weldJointAnalysis,
          bendAnalysis: cadModelData.bendAnalysis,
        };
        formData.append('cadModelData', JSON.stringify(cleanedCADData));
      }

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
        addToast({
          type: 'success',
          title: 'Drawing analyzed successfully'
        });
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));
      addToast({
        type: 'error',
        title: 'Analysis failed'
      });
    }
  };

  const resetAnalysis = () => {
    clearPreviewCache();
    setUploadState({
      file: null,
      progress: 0,
      status: 'idle',
      error: undefined
    });
    setAnalysis(null);
    setSampleLoadSuccess(null);
  };

  const tryWithSample = (filename: string, displayName: string) => {
    // Clear previous analysis results when loading a new sample
    clearPreviewCache();
    setAnalysis(null);
    
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
    addToast({
      type: 'info',
      title: `Sample loaded: ${displayName}`
    });
  };

  // Generate manufacturing validation results from CAD model data
  // Note: Manufacturing analysis now happens automatically during STEP parsing
  const runManufacturingAnalysis = async () => {
    if (!cadModelData) {
      console.warn('No CAD model data available for analysis');
      return;
    }

    setIsAnalyzingManufacturing(true);
    setAnalysisProgress(0);

    try {
      // Show progress stages (cosmetic, analysis already done during parsing)
      setAnalysisStage('Preparing analysis...');
      setAnalysisProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));

      setAnalysisStage('Generating validation results...');
      setAnalysisProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate results for both tabs from already-analyzed data
      const mfgResults = convertManufacturingDataToUI(cadModelData);
      const specResults = convertSpecificationDataToUI(cadModelData);

      setAnalysisProgress(80);
      await new Promise(resolve => setTimeout(resolve, 200));

      setManufacturabilityResults(mfgResults);
      setSpecificationResults(specResults);

      setAnalysisStage('Analysis complete!');
      setAnalysisProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      addToast({
        type: 'success',
        title: 'Manufacturing analysis complete'
      });

      console.log('Manufacturing validation results generated:', {
        manufacturability: mfgResults.length,
        specifications: specResults.length,
        holes: cadModelData.holeAnalysis?.count || 0,
        thickness: cadModelData.thicknessAnalysis?.estimatedThickness || 0,
        welds: cadModelData.weldJointAnalysis?.totalJoints || 0
      });

    } catch (error) {
      console.error('Error generating manufacturing validation:', error);
      setAnalysisStage('Analysis failed');
      addToast({
        type: 'error',
        title: 'Manufacturing analysis failed'
      });

      // Set error messages
      setManufacturabilityResults([
        {
          check: 'Manufacturing Analysis Error',
          value: 'Failed',
          requirement: 'N/A',
          status: 'Invalid',
          message: 'Unable to generate validation results. ' + (error instanceof Error ? error.message : 'Unknown error'),
        },
      ]);
    } finally {
      setIsAnalyzingManufacturing(false);
      setAnalysisStage(null);
      setAnalysisProgress(0);
    }
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

  const validateManufacturability = () => {
    // Simply switch to validation tab
    // Analysis must be run explicitly via the button
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

  const verifySpecifications = () => {
    // Simply switch to verification tab
    // Analysis must be run explicitly via the button
    setActiveTab('verification');
  };

  const generateComprehensiveReport = () => {
    const timestamp = new Date().toLocaleString();
    const fileName = uploadState.file?.name || 'Unknown File';

    let report = '';

    // Header
    report += '═══════════════════════════════════════════════════════════════\n';
    report += '              CAD MODEL ANALYSIS REPORT\n';
    report += '═══════════════════════════════════════════════════════════════\n\n';
    report += `File Name: ${fileName}\n`;
    report += `Analysis Date: ${timestamp}\n`;
    report += `Analysis ID: ${analysis?.analysisId || 'N/A'}\n\n`;

    // 1. Executive Summary
    report += '───────────────────────────────────────────────────────────────\n';
    report += '1. EXECUTIVE SUMMARY\n';
    report += '───────────────────────────────────────────────────────────────\n\n';

    if (analysis) {
      report += `Confidence Level: ${Math.round(analysis.confidence * 100)}%\n`;
      report += `Component Type: ${analysis.extractedSpecs.componentType || 'Not specified'}\n`;
      report += `Analysis: ${analysis.reasoning}\n\n`;
    }

    // Overall status
    const totalChecks = manufacturabilityResults.length + specificationResults.length;
    const validChecks = [
      ...manufacturabilityResults.filter(r => r.status === 'Valid'),
      ...specificationResults.filter(r => r.status === 'Valid')
    ].length;
    const warningChecks = [
      ...manufacturabilityResults.filter(r => r.status === 'Warning'),
      ...specificationResults.filter(r => r.status === 'Warning' || r.status === 'Missing')
    ].length;
    const invalidChecks = [
      ...manufacturabilityResults.filter(r => r.status === 'Invalid'),
      ...specificationResults.filter(r => r.status === 'Invalid')
    ].length;

    report += `Overall Status: ${invalidChecks === 0 ? (warningChecks === 0 ? 'PASS' : 'PASS WITH WARNINGS') : 'FAIL'}\n`;
    report += `Total Checks: ${totalChecks}\n`;
    report += `  ✓ Valid: ${validChecks}\n`;
    report += `  ⚠ Warnings: ${warningChecks}\n`;
    report += `  ✗ Issues: ${invalidChecks}\n\n`;

    // 2. Technical Specifications
    report += '───────────────────────────────────────────────────────────────\n';
    report += '2. TECHNICAL SPECIFICATIONS\n';
    report += '───────────────────────────────────────────────────────────────\n\n';

    if (analysis?.extractedSpecs) {
      const specs = analysis.extractedSpecs;
      if (specs.dimensions) report += `Dimensions: ${specs.dimensions}\n`;
      if (specs.material) report += `Material: ${specs.material}\n`;
      if (specs.tolerance) report += `Tolerance: ${specs.tolerance}\n`;
      if (specs.loadRequirements) report += `Load Requirements: ${specs.loadRequirements}\n`;
      report += '\n';
    }

    if (cadModelData?.boundingBox) {
      const bbox = cadModelData.boundingBox;
      const length = bbox.max.x - bbox.min.x;
      const width = bbox.max.y - bbox.min.y;
      const height = bbox.max.z - bbox.min.z;
      const volume = length * width * height;
      
      report += `Bounding Box:\n`;
      report += `  Length: ${length.toFixed(3)}" (${(length * 25.4).toFixed(1)}mm)\n`;
      report += `  Width: ${width.toFixed(3)}" (${(width * 25.4).toFixed(1)}mm)\n`;
      report += `  Height: ${height.toFixed(3)}" (${(height * 25.4).toFixed(1)}mm)\n`;
      report += `  Volume: ${volume.toFixed(2)} cubic inches\n`;
      report += '\n';
    }

    if (cadModelData) {
      report += `Geometry Complexity:\n`;
      if (cadModelData.faces) report += `  Faces: ${cadModelData.faces}\n`;
      if (cadModelData.edges) report += `  Edges: ${cadModelData.edges}\n`;
      if (cadModelData.vertices_count) report += `  Vertices: ${cadModelData.vertices_count}\n`;
      report += '\n';
    }

    // 3. Manufacturing Analysis
    if (manufacturabilityResults.length > 0) {
      report += '───────────────────────────────────────────────────────────────\n';
      report += '3. MANUFACTURABILITY VALIDATION\n';
      report += '───────────────────────────────────────────────────────────────\n\n';

      manufacturabilityResults.forEach((result, index) => {
        const icon = result.status === 'Valid' ? '✓' : result.status === 'Warning' ? '⚠' : '✗';
        report += `${index + 1}. ${icon} ${result.check}\n`;
        report += `   Status: ${result.status}\n`;
        report += `   Current: ${result.value}\n`;
        report += `   Required: ${result.requirement}\n`;
        report += `   ${result.message}\n`;
        if (result.suggestion) {
          report += `   Suggestion: ${result.suggestion}\n`;
        }
        report += '\n';
      });
    }

    // 4. Specification Verification
    if (specificationResults.length > 0) {
      report += '───────────────────────────────────────────────────────────────\n';
      report += '4. SPECIFICATION VERIFICATION\n';
      report += '───────────────────────────────────────────────────────────────\n\n';

      specificationResults.forEach((result, index) => {
        const icon = result.verified ? '✓' : '✗';
        report += `${index + 1}. ${icon} ${result.specification}\n`;
        report += `   Status: ${result.status}\n`;
        report += `   Standard: ${result.standard}\n`;
        report += `   Value: ${result.value}\n`;
        report += `   Notes: ${result.notes}\n\n`;
      });
    }

    // 5. Detailed Features
    report += '───────────────────────────────────────────────────────────────\n';
    report += '5. DETAILED FEATURE ANALYSIS\n';
    report += '───────────────────────────────────────────────────────────────\n\n';

    if (cadModelData?.holeAnalysis && cadModelData.holeAnalysis.count > 0) {
      const holes = cadModelData.holeAnalysis;
      report += `Hole Analysis (${holes.count} holes detected):\n`;
      holes.holes?.forEach((hole, idx) => {
        report += `  Hole #${idx + 1}:\n`;
        if (hole.diameter != null) report += `    Diameter: ${hole.diameter.toFixed(4)}"\n`;
        report += `    Standard Size: ${hole.isStandardSize ? 'Yes' : 'No'}\n`;
        if (hole.center?.x != null && hole.center?.y != null && hole.center?.z != null) {
          report += `    Center: (${hole.center.x.toFixed(2)}, ${hole.center.y.toFixed(2)}, ${hole.center.z.toFixed(2)})\n`;
        }
      });
      if (holes.nonStandardSizes?.length > 0) {
        report += `  Non-Standard Sizes: ${holes.nonStandardSizes.length}\n`;
      }
      if (holes.spacingViolations?.length > 0) {
        report += `  Spacing Violations: ${holes.spacingViolations.length}\n`;
      }
      report += '\n';
    }

    if (cadModelData?.thicknessAnalysis) {
      const thickness = cadModelData.thicknessAnalysis;
      report += `Material Thickness Analysis:\n`;
      if (thickness.estimatedThickness != null) report += `  Estimated Thickness: ${thickness.estimatedThickness.toFixed(3)}"\n`;
      report += `  Standard Gauge: ${thickness.isStandardGauge ? 'Yes' : 'No'}\n`;
      if (thickness.minWeldSize != null) report += `  Min Weld Size (AISC 360 J2.4): ${thickness.minWeldSize.toFixed(3)}"\n`;
      if (thickness.maxWeldSize != null) report += `  Max Weld Size: ${thickness.maxWeldSize.toFixed(3)}"\n`;
      report += `  Preheat Required (AWS D1.1): ${thickness.requiresPreheat ? 'Yes' : 'No'}\n\n`;
    }

    if (cadModelData?.edgeAnalysis) {
      const edges = cadModelData.edgeAnalysis;
      report += `Edge Analysis:\n`;
      report += `  Total Edges: ${edges.totalEdges}\n`;
      if (edges.sharpCorners?.length > 0) {
        report += `  Sharp Corners Detected: ${edges.sharpCorners.length}\n`;
        edges.sharpCorners.forEach((corner, idx) => {
          if (corner.radius != null) {
            report += `    Corner #${idx + 1}: Radius ${corner.radius.toFixed(4)}" - ${corner.warning || 'N/A'}\n`;
          }
        });
      }
      report += '\n';
    }

    if (cadModelData?.weldJointAnalysis && cadModelData.weldJointAnalysis.totalJoints > 0) {
      const welds = cadModelData.weldJointAnalysis;
      report += `Weld Joint Analysis:\n`;
      report += `  Total Joints: ${welds.totalJoints}\n`;
      report += `  Accessibility Issues: ${welds.accessibilityIssues}\n`;
      const compliantJoints = welds.joints?.filter(j => j.meetsAWSRequirement).length || 0;
      report += `  AWS D1.1 Compliant: ${compliantJoints}/${welds.totalJoints}\n\n`;
    }

    if (cadModelData?.bendAnalysis && cadModelData.bendAnalysis.totalBends > 0) {
      const bends = cadModelData.bendAnalysis;
      report += `Bend Analysis:\n`;
      report += `  Total Bends: ${bends.totalBends}\n`;
      if (bends.materialGrade) report += `  Material Grade: ${bends.materialGrade}\n`;
      if (bends.minBendRadius != null) report += `  Min Bend Radius: ${bends.minBendRadius.toFixed(3)}"\n`;
      report += `  Violations: ${bends.violations || 0}\n\n`;
    }

    // 6. Recommendations
    report += '───────────────────────────────────────────────────────────────\n';
    report += '6. RECOMMENDATIONS\n';
    report += '───────────────────────────────────────────────────────────────\n\n';

    const suggestions = [
      ...manufacturabilityResults.filter(r => r.suggestion).map(r => r.suggestion),
      ...specificationResults.filter(r => r.status === 'Invalid' || r.status === 'Warning').map(r => r.notes)
    ];

    if (suggestions.length > 0) {
      suggestions.forEach((suggestion, index) => {
        report += `${index + 1}. ${suggestion}\n`;
      });
    } else {
      report += 'No critical recommendations. Component meets all requirements.\n';
    }

    report += '\n';

    // 7. Compliance Summary
    report += '───────────────────────────────────────────────────────────────\n';
    report += '7. COMPLIANCE SUMMARY\n';
    report += '───────────────────────────────────────────────────────────────\n\n';

    report += 'Standards Referenced:\n';
    report += '  - AISC 303: Dimensional Tolerances\n';
    report += '  - AISC 360: Structural Steel Specifications\n';
    report += '  - AWS D1.1: Structural Welding Code\n';
    report += '  - ASTM: Material Standards\n\n';

    if (invalidChecks === 0) {
      report += 'CONCLUSION: Component is COMPLIANT with all checked standards.\n';
    } else {
      report += `CONCLUSION: Component has ${invalidChecks} CRITICAL ISSUE(S) that must be addressed.\n`;
    }

    report += '\n';
    report += '═══════════════════════════════════════════════════════════════\n';
    report += '                    END OF REPORT\n';
    report += '═══════════════════════════════════════════════════════════════\n';

    return report;
  };

  const buildStyledReportHtml = () => {
    const specEntries = Object.entries(analysis?.extractedSpecs || {}).filter(([, value]) => value);
    const manufacturingCards = manufacturabilityResults.map((result) => {
      const tone =
        result.status === 'Valid'
          ? 'border: 1px solid #a7f3d0; background: #ecfdf5;'
          : result.status === 'Warning'
            ? 'border: 1px solid #fef08a; background: #fffbeb;'
            : 'border: 1px solid #fecaca; background: #fef2f2;';
      return `
        <div class="card" style="${tone}">
          <div class="card-title">${result.check}</div>
          <p class="muted">${result.message || ''}</p>
          <p class="detail"><strong>Value:</strong> ${result.value} · <strong>Requirement:</strong> ${result.requirement}</p>
          ${result.suggestion ? `<div class="pill-outline">Suggestion: ${result.suggestion}</div>` : ''}
        </div>
      `;
    });

    const specificationCards = specificationResults.map((result) => {
      const tone =
        result.status === 'Valid'
          ? 'border: 1px solid #a7f3d0; background: #ecfdf5;'
          : result.status === 'Missing'
            ? 'border: 1px solid #fde68a; background: #fffbeb;'
            : 'border: 1px solid #fecaca; background: #fef2f2;';
      return `
        <div class="card" style="${tone}">
          <div class="card-title">${result.specification}</div>
          <p class="muted">${result.notes || result.value}</p>
          <p class="detail"><strong>Standard:</strong> ${result.standard} · <strong>Status:</strong> ${result.status}</p>
        </div>
      `;
    });

    const recommendationsList = recommendationList
      .map((item, idx) => `<li><span class="index">${idx + 1}.</span> ${item}</li>`)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>CAD Analysis Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 0;
              padding: 32px;
              background: #0f172a;
              color: #0f172a;
            }
            .report {
              max-width: 900px;
              margin: 0 auto;
              background: #f8fafc;
              border-radius: 24px;
              padding: 32px 40px;
              box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 32px;
            }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 6px 12px;
              border-radius: 999px;
              background: rgba(59, 130, 246, 0.12);
              color: #1d4ed8;
              font-size: 12px;
              font-weight: 600;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 12px;
              color: #0f172a;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 16px;
            }
            .card {
              border-radius: 16px;
              padding: 18px;
              background: white;
            }
            .card-title {
              font-weight: 600;
              margin-bottom: 6px;
            }
            .muted {
              color: #475569;
              font-size: 14px;
            }
            .detail {
              font-size: 13px;
              color: #334155;
              margin-top: 8px;
            }
            .pill-outline {
              display: inline-block;
              margin-top: 10px;
              padding: 6px 10px;
              border-radius: 999px;
              border: 1px solid rgba(15, 23, 42, 0.2);
              font-size: 12px;
            }
            ul {
              padding-left: 18px;
              color: #475569;
              font-size: 14px;
            }
            li {
              margin-bottom: 8px;
              display: flex;
              gap: 8px;
            }
            .index {
              font-weight: 600;
              color: #0f172a;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            .table th, .table td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
              text-align: left;
            }
            .table th {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <div>
                <div class="badge">SteelSmart CAD Report</div>
                <h1 style="margin: 12px 0 8px; font-size: 28px; color: #0f172a;">${analysis?.analysisId || 'Analysis Report'}</h1>
                <p style="color: #475569; font-size: 14px;">Generated ${reportTimestamp || new Date().toLocaleString()}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 13px; color: #64748b;">Confidence</p>
                <p style="margin: 4px 0 0; font-size: 26px; font-weight: 700; color: #16a34a;">
                  ${analysis ? `${Math.round(analysis.confidence * 100)}%` : '—'}
                </p>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Technical Specifications</div>
              <table class="table">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    specEntries.length
                      ? specEntries.map(
                          ([key, value]) => `
                            <tr>
                              <td>${key.replace(/([A-Z])/g, ' $1').trim()}</td>
                              <td>${value}</td>
                            </tr>
                          `
                        ).join('')
                      : '<tr><td colspan="2">No extracted specifications.</td></tr>'
                  }
                </tbody>
              </table>
            </div>

            <div class="section" style="margin-top: 28px;">
              <div class="section-title">Manufacturability Checks</div>
              <div class="grid">
                ${manufacturingCards.join('')}
              </div>
            </div>

            <div class="section" style="margin-top: 28px;">
              <div class="section-title">Specification Verification</div>
              <div class="grid">
                ${specificationCards.join('')}
              </div>
            </div>

            <div class="section" style="margin-top: 28px;">
              <div class="section-title">Recommendations</div>
              <ul>
                ${recommendationsList || '<li>No critical recommendations. Component is production-ready.</li>'}
              </ul>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generateReport = async () => {
    if (!analysis && !cadModelData) return;

    setIsGeneratingReport(true);

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    setReportGenerated(true);
    setReportTimestamp(new Date().toLocaleString());
    setIsGeneratingReport(false);
    setShowReportModal(true);
    addToast({
      type: 'success',
      title: 'Report generated successfully'
    });
  };

  const downloadReport = (format: 'pdf' | 'txt') => {
    const reportContent = generateComprehensiveReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = uploadState.file?.name.split('.')[0] || 'analysis';

    if (format === 'txt') {
      // Download as text file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_report_${timestamp}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Download as PDF (styled HTML -> print)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(buildStyledReportHtml());
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  const reportSummary = useMemo(() => {
    const totalChecks = manufacturabilityResults.length + specificationResults.length;
    const invalid = manufacturabilityResults.filter(r => r.status === 'Invalid').length +
      specificationResults.filter(r => r.status === 'Invalid').length;
    const warnings = manufacturabilityResults.filter(r => r.status === 'Warning').length +
      specificationResults.filter(r => r.status === 'Warning' || r.status === 'Missing').length;
    const passes = Math.max(0, totalChecks - invalid - warnings);

    const statusLabel = invalid > 0 ? 'Needs Attention' : warnings > 0 ? 'Review Warnings' : 'Production Ready';
    const statusDescription = invalid > 0
      ? 'Resolve blocking compliance issues before releasing to manufacturing.'
      : warnings > 0
        ? 'Minor advisories detected. Review before final approval.'
        : 'All checks passed. Ready for procurement.';

    const tone = invalid > 0
      ? { badge: 'bg-red-50 text-red-700 border-red-100', accent: 'text-red-600', chip: 'bg-red-100 text-red-800' }
      : warnings > 0
        ? { badge: 'bg-amber-50 text-amber-700 border-amber-100', accent: 'text-amber-600', chip: 'bg-amber-100 text-amber-800' }
        : { badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', accent: 'text-emerald-600', chip: 'bg-emerald-100 text-emerald-800' };

    return {
      totalChecks,
      invalid,
      warnings,
      passes,
      statusLabel,
      statusDescription,
      tone,
    };
  }, [manufacturabilityResults, specificationResults]);

  const technicalSnapshot = useMemo(() => {
    const snapshot: { label: string; value: string; helper?: string }[] = [];

    if (analysis?.extractedSpecs?.dimensions) {
      snapshot.push({ label: 'Dimensions', value: analysis.extractedSpecs.dimensions });
    }
    if (analysis?.extractedSpecs?.material) {
      snapshot.push({ label: 'Material', value: analysis.extractedSpecs.material });
    }
    if (analysis?.extractedSpecs?.tolerance) {
      snapshot.push({ label: 'Tolerance', value: analysis.extractedSpecs.tolerance });
    }
    if (analysis?.extractedSpecs?.loadRequirements) {
      snapshot.push({ label: 'Load Requirements', value: analysis.extractedSpecs.loadRequirements });
    }
    if (cadModelData?.holeAnalysis?.count) {
      snapshot.push({
        label: 'Detected Holes',
        value: `${cadModelData.holeAnalysis.count}`,
        helper: 'Extracted for spacing + compliance checks',
      });
    }
    if (cadModelData?.weldJointAnalysis?.totalJoints) {
      snapshot.push({
        label: 'Weld Joints',
        value: `${cadModelData.weldJointAnalysis.totalJoints}`,
        helper: `${cadModelData.weldJointAnalysis.accessibilityIssues || 0} flagged for access`,
      });
    }
    if (cadModelData?.boundingBox) {
      const length = ((cadModelData.boundingBox.max.x - cadModelData.boundingBox.min.x) * 25.4).toFixed(1);
      const width = ((cadModelData.boundingBox.max.y - cadModelData.boundingBox.min.y) * 25.4).toFixed(1);
      const height = ((cadModelData.boundingBox.max.z - cadModelData.boundingBox.min.z) * 25.4).toFixed(1);
      snapshot.push({ label: 'Bounding Box (mm)', value: `${length} × ${width} × ${height}` });
    }

    return snapshot.slice(0, 6);
  }, [analysis, cadModelData]);

  const standardBadges = useMemo(() => ([
    { label: 'AISC 303', description: 'Dimensional tolerances' },
    { label: 'AISC 360', description: 'Structural steel spec' },
    { label: 'AWS D1.1', description: 'Welding compliance' },
    { label: 'ASTM', description: 'Material standards' },
  ]), []);

  const keyFindings = useMemo<KeyFinding[]>(() => {
    const issues: KeyFinding[] = [
      ...manufacturabilityResults
        .filter((result) => result.status === 'Warning' || result.status === 'Invalid')
        .map((result) => ({
          title: result.check,
          status: result.status,
          message: result.message,
          detail: `${result.value} • Req: ${result.requirement}`,
          suggestion: result.suggestion,
        })),
      ...specificationResults
        .filter((result) => result.status === 'Warning' || result.status === 'Invalid' || result.status === 'Missing')
        .map((result) => ({
          title: result.specification,
          status: result.status === 'Missing' ? 'Warning' : result.status,
          message: result.notes || result.value,
          detail: result.standard,
        })),
    ];

    if (issues.length === 0) {
      return [{
        title: 'All checks passed',
        status: 'Valid',
        message: 'No warnings or blocking issues detected in manufacturability or specifications.',
        detail: 'Full compliance achieved',
      }];
    }

    return issues.slice(0, 4);
  }, [manufacturabilityResults, specificationResults]);

  const recommendationList = useMemo(() => {
    const manufacturingSuggestions = manufacturabilityResults
      .filter((result) => result.suggestion)
      .map((result) => result.suggestion as string);

    const specificationNotes = specificationResults
      .filter((result) => result.status === 'Invalid' || result.status === 'Warning')
      .map((result) => result.notes || result.value)
      .filter(Boolean) as string[];

    const combined = [...manufacturingSuggestions, ...specificationNotes];

    if (combined.length === 0) {
      return ['Maintain current configuration — all standards satisfied.'];
    }

    return combined.slice(0, 5);
  }, [manufacturabilityResults, specificationResults]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column - Upload and Controls - 40% width on desktop */}
      <div className="w-full lg:w-[40%] space-y-6">
        {/* File Upload Area */}
        <div className="glass-container glass-container-with-liquid p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Drawing</h2>
          
          <div
            {...getRootProps()}
            className={`
              glass-upload-zone p-8 text-center cursor-pointer
              ${isDragActive 
                ? 'border-primary bg-blue-50' 
                : uploadState.status === 'error'
                ? 'border-red-300 bg-red-50'
                : ''
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
        <div className="glass-container glass-container-with-liquid p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Try Sample Drawings</h3>
          <p className="text-gray-600 text-xs mb-3">
            Test with sample drawings.
          </p>
          
          <div className="space-y-2">
            {/* Servo Motor Sample */}
            <div className="glass-card-compact hover:shadow-md transition-shadow cursor-pointer flex items-center gap-2" 
                 onClick={() => tryWithSample('servo-motor-drawing.pdf', 'Servo Motor')}>
              <div className="flex-shrink-0">
                <img 
                  src="/images/sample-cad-preview.svg" 
                  alt="Servo Motor Drawing"
                  className="w-10 h-8 rounded border border-gray-200"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-xs truncate">Servo Motor</h4>
                <p className="text-xs text-gray-500 truncate">50Nm torque</p>
              </div>
            </div>

            {/* Bracket Sample */}
            <div className="glass-card-compact hover:shadow-md transition-shadow cursor-pointer flex items-center gap-2"
                 onClick={() => tryWithSample('bracket-drawing.pdf', 'Mounting Bracket')}>
              <div className="flex-shrink-0">
                <img 
                  src="/images/bracket-cad-preview.svg" 
                  alt="Bracket Drawing"
                  className="w-10 h-8 rounded border border-gray-200"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-xs truncate">Mounting Bracket</h4>
                <p className="text-xs text-gray-500 truncate">500N load capacity</p>
              </div>
            </div>

            {/* Steel Beam Sample */}
            <div className="glass-card-compact hover:shadow-md transition-shadow cursor-pointer flex items-center gap-2"
                 onClick={() => tryWithSample('steel-beam-drawing.pdf', 'I-Beam Steel')}>
              <div className="flex-shrink-0">
                <img 
                  src="/images/steel-beam-cad-preview.svg" 
                  alt="Steel Beam Drawing"
                  className="w-10 h-8 rounded border border-gray-200"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-xs truncate">I-Beam Steel</h4>
                <p className="text-xs text-gray-500 truncate">200x100mm beam</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Analysis Results - 60% width on desktop for wider 3D preview */}
      <div className="w-full lg:w-[60%] space-y-6">
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
            <div className="glass-container glass-container-with-liquid">
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
                      <div className="glass-container glass-container-with-liquid p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">3D Model Preview</h3>
                        <CADPreview3D
                          file={uploadState.file}
                          modelData={cadModelData || undefined}
                          showStats={true}
                          className="!h-[350px] md:!h-[400px]"
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

                    {/* 2D View Extraction - Show for CAD file formats */}
                    {uploadState.file && ['step', 'stp', 'stl', 'obj', 'dxf', 'gltf', 'glb'].includes(
                      uploadState.file.name.split('.').pop()?.toLowerCase() || ''
                    ) && (
                      <CAD2DViewExtractor
                        cadModelData={cadModelData}
                        fileName={uploadState.file.name.split('.')[0]}
                        onAnalysisComplete={(result) => {
                          // Update the main analysis with AI results from multi-view analysis
                          setAnalysis({
                            extractedSpecs: result.extractedSpecs || {},
                            recommendedProducts: analysis?.recommendedProducts || [],
                            totalRecommendations: analysis?.totalRecommendations || 0,
                            confidence: result.confidence || 0,
                            reasoning: result.reasoning || '',
                            analysisId: `multiview_${Date.now()}`,
                          });
                          
                          // Show success message
                          setSampleLoadSuccess('Multi-view AI analysis complete! Results updated.');
                          setTimeout(() => setSampleLoadSuccess(null), 5000);
                        }}
                      />
                    )}

                    {/* Manufacturing Analysis Control - For CAD files */}
                    {uploadState.file && ['step', 'stp', 'stl', 'obj', 'dxf', 'gltf', 'glb'].includes(
                      uploadState.file.name.split('.').pop()?.toLowerCase() || ''
                    ) && cadModelData && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Manufacturing Analysis
                            </h3>
                            <p className="text-sm text-gray-600">
                              {manufacturabilityResults.length > 0
                                ? 'Analysis complete! View results in Manufacturability and Specifications tabs.'
                                : 'Run detailed manufacturing analysis to check dimensions, holes, welds, and compliance.'}
                            </p>
                          </div>
                          {manufacturabilityResults.length > 0 && (
                            <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-medium text-green-800">Complete</span>
                            </div>
                          )}
                        </div>

                        {isAnalyzingManufacturing ? (
                          <div className="space-y-4">
                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700">{analysisStage}</span>
                                <span className="text-gray-600">{analysisProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${analysisProgress}%` }}
                                >
                                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                                </div>
                              </div>
                            </div>

                            {/* Stage Indicators */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              {[
                                { name: 'Geometry', progress: 20 },
                                { name: 'Holes', progress: 50 },
                                { name: 'Thickness', progress: 60 },
                                { name: 'Edges', progress: 70 },
                                { name: 'Welds', progress: 80 },
                                { name: 'Bends', progress: 90 },
                                { name: 'Validate', progress: 100 }
                              ].map((stage) => (
                                <div
                                  key={stage.name}
                                  className={`flex items-center space-x-2 px-2 py-1 rounded ${
                                    analysisProgress >= stage.progress
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {analysisProgress >= stage.progress ? (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <div className="w-3 h-3 border-2 border-current rounded-full"></div>
                                  )}
                                  <span className="font-medium">{stage.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : manufacturabilityResults.length > 0 ? (
                          <div className="flex items-center space-x-3">
                            <Button
                              onClick={runManufacturingAnalysis}
                              variant="outline"
                              size="sm"
                            >
                              Re-run Analysis
                            </Button>
                            <Button
                              onClick={() => setActiveTab('validation')}
                              size="sm"
                            >
                              View Manufacturability Results
                            </Button>
                            <Button
                              onClick={() => setActiveTab('verification')}
                              size="sm"
                              variant="outline"
                            >
                              View Specifications
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Button
                              onClick={runManufacturingAnalysis}
                              size="lg"
                              className="flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              <span>Run Manufacturing Analysis</span>
                            </Button>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Checks:</span> Dimensions, Holes, Edges, Welds, Bends, Compliance
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Analysis Summary */}
                    <div className="glass-card p-6">
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
                          {Object.entries(analysis.extractedSpecs).map(([key, value]) => {
                            // Skip if no value
                            if (!value) return null;
                            
                            // Handle nested objects (like features)
                            const displayValue = typeof value === 'object' && value !== null
                              ? Object.entries(value)
                                  .filter(([, v]) => v)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(', ')
                              : String(value);
                            
                            return displayValue ? (
                              <div key={key} className="bg-gray-50 p-3 rounded-lg">
                                <span className="font-medium text-gray-700 capitalize block">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-gray-900">{displayValue}</span>
                              </div>
                            ) : null;
                          })}
                        </div>                        
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Analysis:</span> {analysis.reasoning}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Products */}
                    <div className="glass-card p-6">
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
                    </div>

                    {manufacturabilityResults.length > 0 ? (
                      <div className="space-y-4">
                        {manufacturabilityResults.map((result, index) => (
                          <div 
                            key={index}
                            className={`glass-card p-4 border-l-4 ${
                              result.status === 'Valid' ? 'border-green-500' :
                              result.status === 'Warning' ? 'border-yellow-500' :
                              'border-red-500'
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
                              <div className="glass-card-compact bg-blue-50 border border-blue-200 mt-2">
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
                      <div className="text-center py-12 text-gray-500">
                        <div className="bg-blue-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-2">Manufacturing Analysis Not Run</p>
                        <p className="text-sm text-gray-600 mb-4">
                          Run the manufacturing analysis to check dimensions, tolerances,<br />
                          hole spacing, edge distances, and manufacturing feasibility.
                        </p>
                        <Button onClick={runManufacturingAnalysis} disabled={isAnalyzingManufacturing}>
                          {isAnalyzingManufacturing ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              Run Manufacturing Analysis
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'verification' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Specification Verification</h3>
                    </div>

                    {specificationResults.length > 0 ? (
                      <div className="space-y-4">
                        {specificationResults.map((result, index) => (
                          <div 
                            key={index}
                            className={`glass-card p-4 border ${
                              result.status === 'Valid' ? 'border-green-200' :
                              result.status === 'Missing' ? 'border-yellow-200' :
                              'border-red-200'
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
                      <div className="text-center py-12 text-gray-500">
                        <div className="bg-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-2">Specification Verification Not Run</p>
                        <p className="text-sm text-gray-600 mb-4">
                          Run the manufacturing analysis to verify specifications against<br />
                          AISC 360, AWS D1.1, and ASTM standards.
                        </p>
                        <Button onClick={runManufacturingAnalysis} disabled={isAnalyzingManufacturing}>
                          {isAnalyzingManufacturing ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              Run Manufacturing Analysis
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'report' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Analysis Report</h3>
                      {!reportGenerated && (
                        <Button onClick={generateReport} disabled={isGeneratingReport} size="sm">
                          {isGeneratingReport ? <LoadingSpinner size="sm" /> : 'Generate Report'}
                        </Button>
                      )}
                    </div>

                    {reportGenerated ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className={`glass-card p-5 ${reportSummary.tone.badge}`}>
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Overall Status</p>
                            <p className={`mt-2 text-2xl font-semibold ${reportSummary.tone.accent}`}>
                              {reportSummary.statusLabel}
                            </p>
                            <p className="text-sm mt-3">{reportSummary.statusDescription}</p>
                          </div>
                          <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">AI Confidence</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                              {analysis ? `${Math.round(analysis.confidence * 100)}%` : '—'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Model certainty across extracted specifications.</p>
                          </div>
                          <div className="glass-card p-5">
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Check Breakdown</p>
                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Total Checks</span>
                                <span className="font-semibold text-gray-900">{reportSummary.totalChecks}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Pass</span>
                                <span className="font-semibold text-emerald-600">{reportSummary.passes}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Warnings</span>
                                <span className="font-semibold text-amber-600">{reportSummary.warnings}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-500">Issues</span>
                                <span className="font-semibold text-red-600">{reportSummary.invalid}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-base font-semibold text-gray-900">Key Findings</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${reportSummary.tone.chip}`}>
                                {keyFindings.length} highlight{keyFindings.length === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="space-y-4">
                              {keyFindings.map((finding, index) => {
                                const statusClasses = finding.status === 'Invalid'
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : finding.status === 'Warning'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700';
                                return (
                                  <div key={`${finding.title}-${index}`} className="glass-card-compact border border-gray-100">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold text-gray-900">{finding.title}</p>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusClasses}`}>
                                        {finding.status}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{finding.message}</p>
                                    {finding.detail && (
                                      <p className="text-xs text-gray-500 mt-1">{finding.detail}</p>
                                    )}
                                    {finding.suggestion && (
                                      <div className="mt-3 glass-card-compact bg-blue-50 border border-blue-200 text-xs text-blue-900">
                                        Suggestion: {finding.suggestion}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="glass-card bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 p-6 text-slate-100 shadow-xl">
                            <h4 className="text-base font-semibold">Recommendations</h4>
                            <p className="text-sm text-slate-300 mb-4">
                              Prioritized next steps from manufacturability and compliance analysis.
                            </p>
                            <ul className="space-y-3 text-sm">
                              {recommendationList.map((rec, idx) => (
                                <li key={`${rec}-${idx}`} className="flex items-start">
                                  <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-white/15 text-xs font-semibold mr-3">
                                    {idx + 1}
                                  </span>
                                  <span className="flex-1 text-slate-100">{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="glass-card p-6">
                            <h4 className="text-base font-semibold text-gray-900 mb-4">Technical Snapshot</h4>
                            {technicalSnapshot.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {technicalSnapshot.map((item) => (
                                  <div key={item.label} className="glass-card-compact bg-gray-50 border border-gray-100">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                                    <p className="text-lg font-semibold text-gray-900 mt-1">{item.value}</p>
                                    {item.helper && <p className="text-xs text-gray-500 mt-1">{item.helper}</p>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Run the manufacturing analysis to populate dimensional insights and feature counts.
                              </p>
                            )}
                          </div>
                          <div className="glass-card p-6 space-y-4">
                            <div>
                              <h4 className="text-base font-semibold text-gray-900">Compliance Standards</h4>
                              <p className="text-sm text-gray-500">Referenced during this report.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {standardBadges.map((badge) => (
                                <div key={badge.label} className="glass-card-compact border border-gray-200 bg-gray-50">
                                  <p className="text-xs font-semibold text-gray-700">{badge.label}</p>
                                  <p className="text-xs text-gray-500">{badge.description}</p>
                                </div>
                              ))}
                            </div>
                            <div className="glass-card-compact bg-slate-50 border border-slate-100">
                              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <dt className="text-gray-500">File</dt>
                                  <dd className="font-semibold text-gray-900 truncate">{uploadState.file?.name || 'Unknown'}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-500">Analysis ID</dt>
                                  <dd className="font-semibold text-gray-900">{analysis?.analysisId || 'N/A'}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-500">Report Generated</dt>
                                  <dd className="font-semibold text-gray-900">{reportTimestamp || 'Pending'}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-500">Products Suggested</dt>
                                  <dd className="font-semibold text-gray-900">{analysis?.totalRecommendations || 0}</dd>
                                </div>
                              </dl>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button onClick={() => downloadReport('pdf')} className="flex-1 min-w-[160px]">
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Download PDF
                          </Button>
                          <Button onClick={() => downloadReport('txt')} variant="outline" className="flex-1 min-w-[160px]">
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Text
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="glass-card text-center py-12 text-gray-500 border border-dashed border-gray-200">
                        <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900">No report generated yet</p>
                        <p className="text-sm mt-2 text-gray-500">
                          Click “Generate Report” to create a styled manufacturing + compliance summary.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="glass-container glass-container-with-liquid p-8 text-center">
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