/**
 * Utility functions for base64 to File conversion using Web Worker
 * Prevents blocking the main thread during large file conversions
 */

export interface Base64ToFileOptions {
  base64Data: string;
  format: string;
  filename?: string;
}

export interface Base64ToFileResult {
  file: File;
  mimeType: string;
}

/**
 * Converts base64 data to File using Web Worker
 * This prevents blocking the main thread for large files
 * 
 * @param options - Base64 data, format, and optional filename
 * @returns Promise resolving to File object
 */
export function convertBase64ToFile(options: Base64ToFileOptions): Promise<Base64ToFileResult> {
  return new Promise((resolve, reject) => {
    // Create worker
    const worker = new Worker('/workers/base64-worker.js');
    
    // Handle worker response
    worker.onmessage = (e) => {
      const { success, bytes, mimeType, filename, error } = e.data;
      
      if (success) {
        // Create File from ArrayBuffer
        const file = new File([bytes], filename, { type: mimeType });
        resolve({ file, mimeType });
      } else {
        reject(new Error(error || 'Failed to convert base64 to file'));
      }
      
      // Terminate worker
      worker.terminate();
    };
    
    // Handle worker errors
    worker.onerror = (error) => {
      reject(new Error(`Worker error: ${error.message}`));
      worker.terminate();
    };
    
    // Send data to worker
    worker.postMessage({
      base64Data: options.base64Data,
      format: options.format,
      filename: options.filename
    });
  });
}

/**
 * Fallback function for base64 conversion without Web Worker
 * Use this if Web Workers are not supported
 */
export function convertBase64ToFileSync(base64Data: string, format: string, filename?: string): File | null {
  try {
    // Extract base64 data
    let base64 = base64Data;
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(',');
      base64 = parts.length > 1 ? parts[1] : base64Data.replace(/^data:.*;base64,/, '');
    }

    // Decode base64 to binary
    const binaryString = atob(base64);
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

    const mimeType = mimeTypes[format.toLowerCase()] || 'application/octet-stream';
    const finalFilename = filename || `model.${format.toLowerCase()}`;

    return new File([bytes], finalFilename, { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to file:', error);
    return null;
  }
}


