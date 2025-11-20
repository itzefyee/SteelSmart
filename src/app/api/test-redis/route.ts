import { NextResponse } from 'next/server';
import { getCached, setCached } from '@/lib/cache/redis-cache';

/**
 * Test Redis Connection API Route
 * 
 * This endpoint tests the Redis connection by:
 * 1. Writing a test value to cache
 * 2. Reading it back
 * 3. Verifying the value matches
 * 
 * Used by the test-setup page to verify Redis configuration
 */
export async function GET() {
  try {
    const testKey = 'test:connection';
    const testValue = {
      message: 'Redis connection successful',
      timestamp: new Date().toISOString(),
    };

    // Test write operation
    await setCached(testKey, testValue, 60); // 60 second TTL

    // Test read operation
    const cachedValue = await getCached(
      testKey,
      async () => {
        // This should not be called if cache write succeeded
        throw new Error('Cache read failed - fetcher was called');
      },
      60
    );

    // Verify the cached value matches what we wrote
    if (JSON.stringify(cachedValue) === JSON.stringify(testValue)) {
      return NextResponse.json({
        success: true,
        message: 'Redis read/write test passed',
        data: cachedValue,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Cache value mismatch',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Redis test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check that UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in .env.local',
      },
      { status: 500 }
    );
  }
}
