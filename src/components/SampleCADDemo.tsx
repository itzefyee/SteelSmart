'use client';

import React from 'react';

const SampleCADDemo: React.FC = () => {
  const handleSampleClick = () => {
    // In a real implementation, this would load a sample file
    alert('Sample CAD drawing loaded! This would normally upload a demo technical drawing file.');
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4 mt-4">
      <h4 className="font-medium text-blue-900 mb-2">Try with Sample Drawing</h4>
      <p className="text-blue-700 text-sm mb-3">
        Test the CAD analyzer with our sample servo motor technical drawing.
      </p>
      <button
        onClick={handleSampleClick}
        className="text-primary hover:text-blue-700 text-sm underline font-medium"
      >
        Load Servo Motor Drawing (PDF)
      </button>
    </div>
  );
};

export default SampleCADDemo;