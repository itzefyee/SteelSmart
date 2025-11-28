import { ChatbotSection } from '../types';

export const troubleshootingSection: ChatbotSection = {
    troubleshooting: {
        id: 'troubleshooting',
        type: 'message',
        message: "I'm here to help! What issue are you experiencing?",
        options: [
            { id: 'generation-failed', label: 'Generation failed or stuck', icon: 'AlertCircle' },
            { id: 'wrong-dimensions', label: 'Wrong dimensions generated', icon: 'Ruler' },
            { id: 'file-wont-open', label: 'CAD file won\'t open', icon: 'FileX' },
            { id: 'compliance-confused', label: 'Don\'t understand compliance errors', icon: 'HelpCircle' },
            { id: 'slow-performance', label: 'Slow loading or performance', icon: 'Zap' },
            { id: 'greeting', label: '← Back to Menu', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'generation-failed': {
        id: 'generation-failed',
        type: 'message',
        message: `Let's troubleshoot generation issues:

**Common Causes:**

1️⃣ **Ambiguous Description**
✗ "Make me a bracket"
✓ "L-bracket, 6 inches tall, 4 inches wide"

2️⃣ **Conflicting Requirements**
Check if dimensions or specifications contradict each other

3️⃣ **Connection Issues**
Ensure stable internet connection

4️⃣ **Service Status**
Check our status page for any outages

**Quick Fixes:**
- Refresh the page and try again
- Clear browser cache
- Try a simpler description first
- Use a template instead

Still stuck? I can connect you to support.`,
        options: [
            { id: 'using-templates', label: '💡 Try Using Template', icon: 'Layout' },
            { id: 'check-status', label: '🔍 Check Service Status', icon: 'Activity', action: 'navigate', url: '/' },
            { id: 'contact-human', label: '👤 Contact Support', icon: 'MessageCircle', isBack: true },
            { id: 'troubleshooting', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'wrong-dimensions': {
        id: 'wrong-dimensions',
        type: 'message',
        message: `If dimensions aren't matching your description:

**Check These:**

✓ **Units Consistency**
Make sure you're using the same units throughout
- All inches: "6 inches × 4 inches × 0.25 inches"
- All millimeters: "150mm × 100mm × 6mm"

✓ **Decimal vs Fractional**
- 0.25" = 1/4"
- 0.375" = 3/8"
- Be explicit to avoid confusion

✓ **Dimension Order**
Standard order is Length × Width × Thickness

**If Dimensions Are Still Wrong:**
1. Note the expected vs actual values
2. Screenshot the issue
3. Contact support with details

**Quick Fix:**
Use the parameter sliders to adjust dimensions manually after generation.`,
        options: [
            { id: 'adjust-parameters', label: '⚙️ Learn About Parameter Sliders', icon: 'Sliders' },
            { id: 'describe-component', label: '📝 Description Writing Tips', icon: 'Edit' },
            { id: 'contact-human', label: '👤 Report Issue to Support', icon: 'Flag' },
            { id: 'troubleshooting', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'file-wont-open': {
        id: 'file-wont-open',
        type: 'message',
        message: `Having trouble opening your CAD file?

**DXF Files:**

✓ **Compatible Software:**
- AutoCAD (2020+)
- DraftSight
- LibreCAD (Free)
- FreeCAD (Free)

❌ **Common Mistakes:**
- Opening in wrong software (e.g., image editor)
- Unsupported AutoCAD version (pre-2020)

**STEP Files:**

✓ **Compatible Software:**
- SolidWorks
- Fusion 360
- FreeCAD
- OnShape

**STL Files:**

✓ **Compatible Software:**
- Any 3D viewer or slicer
- Meshmixer (Free)
- MeshLab (Free)

**Quick Solutions:**
1. Verify file extension (.dxf, .step, .stl)
2. Try opening in different software
3. Re-download file (may be corrupted)
4. Check file size (shouldn't be 0 KB)

**Still Having Issues?**
Send us the file and software version you're using.`,
        options: [
            { id: 'supported-formats', label: '📋 See All Compatible Software', icon: 'List' },
            { id: 'redownload-file', label: '⬇️ How to Re-download', icon: 'Download' },
            { id: 'contact-human', label: '👤 Get Technical Support', icon: 'Headphones', isBack: true },
            { id: 'troubleshooting', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'redownload-file': {
        id: 'redownload-file',
        type: 'message',
        message: `**Re-downloading Your Files**

1. Head to the CAD history tab
2. Locate the generation entry and click "Download"
3. Pick the desired format (DXF/STEP/STL)

If the download stalls:
- Clear browser cache
- Disable aggressive extensions (download accelerators, script blockers)
- Try an incognito window to rule out cookies`,
        options: [
            { id: 'file-wont-open', label: 'Back to File Help', icon: 'ArrowLeft', isBack: true },
            { id: 'contact-human', label: 'Still can’t download', icon: 'MessageCircle' }
        ]
    },
    'compliance-confused': {
        id: 'compliance-confused',
        type: 'message',
        message: `Compliance warnings highlight areas that may fail fabrication checks.

To interpret them:
1. Open the compliance report and review the severity (critical, warning)
2. Click on the highlighted dimension in the preview
3. Apply the suggested fix or switch to a compliant template

Need more context? Each warning references the specific clause (AISC, AWS, ASTM) so your engineering team can review internally.`,
        options: [
            { id: 'compliance-reports', label: 'Learn how reports work', icon: 'FileText' },
            { id: 'fix-violations', label: 'Show me how to fix issues', icon: 'Tool' },
            { id: 'contact-human', label: 'Ask an engineer', icon: 'Headphones', isBack: true },
            { id: 'troubleshooting', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'slow-performance': {
        id: 'slow-performance',
        type: 'message',
        message: `Performance tips:

- Close unused browser tabs running heavy 3D apps
- Disable WebGL-blocking extensions (ad/script blockers)
- Ensure hardware acceleration is enabled in browser settings
- Large assemblies? Switch to "Draft Preview" before finalizing

Service status looks good but you're still slow? Send us your browser version, OS, and a HAR file so we can investigate.`,
        options: [
            { id: 'check-status', label: 'Check live status', icon: 'Activity', action: 'navigate', url: '/' },
            { id: 'contact-human', label: 'Report performance issue', icon: 'MessageCircle', isBack: true },
            { id: 'troubleshooting', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    }
};



