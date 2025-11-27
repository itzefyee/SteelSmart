import { ChatbotSection } from '../types';

export const standardsSection: ChatbotSection = {
    'standards-info': {
        id: 'standards-info',
        type: 'message',
        message: "I can explain our standards compliance features. What would you like to know?",
        options: [
            { id: 'aisc-360', label: 'AISC 360 Compliance', icon: 'Shield' },
            { id: 'aws-d1-1', label: 'AWS D1.1 Welding Standards', icon: 'Flame' },
            { id: 'astm-materials', label: 'ASTM Material Standards', icon: 'Package' },
            { id: 'compliance-reports', label: 'Understanding Compliance Reports', icon: 'FileText' },
            { id: 'greeting', label: '← Back to Menu', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'aisc-360': {
        id: 'aisc-360',
        type: 'message',
        message: `**AISC 360: Structural Steel Buildings**

We automatically validate your drawings against these AISC 360 requirements:

✓ **Edge Distance (Table J3.4)**
Minimum distance from hole centers to edges
- Rolled edges: 1.25 × hole diameter
- Sheared edges: 1.75 × hole diameter

✓ **Hole Spacing (Section J3.3)**
Minimum center-to-center hole spacing
- Minimum: 2⅔ × hole diameter
- Preferred: 3 × hole diameter

✓ **Weld Sizing (Table J2.4)**
Minimum fillet weld sizes based on material thickness

✓ **Dimensional Tolerances (AISC 303 Section 6)**
- Length: ±1/8" for ≤10 ft
- Hole diameter: +1/16", -0

**What This Means for You:**
Every generated drawing is checked against these standards before you download. If there's a violation, you'll get specific recommendations to fix it.`,
        media: {
            type: 'image',
            url: '/images/standards/aisc-360-diagram.png',
            alt: 'AISC 360 Compliance Diagram'
        },
        options: [
            { id: 'example-violation', label: '📊 Show Example Report', icon: 'BarChart' },
            { id: 'aws-d1-1', label: 'Tell me about AWS D1.1', icon: 'ArrowRight' },
            { id: 'standards-info', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'example-violation': {
        id: 'example-violation',
        type: 'message',
        message: `**Sample Compliance Finding**

Component: 6" L-bracket with 3/4" holes

- **Issue:** Hole spacing measured 2.5" (minimum required 3.0")
- **Standard:** AISC 360 Section J3.3
- **Recommendation:** Increase spacing to ≥3.0" or reduce hole diameter to 5/8"
- **Status:** Critical – must fix before manufacturing`,
        options: [
            { id: 'aisc-360', label: '← Back to AISC Overview', icon: 'ArrowLeft', isBack: true },
            { id: 'fix-violations', label: 'How do I fix it?', icon: 'Tool' }
        ]
    },
    'aws-d1-1': {
        id: 'aws-d1-1',
        type: 'message',
        message: `**AWS D1.1: Structural Welding Code - Steel**

We validate welding-related requirements:

✓ **Prequalified Joint Details**
Standard joint types that don't require special approval

✓ **Preheat Requirements (Table 3.2)**
Determines if material needs heating before welding
- Based on thickness, material grade, and temperature

✓ **Weld Accessibility**
Ensures joints are accessible for welding
- Minimum clearance: 3 inches
- Groove angles: ≥60° for V-grooves

✓ **Weld Symbol Standards (AWS A2.4)**
Validates proper weld notation and specifications

**Example Checks:**
- Thickness > 1": May require preheat
- Temperature < 32°F: Preheat required
- Tight corners: Accessibility warning`,
        options: [
            { id: 'preheat-calculator', label: '🔥 When do I need preheat?', icon: 'Thermometer' },
            { id: 'astm-materials', label: 'Tell me about ASTM', icon: 'ArrowRight' },
            { id: 'standards-info', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'preheat-calculator': {
        id: 'preheat-calculator',
        type: 'message',
        message: `**Preheat Guidance (AWS D1.1 Table 3.2)**

Checklist:
1. Determine material group (A36 → Group I, A572 → Group II, etc.)
2. Measure the thickest plate being welded
3. Check ambient temperature

Examples:
- Group II material at 1" thick → 150°F preheat
- Group IV material at 1.5" thick → 225°F preheat

Rule of thumb: when in doubt or working below 32°F, preheat to at least 150°F and document it in the weld procedure.`,
        options: [
            { id: 'aws-d1-1', label: '← Back to AWS D1.1', icon: 'ArrowLeft', isBack: true },
            { id: 'contact-human', label: 'Ask welding expert', icon: 'MessageCircle' }
        ]
    },
    'astm-materials': {
        id: 'astm-materials',
        type: 'message',
        message: `**ASTM Material Standards**

- **ASTM A36:** Structural steel plate, standard yield 36 ksi
- **ASTM A572 Grade 50:** High-strength low-alloy plate, 50 ksi yield
- **ASTM A992:** Preferred for wide-flange shapes, optimized for welding
- **ASTM A500:** Cold-formed tubing (Rounds, Square, Rectangular)

SteelSmart tags every part with the recommended ASTM spec based on geometry and use case so procurement teams know exactly what to source.`,
        options: [
            { id: 'standards-info', label: 'Back to Standards Menu', icon: 'ArrowLeft', isBack: true },
            { id: 'contact-human', label: 'Need a custom spec?', icon: 'MessageSquare' }
        ]
    },
    'compliance-reports': {
        id: 'compliance-reports',
        type: 'message',
        message: `**Understanding Your Compliance Report**

Every generated drawing includes a detailed compliance report:

📊 **Overall Score (0-100)**
Combines all checks into one score
- 90-100: Ready to manufacture ✓
- 70-89: Review recommended ⚠
- Below 70: Issues must be fixed ✗

🔴 **Critical Violations**
Must be fixed before manufacturing
Example: "Hole spacing 2.5" < minimum 3.0""

🟡 **Warnings**
Should be reviewed, but not blocking
Example: "Non-standard hole size requires special tooling"

🟢 **Passed Checks**
Items that meet all requirements

📋 **Actionable Recommendations**
Specific steps to fix issues
Example: "Increase hole spacing by 0.5" or reduce hole diameter to 3/4""

You can download the full report as PDF alongside your CAD file.`,
        media: {
            type: 'image',
            url: '/images/chatbot/compliance-report-sample.png',
            alt: 'Sample Compliance Report'
        },
        options: [
            { id: 'view-sample-report', label: '📄 View Sample Report', icon: 'FileText', action: 'modal', content: 'sample-report' },
            { id: 'fix-violations', label: 'How do I fix violations?', icon: 'Tool' },
            { id: 'standards-info', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'fix-violations': {
        id: 'fix-violations',
        type: 'message',
        message: `**Fixing Violations**

1. Open the compliance report and locate the flagged dimension
2. Use parameter sliders or manual edits to adjust the value
3. Re-run validation – violations switch from red → green when resolved

Common fixes:
- Increase edge distance or reduce hole diameter
- Add gussets to improve stiffness scores
- Select a thicker material to pass buckling checks

If multiple violations appear, tackle critical issues first (red markers).`,
        options: [
            { id: 'compliance-reports', label: 'Back to Reports Overview', icon: 'ArrowLeft', isBack: true },
            { id: 'contact-human', label: 'Need expert review?', icon: 'Headphones' }
        ]
    }
};

