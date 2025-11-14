// lib/compliance-checker.ts

import {
    STANDARDS_DATABASE,
    checkEdgeDistanceCompliance,
    checkSpacingCompliance,
    getMaterialProperties,
    type Geometry,
    type EdgeType,
    type MaterialGrade
} from './standards-database';

// Type definitions
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ComplianceStatus = 'FULLY_COMPLIANT' | 'ACCEPTABLE_WITH_NOTES' | 'NEEDS_REVIEW' | 'NON_COMPLIANT';

export interface Specifications {
    materialGrade?: string;
    materialThickness?: number;
    edgeType?: EdgeType;
    ambientTemp?: number;
    weldType?: string;
}

export interface ComplianceIssue {
    timestamp: string;
    code: string;
    severity?: Severity;
    standard?: string;
    message: string;
    location?: { x: number; y: number };
    recommendation?: string;
    details?: Record<string, any>;
}

export interface ComplianceResults {
    compliant: boolean;
    violations: ComplianceIssue[];
    warnings: ComplianceIssue[];
    passes: ComplianceIssue[];
    score: number;
    status?: ComplianceStatus;
    statusMessage?: string;
}

export interface ComplianceSummary {
    overallStatus: ComplianceStatus;
    statusMessage: string;
    complianceScore: number;
    criticalViolations: number;
    totalViolations: number;
    totalWarnings: number;
    checksPerformed: number;
    timestamp: string;
}

export interface ComplianceReport {
    summary: ComplianceSummary;
    violations: ComplianceIssue[];
    warnings: ComplianceIssue[];
    passes: ComplianceIssue[];
    specifications: Required<Specifications>;
    geometry: {
        dimensions: { width: number; height: number; area: number };
        holeCount: number;
        area: number;
    };
}

/**
 * Comprehensive standards compliance checker
 */
export class ComplianceChecker {
    private geometry: Geometry;
    private specs: Required<Specifications>;
    private results: ComplianceResults;

    constructor(geometry: Geometry, specifications: Specifications = {}) {
        this.geometry = geometry;
        this.specs = {
            materialGrade: specifications.materialGrade || 'A36',
            materialThickness: specifications.materialThickness || 0.25,
            edgeType: specifications.edgeType || 'rolled', // 'rolled' or 'sheared'
            ambientTemp: specifications.ambientTemp || 70, // Fahrenheit
            weldType: specifications.weldType || 'fillet'
        };

        this.results = {
            compliant: true,
            violations: [],
            warnings: [],
            passes: [],
            score: 100
        };
    }

    /**
     * Run all compliance checks
     */
    checkAll(): ComplianceResults {
        this.checkHoleCompliance();
        this.checkDimensionalTolerances();
        this.checkWeldingRequirements();
        this.checkMaterialStandards();
        this.checkManufacturingPractices();

        // Calculate overall compliance score
        this.calculateScore();

        return this.results;
    }

    /**
     * Check hole-related compliance (AISC 360)
     */
    checkHoleCompliance(): void {
        const holes = this.geometry.holes || [];
        const bounds = this.geometry.bounds;
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;

        holes.forEach((hole, index) => {
            const holeDiameter = hole.diameter || (hole.radius! * 2);

            // Check 1: Minimum hole size
            const minDiameter = 0.25; // 1/4" minimum
            if (holeDiameter < minDiameter) {
                this.addViolation({
                    code: 'HOLE_SIZE_MIN',
                    severity: 'CRITICAL',
                    standard: 'Manufacturing Practice',
                    message: `Hole #${index + 1}: Diameter ${holeDiameter.toFixed(3)}" is below minimum ${minDiameter}"`,
                    location: hole.center,
                    recommendation: `Increase hole diameter to at least ${minDiameter}"`
                });
            } else {
                this.addPass({
                    code: 'HOLE_SIZE_MIN',
                    message: `Hole #${index + 1}: Diameter ${holeDiameter.toFixed(3)}" meets minimum requirement`
                });
            }

            // Check 2: Standard drill size
            const drillSizes = STANDARDS_DATABASE.MANUFACTURING_PRACTICES.drilling.standard_drill_sizes.most_common;
            const isStandard = drillSizes.some(size => Math.abs(size - holeDiameter) < 0.001);

            if (!isStandard) {
                const nearest = drillSizes.reduce((prev, curr) =>
                    Math.abs(curr - holeDiameter) < Math.abs(prev - holeDiameter) ? curr : prev
                );

                this.addWarning({
                    code: 'NON_STANDARD_DRILL',
                    severity: 'MEDIUM',
                    standard: 'Manufacturing Practice',
                    message: `Hole #${index + 1}: ${holeDiameter.toFixed(4)}" requires special tooling`,
                    location: hole.center,
                    recommendation: `Consider standard size ${nearest}" to reduce cost`
                });
            } else {
                this.addPass({
                    code: 'STANDARD_DRILL_SIZE',
                    message: `Hole #${index + 1}: Uses standard drill size ${holeDiameter}"`
                });
            }

            // Check 3: Edge distance (AISC 360 Table J3.4)
            const edgeDistances: Record<string, number> = {
                left: hole.center.x - bounds.minX,
                right: bounds.maxX - hole.center.x,
                bottom: hole.center.y - bounds.minY,
                top: bounds.maxY - hole.center.y
            };

            Object.entries(edgeDistances).forEach(([edge, distance]) => {
                const compliance = checkEdgeDistanceCompliance(
                    holeDiameter,
                    distance,
                    this.specs.edgeType
                );

                if (!compliance.compliant) {
                    this.addViolation({
                        code: 'AISC_360_J3.4',
                        severity: 'CRITICAL',
                        standard: 'AISC 360 Table J3.4',
                        message: `Hole #${index + 1}: ${edge} edge distance ${distance.toFixed(3)}" < required ${compliance.required.toFixed(3)}"`,
                        location: hole.center,
                        recommendation: `Increase ${edge} edge distance by ${Math.abs(compliance.margin).toFixed(3)}"`,
                        details: {
                            required: compliance.required,
                            actual: compliance.actual,
                            deficit: Math.abs(compliance.margin),
                            explanation: compliance.explanation
                        }
                    });
                } else {
                    this.addPass({
                        code: 'AISC_360_J3.4',
                        message: `Hole #${index + 1}: ${edge} edge distance compliant (${distance.toFixed(3)}" ≥ ${compliance.required.toFixed(3)}")`
                    });
                }
            });

            // Check 4: Hole spacing (AISC 360 J3.3)
            holes.forEach((otherHole, otherIndex) => {
                if (index < otherIndex) { // Check each pair once
                    const otherDiameter = otherHole.diameter || (otherHole.radius! * 2);
                    const spacing = Math.sqrt(
                        Math.pow(hole.center.x - otherHole.center.x, 2) +
                        Math.pow(hole.center.y - otherHole.center.y, 2)
                    );

                    const maxDiameter = Math.max(holeDiameter, otherDiameter);
                    const compliance = checkSpacingCompliance(maxDiameter, spacing);

                    if (!compliance.compliant) {
                        this.addViolation({
                            code: 'AISC_360_J3.3',
                            severity: 'CRITICAL',
                            standard: 'AISC 360 Section J3.3',
                            message: `Holes #${index + 1} and #${otherIndex + 1}: Spacing ${spacing.toFixed(3)}" < minimum ${compliance.minimum.toFixed(3)}"`,
                            recommendation: `Increase hole spacing by ${Math.abs(compliance.margin).toFixed(3)}"`,
                            details: {
                                minimum: compliance.minimum,
                                preferred: compliance.preferred,
                                actual: spacing,
                                deficit: Math.abs(compliance.margin)
                            }
                        });
                    } else if (!compliance.meetsPreferred) {
                        this.addWarning({
                            code: 'AISC_360_J3.3_PREFERRED',
                            severity: 'LOW',
                            standard: 'AISC 360 Section J3.3',
                            message: `Holes #${index + 1} and #${otherIndex + 1}: Spacing ${spacing.toFixed(3)}" below preferred ${compliance.preferred.toFixed(3)}"`,
                            recommendation: compliance.recommendation
                        });
                    } else {
                        this.addPass({
                            code: 'AISC_360_J3.3',
                            message: `Holes #${index + 1} and #${otherIndex + 1}: Spacing meets preferred standard`
                        });
                    }
                }
            });
        });
    }

    /**
     * Check dimensional tolerances (AISC 303)
     */
    checkDimensionalTolerances(): void {
        const dims = this.geometry.dimensions;
        const tolerances = STANDARDS_DATABASE.AISC_360.sections.tolerances.rules;

        // Check length tolerance
        const maxDim = Math.max(dims.width, dims.height);
        const lengthTol = tolerances.length_tolerance.getTolerance(maxDim);

        this.addPass({
            code: 'AISC_303_LENGTH',
            standard: 'AISC 303 Section 6',
            message: `Dimensional tolerance: ±${lengthTol.toFixed(3)}" for ${maxDim.toFixed(1)}" length`,
            details: {
                tolerance: lengthTol,
                explanation: tolerances.length_tolerance.explanation
            }
        });

        // Check hole diameter tolerance
        const holeTol = tolerances.hole_diameter.standard;
        this.addPass({
            code: 'AISC_303_HOLES',
            standard: 'AISC 303 Section 6',
            message: `Hole diameter tolerance: +${holeTol.toFixed(4)}", -0`,
            details: {
                tolerance: holeTol,
                explanation: tolerances.hole_diameter.explanation
            }
        });
    }

    /**
     * Check welding requirements (AWS D1.1)
     */
    checkWeldingRequirements(): void {
        const thickness = this.specs.materialThickness;
        const ambientTemp = this.specs.ambientTemp;
        const materialGrade = this.specs.materialGrade;

        // Check minimum fillet weld size (AISC 360 Table J2.4)
        const weldRules = STANDARDS_DATABASE.AISC_360.sections.J2_4_weld_size.rules;
        const minFilletSize = weldRules.minimum_fillet.getSize(thickness);
        const maxFilletSize = weldRules.maximum_fillet.formula(thickness);

        this.addPass({
            code: 'AISC_360_J2.4',
            standard: 'AISC 360 Table J2.4',
            message: `For ${thickness}" material: Min fillet weld = ${minFilletSize}", Max = ${maxFilletSize.toFixed(3)}"`,
            details: {
                minFilletSize,
                maxFilletSize,
                explanation: weldRules.minimum_fillet.explanation
            }
        });

        // Check preheat requirements (AWS D1.1)
        const preheatCheck = STANDARDS_DATABASE.AWS_D1_1.sections.preheat_requirements.rules
            .check_preheat(thickness, ambientTemp, materialGrade);

        if (preheatCheck.required) {
            this.addWarning({
                code: 'AWS_D1.1_PREHEAT',
                severity: 'MEDIUM',
                standard: 'AWS D1.1 Table 3.2',
                message: `Preheat required: Minimum ${preheatCheck.min_temp}°F`,
                recommendation: `Heat material to at least ${preheatCheck.min_temp}°F before welding`,
                details: {
                    reason: preheatCheck.reason,
                    minTemp: preheatCheck.min_temp,
                    currentTemp: ambientTemp
                }
            });
        } else {
            this.addPass({
                code: 'AWS_D1.1_PREHEAT',
                standard: 'AWS D1.1 Table 3.2',
                message: `No preheat required for current conditions`,
                details: {
                    reason: preheatCheck.reason
                }
            });
        }

        // Check for thin material welding challenges
        if (thickness <= 0.125) {
            this.addWarning({
                code: 'THIN_MATERIAL_WELDING',
                severity: 'MEDIUM',
                standard: 'Manufacturing Best Practice',
                message: `Material thickness ${thickness}" prone to warping during welding`,
                recommendation: 'Use fixturing, skip welding technique, or back-step sequence to minimize distortion'
            });
        }
    }

    /**
     * Check material standards (ASTM)
     */
    checkMaterialStandards(): void {
        const material = getMaterialProperties(this.specs.materialGrade);

        if (material) {
            this.addPass({
                code: 'ASTM_MATERIAL',
                standard: material.designation,
                message: `Material: ${material.title}`,
                details: {
                    designation: material.designation,
                    yieldStrength: `${material.properties.yield_strength.toLocaleString()} psi`,
                    tensileStrength: `${material.properties.tensile_strength.toLocaleString()} psi`,
                    weldability: material.weldability,
                    applications: material.applications,
                    availability: material.availability
                }
            });

            // Weldability check
            if (material.weldability === 'Fair' || material.weldability === 'Poor') {
                this.addWarning({
                    code: 'WELDABILITY_CONCERN',
                    severity: 'MEDIUM',
                    standard: material.designation,
                    message: `${material.designation} has ${material.weldability.toLowerCase()} weldability`,
                    recommendation: 'Consider special welding procedures or preheat requirements'
                });
            }
        } else {
            this.addWarning({
                code: 'UNKNOWN_MATERIAL',
                severity: 'HIGH',
                standard: 'ASTM Standards',
                message: `Material grade "${this.specs.materialGrade}" not recognized`,
                recommendation: 'Verify material specification. Defaulting to ASTM A36 properties.'
            });
        }
    }

    /**
     * Check manufacturing practices
     */
    checkManufacturingPractices(): void {
        const dims = this.geometry.dimensions;
        const practices = STANDARDS_DATABASE.MANUFACTURING_PRACTICES;

        // Check material utilization
        const standardPlates = practices.cutting.standard_plate_sizes;
        const fittingPlates = standardPlates
            .filter(p => dims.width <= p.width && dims.height <= p.length)
            .map(p => ({
                ...p,
                utilization: (dims.area / (p.width * p.length)) * 100,
                waste: (p.width * p.length) - dims.area
            }))
            .sort((a, b) => b.utilization - a.utilization);

        if (fittingPlates.length > 0) {
            const best = fittingPlates[0];

            if (best.utilization < 65) {
                this.addWarning({
                    code: 'MATERIAL_UTILIZATION',
                    severity: 'LOW',
                    standard: 'Manufacturing Best Practice',
                    message: `Low material utilization: ${best.utilization.toFixed(1)}% on ${best.description}`,
                    recommendation: `Consider optimizing dimensions to reduce waste (${best.waste.toFixed(1)} sq in)`,
                    details: {
                        plateSize: `${best.width}" × ${best.length}"`,
                        utilization: `${best.utilization.toFixed(1)}%`,
                        wasteArea: `${best.waste.toFixed(1)} sq in`
                    }
                });
            } else {
                this.addPass({
                    code: 'MATERIAL_UTILIZATION',
                    standard: 'Manufacturing Best Practice',
                    message: `Good material utilization: ${best.utilization.toFixed(1)}% on ${best.description}`,
                    details: {
                        plateSize: `${best.width}" × ${best.length}"`,
                        utilization: `${best.utilization.toFixed(1)}%`
                    }
                });
            }
        } else {
            this.addWarning({
                code: 'OVERSIZED_COMPONENT',
                severity: 'MEDIUM',
                standard: 'Manufacturing Practice',
                message: `Component (${dims.width.toFixed(1)}" × ${dims.height.toFixed(1)}") exceeds standard plate sizes`,
                recommendation: 'May require special material ordering or welding multiple plates'
            });
        }

        // Check for very small features
        const minFeatureSize = 0.25;
        if (dims.width < minFeatureSize || dims.height < minFeatureSize) {
            this.addWarning({
                code: 'SMALL_FEATURE',
                severity: 'MEDIUM',
                standard: 'Manufacturing Practice',
                message: `Component has very small dimensions (< ${minFeatureSize}")`,
                recommendation: 'Verify dimensions are correct. Small parts may be difficult to handle and fixture.'
            });
        }
    }

    /**
     * Add violation to results
     */
    private addViolation(violation: Omit<ComplianceIssue, 'timestamp'>): void {
        this.results.violations.push({
            timestamp: new Date().toISOString(),
            ...violation
        });
        this.results.compliant = false;
    }

    /**
     * Add warning to results
     */
    private addWarning(warning: Omit<ComplianceIssue, 'timestamp'>): void {
        this.results.warnings.push({
            timestamp: new Date().toISOString(),
            ...warning
        });
    }

    /**
     * Add pass to results
     */
    private addPass(pass: Omit<ComplianceIssue, 'timestamp'>): void {
        this.results.passes.push({
            timestamp: new Date().toISOString(),
            ...pass
        });
    }

    /**
     * Calculate overall compliance score
     */
    private calculateScore(): void {
        let score = 100;

        // Deduct points for violations
        this.results.violations.forEach(v => {
            switch (v.severity) {
                case 'CRITICAL': score -= 20; break;
                case 'HIGH': score -= 10; break;
                case 'MEDIUM': score -= 5; break;
                default: score -= 2;
            }
        });

        // Deduct points for warnings
        this.results.warnings.forEach(w => {
            switch (w.severity) {
                case 'HIGH': score -= 5; break;
                case 'MEDIUM': score -= 3; break;
                case 'LOW': score -= 1; break;
                default: score -= 1;
            }
        });

        this.results.score = Math.max(0, Math.min(100, score));

        // Determine status
        if (this.results.violations.length > 0) {
            this.results.status = 'NON_COMPLIANT';
            this.results.statusMessage = 'Critical issues must be resolved before manufacturing';
        } else if (this.results.warnings.length > 3) {
            this.results.status = 'NEEDS_REVIEW';
            this.results.statusMessage = 'Multiple warnings require engineering review';
        } else if (this.results.warnings.length > 0) {
            this.results.status = 'ACCEPTABLE_WITH_NOTES';
            this.results.statusMessage = 'Compliant with minor recommendations';
        } else {
            this.results.status = 'FULLY_COMPLIANT';
            this.results.statusMessage = 'Meets all standards and best practices';
        }
    }

    /**
     * Generate compliance summary
     */
    getSummary(): ComplianceSummary {
        return {
            overallStatus: this.results.status!,
            statusMessage: this.results.statusMessage!,
            complianceScore: this.results.score,
            criticalViolations: this.results.violations.filter(v => v.severity === 'CRITICAL').length,
            totalViolations: this.results.violations.length,
            totalWarnings: this.results.warnings.length,
            checksPerformed: this.results.passes.length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate detailed compliance report
     */
    generateReport(): ComplianceReport {
        return {
            summary: this.getSummary(),
            violations: this.results.violations,
            warnings: this.results.warnings,
            passes: this.results.passes,
            specifications: this.specs,
            geometry: {
                dimensions: this.geometry.dimensions,
                holeCount: this.geometry.holes?.length || 0,
                area: this.geometry.dimensions.area
            }
        };
    }
}

export default ComplianceChecker;








