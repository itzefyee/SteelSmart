# STEP Format Extraction Fix

## Problem

When viewing a drawing from history, the 3D preview parser was failing because it was receiving **glTF JSON data** instead of the requested **STEP file**.

### Root Cause

The issue was in `/api/zoo-parts/[id]/route.ts`. When extracting model data from Zoo Dev API's `outputs` object, the code was:

```typescript
// ❌ WRONG: Just grabbing the first output
const outputValues = Object.values(foundItem.outputs);
if (outputValues.length > 0) {
  modelData = outputValues[0];  // This might be preview.gltf instead of source.step!
}
```

### Why This Happened

Zoo Dev API returns **multiple outputs** for each CAD generation:
- `source.step` - The actual STEP file (what we requested)
- `preview.gltf` - A preview/visualization file (JSON format)
- Other potential outputs

When the code grabbed `Object.values(foundItem.outputs)[0]`, it was getting whatever output happened to be first in the object, which could be the glTF preview instead of the STEP file.

### Error Evidence

From the console logs:
```
File content preview: {
  "accessors": [
    {
      "bufferView": 0,
      "byteOffset": 0,
      "count": 6,
      "componentType": 5126,
      "type": "VEC3",
```

This is clearly **glTF JSON**, not STEP format. The STEP parser then failed with:
```
**** ERR StepFile : Undefined Parsing: Line 2: Incorrect syntax: unexpected QUID, expecting STEP
Status: IFSelect_RetFail
```

## Solution

Updated the extraction logic to:

1. **Look for the specific format requested** using the key `source.${format}` (e.g., `source.step`)
2. **Extract content properly** from output objects (handles both `{ content: "..." }` and direct string formats)
3. **Fallback strategy**:
   - First: Try `source.${format}` (the requested format)
   - Second: Try any `source.*` output (prefer source files over previews)
   - Last resort: Use first available output (with warning)

### Fixed Code

```typescript
// ✅ CORRECT: Look for specific format
const requestedFormat = foundItem.format || foundItem.output_format || 'step';
const outputKey = `source.${requestedFormat}`;

if (foundItem.outputs[outputKey]) {
  const output = foundItem.outputs[outputKey];
  modelData = typeof output === 'object' && output !== null 
    ? (output.content || output) 
    : output;
  console.log(`Found model data with requested format key: ${outputKey}`);
} else {
  // Fallback: try any "source.*" output
  const sourceOutputs = availableKeys.filter(key => key.startsWith('source.'));
  if (sourceOutputs.length > 0) {
    // Use first source output
  }
}
```

## Files Modified

1. **`src/app/api/zoo-parts/[id]/route.ts`**
   - Fixed output extraction to use format-specific key
   - Added comprehensive logging for debugging
   - Added proper fallback strategy

## Testing

After this fix:

1. **View a drawing from history** - it should now load the correct STEP file
2. **Check console logs** - you should see:
   ```
   Looking for output with key: source.step
   Found model data with requested format key: source.step
   Successfully extracted model data. Type: string, Length: [size]
   ```
3. **3D preview should work** - STEP file should parse correctly

## Related Issues

This fix ensures that:
- ✅ The correct format is retrieved (STEP when STEP was requested)
- ✅ Preview files (glTF) are not accidentally used
- ✅ Multiple output formats are handled correctly
- ✅ Fallback logic prevents complete failures

## Verification

To verify the fix is working:

1. Check browser console when viewing a drawing
2. Look for log: `Found model data with requested format key: source.step`
3. Verify file content preview shows STEP format:
   ```
   ISO-10303-21;
   HEADER;
   FILE_DESCRIPTION(('Zoo Text-to-CAD'),'1');
   ```
4. 3D preview should render successfully

## Future Improvements

Consider:
1. **Format validation** - Verify extracted data matches expected format before parsing
2. **Error messages** - If requested format not found, show user-friendly error
3. **Format detection** - Auto-detect format from content if format field is missing
4. **Support glTF** - Add glTF parser support for preview files (optional enhancement)

