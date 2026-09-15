# Zoo Dev API (KittyCAD) Integration Guide

## Overview

This document describes the integration of Zoo Dev API (KittyCAD) Text-to-CAD functionality into the SteelSmart AI Marketplace. The integration enables users to generate 3D CAD models from natural language descriptions using AI.

## 🚀 Features Implemented

### ✅ Text-to-CAD Generation
- **Natural Language Input**: Users can describe components in plain English
- **AI-Powered Generation**: Uses Zoo Dev's ML models to create 3D CAD models
- **Multiple Output Formats**: Supports STEP, STL, and OBJ formats
- **Real-time Progress Tracking**: Shows generation progress with status updates

### ✅ File Format Support
- **Input Formats**: Natural language descriptions
- **Output Formats**: STEP (.step), STL (.stl), OBJ (.obj), DXF (.dxf), PDF (.pdf)
- **File Conversion**: Built-in format conversion using Zoo Dev API
- **Download Options**: Multiple format download with dropdown menu

### ✅ Error Handling & Fallbacks
- **Comprehensive Error Handling**: Handles API failures gracefully
- **User-Friendly Messages**: Clear error messages for users
- **Fallback System**: Sample data fallback when API is unavailable
- **Rate Limiting**: Proper handling of API rate limits

### ✅ Enhanced User Experience
- **Progress Indicators**: Real-time generation progress with visual feedback
- **Chat-like Interface**: Intuitive conversation-style input
- **Suggested Prompts**: Pre-built examples for common use cases
- **Mobile Responsive**: Works on all device sizes

## 📁 File Structure

```
src/
├── app/api/
│   ├── generate-cad/route.ts      # Main Text-to-CAD API endpoint
│   └── convert-file/route.ts      # File format conversion endpoint
├── components/
│   └── CADGenerator.tsx           # Enhanced CAD generator component
├── lib/
│   └── zoo-client.ts             # Zoo Dev API utility functions
└── types/
    └── index.ts                  # TypeScript type definitions
```

## 🔧 Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the project root:

```env
# Zoo Dev API Configuration
ZOO_API_TOKEN=your_zoo_dev_api_token_here

# File Upload Limits
NEXT_PUBLIC_MAX_FILE_SIZE=52428800

# Development
NODE_ENV=development
```

### 2. Dependencies

The required dependencies are already installed:

```json
{
  "@kittycad/lib": "^3.1.4",
  "@types/multer": "^2.0.0",
  "multer": "^2.0.2"
}
```

### 3. API Token Setup

1. Sign up for a Zoo Dev account at [zoo.dev](https://zoo.dev)
2. Generate an API token from your dashboard
3. Add the token to your `.env.local` file
4. Restart your development server

## 🎯 Usage Examples

### Basic Text-to-CAD Generation

```typescript
// Example API call
const response = await fetch('/api/generate-cad', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: "Generate a 200mm x 100mm steel I-beam with 10mm thickness",
    category: 'beam',
    format: 'step',
    units: 'mm'
  })
});

const result = await response.json();
if (result.success) {
  // Handle successful generation
  const { model_data, parameters } = result.data;
  // model_data contains base64-encoded CAD file
}
```

### File Format Conversion

```typescript
// Convert STEP to STL
const response = await fetch('/api/convert-file', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileContent: base64StepFile,
    sourceFormat: 'step',
    targetFormat: 'stl',
    filename: 'my_model'
  })
});
```

## 🎨 UI Components

### CAD Generator Interface

The main interface includes:

- **Tab Navigation**: Switch between text input and template selection
- **Chat Interface**: Conversation-style input with AI assistant
- **Progress Tracking**: Real-time generation status updates
- **Error Handling**: User-friendly error messages with fallbacks
- **Download Options**: Multi-format download dropdown

### Key Features

1. **Suggested Prompts**: Pre-built examples for common steel components
2. **Real-time Feedback**: Progress indicators and status messages
3. **Error Recovery**: Graceful fallback to sample data
4. **Mobile Responsive**: Optimized for all screen sizes

## 🔍 API Endpoints

### POST `/api/generate-cad`

Generate CAD models from text descriptions.

**Request Body:**
```typescript
{
  description: string;           // Natural language description
  category?: string;            // Component category (optional)
  format?: 'step' | 'stl' | 'obj'; // Output format
  units?: 'mm' | 'cm' | 'm' | 'in'; // Units
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    id: string;                 // Generation ID
    status: string;             // Generation status
    model_data: string;         // Base64-encoded CAD file
    parameters: object;         // Generation parameters
  };
  error?: string;               // Error message if failed
}
```

### POST `/api/convert-file`

Convert CAD files between formats.

**Request Body:**
```typescript
{
  fileContent: string;          // Base64-encoded file
  sourceFormat: 'step' | 'stl' | 'obj';
  targetFormat: 'step' | 'stl' | 'obj';
  filename?: string;            // Output filename
}
```

## 🛠 Utility Functions

### Zoo Client (`src/lib/zoo-client.ts`)

Provides utility functions for:

- **File Conversion**: Convert between CAD formats
- **Mass Calculation**: Calculate component mass with material density
- **Volume Analysis**: Determine 3D model volume
- **Surface Area**: Calculate surface area
- **Center of Mass**: Get center of mass coordinates
- **Model Analysis**: Comprehensive analysis combining all properties

### Material Densities

Pre-configured material densities (kg/m³):

```typescript
const MATERIAL_DENSITIES = {
  steel_mild: 7850,
  steel_stainless: 8000,
  aluminum: 2700,
  brass: 8500,
  copper: 8960,
  titanium: 4500
};
```

## 🚨 Error Handling

### API Error Types

1. **Authentication Errors**: Invalid or missing API token
2. **Rate Limiting**: API quota exceeded
3. **Generation Failures**: Model generation failed
4. **Format Errors**: Unsupported file formats
5. **Network Errors**: Connection issues

### Error Recovery

- **Graceful Degradation**: Falls back to sample data
- **User Feedback**: Clear error messages
- **Retry Logic**: Automatic retry for transient failures
- **Logging**: Comprehensive error logging for debugging

## 📊 Performance Considerations

### Optimization Strategies

1. **Parallel Processing**: Multiple API calls executed simultaneously
2. **Caching**: Client-side caching of generated models
3. **Progress Tracking**: Real-time status updates
4. **File Size Limits**: 50MB maximum file size
5. **Timeout Handling**: 5-minute generation timeout

### Best Practices

- **Prompt Engineering**: Enhance user prompts for better results
- **Format Selection**: Choose appropriate output formats
- **Error Boundaries**: Implement React error boundaries
- **Loading States**: Provide visual feedback during generation

## 🔒 Security Considerations

### API Security

- **Token Management**: Secure storage of API tokens
- **Input Validation**: Sanitize all user inputs
- **File Validation**: Validate file types and sizes
- **Rate Limiting**: Implement client-side rate limiting

### Data Privacy

- **No Data Storage**: Generated models not stored server-side
- **Secure Transmission**: HTTPS for all API calls
- **Token Rotation**: Regular API token rotation recommended

## 🚀 Deployment

### Environment Variables

Required for production:

```env
ZOO_API_TOKEN=your_production_token
NEXT_PUBLIC_MAX_FILE_SIZE=52428800
NODE_ENV=production
```

### Vercel Deployment

The integration is fully compatible with Vercel:

- ✅ **Serverless Functions**: API routes work as serverless functions
- ✅ **Edge Runtime**: Compatible with edge runtime
- ✅ **Fast Cold Starts**: JavaScript-only execution
- ✅ **Memory Efficient**: No subprocess overhead

## 📈 Future Enhancements

### Planned Features

1. **3D Preview**: Real-time 3D model preview
2. **Batch Generation**: Generate multiple models simultaneously
3. **Template Library**: Expand parametric template collection
4. **Assembly Support**: Multi-component assembly generation
5. **Material Analysis**: Advanced material property analysis

### Integration Opportunities

- **CAD Software**: Direct export to AutoCAD, SolidWorks
- **Manufacturing**: Integration with CNC programming
- **Cost Estimation**: Automatic manufacturing cost calculation
- **Inventory**: Link to product catalog and inventory

## 🆘 Troubleshooting

### Common Issues

1. **API Token Not Working**
   - Verify token is correct and active
   - Check environment variable name: `ZOO_API_TOKEN`
   - Restart development server after adding token

2. **Generation Timeouts**
   - Simplify the description
   - Try different output formats
   - Check API quota limits

3. **File Download Issues**
   - Verify browser supports blob downloads
   - Check file size limits
   - Try different output formats

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=zoo-dev:*
```

## 📞 Support

For technical support:

1. **Zoo Dev Documentation**: [docs.zoo.dev](https://docs.zoo.dev)
2. **API Status**: [status.zoo.dev](https://status.zoo.dev)
3. **Community**: [Discord](https://discord.gg/zoo-dev)
4. **GitHub Issues**: Report bugs and feature requests

---

This integration provides a solid foundation for AI-powered CAD generation in the SteelSmart marketplace, with room for future enhancements and optimizations.




