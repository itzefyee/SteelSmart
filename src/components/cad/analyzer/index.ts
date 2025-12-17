// CAD Analyzer Sub-Components
// These components are used by CADAnalyzer to break down the UI into manageable pieces

// Eagerly loaded components (always needed)
export { UploadSection } from './UploadSection';
export { SampleDrawings } from './SampleDrawings';
export { ManufacturingSection } from './ManufacturingSection';
export { AnalysisResults } from './AnalysisResults';

// Note: ValidationTab and VerificationTab are lazy-loaded directly in CADAnalyzer.tsx
// They are not exported here to encourage code-splitting
export { ValidationTab } from './ValidationTab';
export { VerificationTab } from './VerificationTab';
