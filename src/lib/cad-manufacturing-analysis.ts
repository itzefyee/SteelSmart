/**
 * CAD Manufacturing Analysis Utilities
 * 
 * This module provides functions to convert CAD model data into
 * UI-friendly formats for displaying manufacturability and
 * specification verification results.
 * 
 * @module cad-manufacturing-analysis
 */

import { CADModelData } from '@/lib/cad-parser';
import { ComplianceChecker } from '@/lib/compliance-checker';

/**
 * Result of a manufacturability check
 */
export interface ManufacturabilityResult {
  /** Name of the check performed */
  check: string;
  /** Current value from the model */
  value: string;
  /** Required value or standard */
  requirement: string;
  /** Status of the check */
  status: 'Valid' | 'Warning' | 'Invalid';
  /** Detailed message about the result */
  message: string;
  /** Optional suggestion for improvement */
  suggestion?: string;
}

/**
 * Result of a specification verification check
 */
export interface SpecificationResult {
  /** Name of the specification */
  specification: string;
  /** Whether the specification is verified */
  verified: boolean;
  /** Current value */
  value: string;
  /** Industry standard reference */
  standard: string;
  /** Status of the verification */
  status: 'Valid' | 'Warning' | 'Invalid' | 'Missing';
  /** Additional notes */
  notes: string;
}

/**
 * Converts CAD model manufacturing data into UI-friendly format.
 * Analyzes dimensions, thickness, holes, edges, welds, and bends.
 * 
 * @param modelData - Parsed CAD model data
 * @returns Array of manufacturability check results
 */
export function convertManufacturingDataToUI(modelData: CADModelData): ManufacturabilityResult[] {
  const results: ManufacturabilityResult[] = [];

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
          : `${welds.accessibilityIssues} joint(s) may be difficult to access`,
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
}

/**
 * Converts CAD model data into specification verification results.
 * Runs compliance checking against AISC, AWS, and ASTM standards.
 * 
 * @param modelData - Parsed CAD model data
 * @returns Array of specification verification results
 */
export function convertSpecificationDataToUI(modelData: CADModelData): SpecificationResult[] {
  const results: SpecificationResult[] = [];

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
}
