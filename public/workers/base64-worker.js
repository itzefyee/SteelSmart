/**
 * Web Worker for base64 to File conversion
 * Offloads heavy base64 operations from main thread
 */

self.onmessage = function(e) {
  const { base64Data, format, filename } = e.data;
  
  try {
    // Extract base64 data if it's a data URL
    let base64 = base64Data;
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(',');
      base64 = parts.length > 1 ? parts[1] : base64Data.replace(/^data:.*;base64,/, '');
    }

    // Decode base64 to binary in worker thread (doesn't block main thread)
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Determine MIME type
    const mimeTypes = {
      'step': 'application/step',
      'stp': 'application/step',
      'stl': 'model/stl',
      'obj': 'model/obj',
      'dxf': 'application/dxf',
      'gltf': 'model/gltf+json',
      'glb': 'model/gltf-binary',
    };

    const mimeType = mimeTypes[format?.toLowerCase()] || 'application/octet-stream';
    const finalFilename = filename || `model.${format?.toLowerCase() || 'step'}`;

    // Send result back to main thread
    self.postMessage({
      success: true,
      bytes: bytes.buffer, // Transfer ArrayBuffer for better performance
      mimeType,
      filename: finalFilename
    }, [bytes.buffer]); // Transfer ownership of ArrayBuffer
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message || 'Failed to convert base64 to file'
    });
  }
};


