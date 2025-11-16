# Async Operation Polling Implementation

## Overview

This document describes the implementation of proper async operation handling for the Zoo Dev API text-to-CAD generation feature.

## Problem Statement

Previously, the CAD generation endpoint would return a 202 status with an error message when the Zoo Dev API returned an operation that wasn't immediately completed. This left the operation incomplete and the user without their generated CAD model.

## Solution Implemented

### 1. Server-Side Polling Function

Added `pollTextToCadOperation()` function that:
- Takes an operation ID and polls it until completion
- Handles multiple operation states: `queued`, `in_progress`, `uploading`, `completed`, `failed`
- Implements configurable retry logic with:
  - Default: 60 attempts (2 minutes timeout)
  - 2 second interval between polls
  - Graceful error handling for network issues
- Properly extracts model data from completed operations

### 2. Correct Output Key Format

The function now uses the proper output key format: `source.{format}` (e.g., `source.step`, `source.stl`, `source.obj`)

This matches the Zoo Dev API's output structure:
```javascript
{
  outputs: {
    "source.step": {
      content: "<base64 encoded model data>"
    }
  }
}
```

### 3. Robust Data Extraction

The implementation includes multiple fallback strategies:
1. Try specific format key (`source.step`)
2. Fall back to any available output
3. Check legacy response formats for backward compatibility
4. Extract `content` property from output objects

### 4. Integration with Existing Flow

The polling is integrated seamlessly:
- Non-async operations (if any) continue to work normally
- Async operations are automatically polled to completion
- Error handling preserves existing error reporting
- Success response format remains unchanged

## Code Changes

### Main File: `src/app/api/generate-cad/route.ts`

#### Added Polling Function
```typescript
async function pollTextToCadOperation(
  operationId: string, 
  format: string,
  maxAttempts: number = 60,
  pollInterval: number = 2000
): Promise<any>
```

#### Modified POST Handler
- Added operation status check
- Calls polling function when operation is not completed
- Uses `finalResult` from polling for data extraction
- Updated model data extraction to use correct output keys

## Webhook Alternative (Future Enhancement)

For production environments, webhooks offer better performance than polling:

### Benefits of Webhooks
- No server resources wasted on polling loops
- Instant notification when operation completes
- Better scalability for multiple concurrent operations
- Reduced API call count

### Implementation Path
1. Create webhook endpoint at `/api/webhooks/zoo-dev`
2. Register webhook with Zoo Dev API
3. Store operation-to-user mappings in database
4. Update operation status when webhook is called
5. Notify client via WebSocket/SSE

### Example Webhook Implementation
See: `src/app/api/webhooks/zoo-dev/route.ts.example`

## Testing Recommendations

1. **Test Happy Path**: Generate a CAD model with a simple prompt
2. **Test Long Operations**: Use complex prompts that take longer to generate
3. **Test Error Handling**: Test with invalid prompts or API errors
4. **Test Timeout**: Ensure proper error when operation exceeds max polling time
5. **Monitor Logs**: Check console logs for proper status progression

## Configuration

### Polling Parameters (Adjustable)
```typescript
maxAttempts: 60     // 60 attempts = 2 minutes with 2s interval
pollInterval: 2000  // 2 seconds between polls
```

### Environment Variables
```bash
ZOO_API_TOKEN=your_token_here  # Required for Zoo Dev API
```

## Monitoring

The implementation includes extensive logging:
- Operation ID and initial status
- Each polling attempt with current status
- Output key detection
- Model data extraction strategy used
- Success/failure with details

## Error Handling

Gracefully handles:
- Network errors during polling (retries)
- Failed operations (immediate error)
- Timeout after max attempts
- Missing or malformed output data
- API authentication errors

## Performance Considerations

### Current Implementation (Polling)
- Blocking: Server thread is held during polling
- Scalability: Limited by server thread pool
- Suitable for: Low to medium traffic

### Recommended for Production (Webhooks)
- Non-blocking: Server immediately returns
- Scalability: Handles many concurrent operations
- Suitable for: High traffic production environments

## API Reference

### Zoo Dev API Methods Used

```typescript
// Create text-to-CAD operation
ml.create_text_to_cad({
  body: { prompt: string },
  output_format: 'step' | 'stl' | 'obj'
})

// Get operation status (polling)
ml.get_text_to_cad_model_for_user({
  id: string
})
```

### Response Structure

```typescript
{
  id: string;
  status: 'queued' | 'in_progress' | 'uploading' | 'completed' | 'failed';
  outputs?: {
    [key: string]: {
      content: string; // base64 encoded model data
    }
  };
  error?: string;
}
```

## Migration Notes

- **Breaking Changes**: None - API interface remains the same
- **Backward Compatible**: Yes
- **Database Changes**: None required
- **Environment Variables**: No new variables required

## Future Improvements

1. **Implement Webhooks**: For better scalability
2. **Add Progress Updates**: Use SSE to stream progress to client
3. **Cache Results**: Store generated models to avoid regeneration
4. **Batch Operations**: Support generating multiple models in parallel
5. **Priority Queue**: Implement priority system for urgent generations
6. **Metrics**: Add monitoring for operation durations and success rates

## Related Files

- `src/app/api/generate-cad/route.ts` - Main implementation
- `src/app/api/webhooks/zoo-dev/route.ts.example` - Webhook example
- `src/components/CADGenerator.tsx` - Frontend component

## Support

For issues related to:
- **Polling Logic**: Check logs for status progression
- **Missing Data**: Verify output key format in logs
- **Timeouts**: Increase `maxAttempts` or `pollInterval`
- **API Errors**: Verify `ZOO_API_TOKEN` is valid

## References

- [Zoo Dev API Documentation](https://zoo.dev/docs)
- [Async Operation Patterns](https://docs.zoo.dev/async-operations)
- [Webhook Setup Guide](https://docs.zoo.dev/webhooks)


