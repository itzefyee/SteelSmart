# Batch Product Image Generation Script
# This PowerShell script helps automate the process of generating product images
# from STEP files in the products-models directory.

$ErrorActionPreference = "Stop"

# Configuration
$productsModelsDir = "public\products-models"
$productsImagesDir = "public\products-images"
$cadAnalyzerUrl = "http://localhost:3000/cad-analyzer"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Product Images Generation Helper" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if products-models directory exists
if (-not (Test-Path $productsModelsDir)) {
    Write-Host "ERROR: $productsModelsDir directory not found!" -ForegroundColor Red
    exit 1
}

# Create products-images directory if it doesn't exist
if (-not (Test-Path $productsImagesDir)) {
    Write-Host "Creating $productsImagesDir directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $productsImagesDir | Out-Null
}

# Get all STEP files
$stepFiles = Get-ChildItem -Path $productsModelsDir -Filter "*.step"

if ($stepFiles.Count -eq 0) {
    Write-Host "No STEP files found in $productsModelsDir" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($stepFiles.Count) STEP files:" -ForegroundColor Green
foreach ($file in $stepFiles) {
    Write-Host "  - $($file.Name)" -ForegroundColor Gray
}
Write-Host ""

# Create subdirectories for each product
Write-Host "Creating product subdirectories..." -ForegroundColor Yellow
foreach ($file in $stepFiles) {
    $productId = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $productDir = Join-Path $productsImagesDir $productId
    
    if (-not (Test-Path $productDir)) {
        New-Item -ItemType Directory -Path $productDir | Out-Null
        Write-Host "  ✓ Created: $productId\" -ForegroundColor Green
    } else {
        Write-Host "  ○ Exists: $productId\" -ForegroundColor Gray
    }
}
Write-Host ""

# Instructions for manual generation
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   NEXT STEPS - Image Generation" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Use CAD Analyzer (Easiest)" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host "1. Start the development server: npm run dev"
Write-Host "2. Open: $cadAnalyzerUrl"
Write-Host "3. For each STEP file in $productsModelsDir:"
Write-Host "   a. Upload the file"
Write-Host "   b. Click 'Extract 2D Views'"
Write-Host "   c. Click 'Generate Perspective Views'"
Write-Host "   d. Click 'Download All Views'"
Write-Host "   e. Move images to: $productsImagesDir\[product-id]\"
Write-Host ""

Write-Host "Option 2: Use Blender (Batch)" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Gray
Write-Host "Requirements:"
Write-Host "  - Blender installed (winget install BlenderFoundation.Blender)"
Write-Host "  - STEP files converted to STL (use FreeCAD or online converter)"
Write-Host ""
Write-Host "Commands (run for each product):"
foreach ($file in $stepFiles) {
    $productId = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $stlFile = Join-Path $productsModelsDir "$productId.stl"
    $outputDir = Join-Path $productsImagesDir $productId
    
    Write-Host ""
    Write-Host "# $productId" -ForegroundColor Cyan
    Write-Host "python scripts\generate_model_frames.py --input `"$stlFile`" --output `"$outputDir`" --frames 12 --size 1024"
    Write-Host "blender --background --python `"$outputDir\render_script.py`""
}
Write-Host ""

# Instructions for upload
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   FINAL STEP - Upload to Supabase" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After generating all images, run:" -ForegroundColor Yellow
Write-Host "  npm run upload-product-images" -ForegroundColor White
Write-Host ""
Write-Host "Then update product records in Supabase with the image URLs." -ForegroundColor Yellow
Write-Host ""

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Setup complete! Follow the steps above." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan







