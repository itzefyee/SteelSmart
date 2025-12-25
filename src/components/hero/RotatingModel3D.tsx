'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface RotatingModel3DProps {
  modelName?: string;
  totalFrames?: number;
  frameRate?: number;
  useSupabase?: boolean;
}

// Module-level cache for preloaded images
interface ImageCacheEntry {
  frameSources: string[];
  minFramesLoaded: boolean;
}

const imageCache = new Map<string, ImageCacheEntry>();

// Minimum frames needed to start animation (progressive loading)
const MIN_FRAMES_TO_START = 8;

const RotatingModel3D: React.FC<RotatingModel3DProps> = ({
  modelName = 'brake-rotor',
  totalFrames = 36,
  frameRate = 33,
  useSupabase = false,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [canAnimate, setCanAnimate] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [frameSources, setFrameSources] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  // Base path for images (PNG sequence)
  const getImagePath = useCallback((frameIndex: number) => {
    const frameNumber = frameIndex.toString().padStart(3, '0');
    if (useSupabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      return `${supabaseUrl}/storage/v1/object/public/model-frames/${modelName}/${modelName}-${frameNumber}.png`;
    }
    return `/model-frames/${modelName}/${modelName}-${frameNumber}.png`;
  }, [modelName, useSupabase]);

  // Progressive image loading - prioritize first frames, then load rest in background
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cacheKey = `${modelName}-${totalFrames}-${useSupabase}`;
    const cached = imageCache.get(cacheKey);
    
    // Use cached data if available
    if (cached && cached.minFramesLoaded) {
      setFrameSources(cached.frameSources);
      setCanAnimate(true);
      setLoadProgress(100);
      return;
    }

    const sources = Array.from({ length: totalFrames }, (_, i) => getImagePath(i));
    setFrameSources(sources);

    // Initialize cache entry
    if (!cached) {
      imageCache.set(cacheKey, {
        frameSources: sources,
        minFramesLoaded: false,
      });
    }

    let cancelled = false;
    let loadedCount = 0;

    // Priority order: load evenly distributed frames first for smooth initial animation
    const priorityFrames = Array.from({ length: MIN_FRAMES_TO_START }, (_, i) => 
      Math.floor(i * totalFrames / MIN_FRAMES_TO_START)
    );
    const remainingFrames = Array.from({ length: totalFrames }, (_, i) => i)
      .filter(i => !priorityFrames.includes(i));

    const loadImage = (frameIndex: number): Promise<void> => {
      return new Promise((resolve) => {
        if (cancelled) {
          resolve();
          return;
        }

        const img = new window.Image();
        
        img.onload = () => {
          if (!cancelled) {
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / totalFrames) * 100));

            // Start animation once minimum frames are loaded
            if (loadedCount >= MIN_FRAMES_TO_START) {
              const cacheEntry = imageCache.get(cacheKey);
              if (cacheEntry) {
                cacheEntry.minFramesLoaded = true;
              }
              setCanAnimate(true);
            }
          }
          resolve();
        };

        img.onerror = () => {
          loadedCount++;
          setLoadProgress(Math.round((loadedCount / totalFrames) * 100));
          if (loadedCount >= MIN_FRAMES_TO_START) {
            setCanAnimate(true);
          }
          resolve();
        };

        img.src = sources[frameIndex];
      });
    };

    // Load priority frames first (in parallel), then remaining frames
    const loadAllImages = async () => {
      // Load priority frames in parallel
      await Promise.all(priorityFrames.map(loadImage));
      
      // Load remaining frames in batches to avoid overwhelming the browser
      const batchSize = 4;
      for (let i = 0; i < remainingFrames.length; i += batchSize) {
        if (cancelled) break;
        const batch = remainingFrames.slice(i, i + batchSize);
        await Promise.all(batch.map(loadImage));
      }
    };

    loadAllImages();

    return () => {
      cancelled = true;
    };
  }, [totalFrames, modelName, useSupabase, getImagePath]);

  // Rotate through frames with hover acceleration
  const currentFrameRate = isHovered ? frameRate * 0.6 : frameRate;

  useEffect(() => {
    if (!canAnimate) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, currentFrameRate);

    return () => clearInterval(interval);
  }, [canAnimate, totalFrames, currentFrameRate]);

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ minHeight: '400px', maxHeight: '450px' }}
    >
      {/* Loading State */}
      {!canAnimate && (
        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-medium text-sm">Loading 3D Model... {loadProgress}%</p>
        </div>
      )}

      {/* Render Current Frame using img tag */}
      {canAnimate && frameSources.length > 0 && (
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frameSources[currentFrame]}
            alt="Rotating brake rotor 3D model"
            className="drop-shadow-2xl object-contain"
            style={{ 
              width: '450px', 
              height: '450px', 
              maxWidth: '100%', 
              maxHeight: '100%'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RotatingModel3D;
