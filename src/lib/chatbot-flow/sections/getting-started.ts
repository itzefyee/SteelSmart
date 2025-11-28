import { ChatbotSection } from '../types';

export const gettingStartedSection: ChatbotSection = {
    'getting-started': {
        id: 'getting-started',
        type: 'message',
        message: "Great! Let me show you around. What would you like to learn about first?",
        options: [
            { id: 'what-is-steelsmart', label: 'What is SteelSmart?', icon: 'Info' },
            { id: 'how-it-works', label: 'How does it work?', icon: 'HelpCircle' },
            { id: 'supported-formats', label: 'What formats do you support?', icon: 'FileText' },
            { id: 'example-uses', label: 'Show me examples', icon: 'Eye' },
            { id: 'greeting', label: '← Back to Menu', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'what-is-steelsmart': {
        id: 'what-is-steelsmart',
        type: 'message',
        message: `SteelSmart is an AI-powered CAD drawing generator specifically designed for steel manufacturing.

**Key Features:**
- Generate CAD drawings from natural language descriptions
- Automatic compliance checking (AISC 360, AWS D1.1, ASTM)
- Export in DXF, STEP, and STL formats
- Integrated procurement workflow
- Industry-standard validation

It's like having a CAD expert and compliance engineer available 24/7! ⚡`,
        media: {
            type: 'image',
            url: '/images/chatbot/steelsmart-overview.png',
            alt: 'SteelSmart Overview'
        },
        options: [
            { id: 'how-it-works', label: 'How does it work?', icon: 'Play' },
            { id: 'try-demo', label: '🎯 Try a Demo', icon: 'Play', action: 'navigate', url: '/cad-generator' },
            { id: 'getting-started', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'how-it-works': {
        id: 'how-it-works',
        type: 'message',
        message: `Here's how easy it is to generate CAD drawings:

**Step 1:** Describe your component in plain English
_"L-bracket, 6 inches tall, 4 inches wide, 1/4 inch thick, with four 1/2 inch holes"_

**Step 2:** AI generates your CAD drawing (<5 seconds)

**Step 3:** Automatic compliance validation against AISC 360, AWS D1.1

**Step 4:** Download in your preferred format (DXF, STEP, STL)

**Step 5:** Proceed to RFQ if you want to procure the part

Want to see it in action? Try it now!`,
        // media: {
        //     type: 'video',
        //     url: '/videos/how-it-works.mp4',
        //     thumbnail: '/images/chatbot/how-it-works-thumb.png'
        // },
        options: [
            { id: 'try-demo', label: '✨ Try It Now', icon: 'Sparkles', action: 'navigate', url: '/cad-generator' },
            { id: 'example-uses', label: 'Show Examples', icon: 'Eye' },
            { id: 'getting-started', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'supported-formats': {
        id: 'supported-formats',
        type: 'message',
        message: `We support all major CAD formats:

**Export Formats:**
✓ **DXF** - AutoCAD Drawing Exchange Format (Most Common)
✓ **STEP** - Universal 3D CAD format (ISO 10303)
✓ **STL** - For 3D printing and visualization

**Compatible Software:**
- AutoCAD (2020-2024)
- SolidWorks (2022-2024)
- Fusion 360
- FreeCAD
- Any software supporting STEP files

**Output Quality:**
- Industry-standard precision
- Fully editable drawings
- Dimension annotations included
- Material specifications embedded

Need help choosing a format?`,
        options: [
            { id: 'format-dxf', label: 'Tell me about DXF', icon: 'FileText' },
            { id: 'format-step', label: 'Tell me about STEP', icon: 'Cube' },
            { id: 'format-stl', label: 'Tell me about STL', icon: 'Box' },
            { id: 'getting-started', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'format-dxf': {
        id: 'format-dxf',
        type: 'message',
        message: `**DXF (Drawing Exchange Format)**

- Best for 2D CAD workflows and CNC machines
- Preserves layers, line types, and annotations
- Opens natively in AutoCAD, DraftSight, LibreCAD

**Tip:** Use DXF if you need quick edits in AutoCAD or are sending flat patterns to a laser/plasma cutter.`,
        options: [
            { id: 'supported-formats', label: '← Back to Formats', icon: 'ArrowLeft', isBack: true },
            { id: 'try-demo', label: 'Generate DXF Now', icon: 'Sparkles', action: 'navigate', url: '/cad-generator' }
        ]
    },
    'format-step': {
        id: 'format-step',
        type: 'message',
        message: `**STEP (ISO 10303)**

- Neutral 3D CAD format for solids and assemblies
- Retains parametric data for downstream editing
- Ideal for SolidWorks, Fusion 360, Onshape, Inventor

**Tip:** Choose STEP when collaborating across CAD platforms or when you need to run simulations.`,
        options: [
            { id: 'supported-formats', label: '← Back to Formats', icon: 'ArrowLeft', isBack: true },
            { id: 'try-demo', label: 'Generate STEP Now', icon: 'Sparkles', action: 'navigate', url: '/cad-generator' }
        ]
    },
    'format-stl': {
        id: 'format-stl',
        type: 'message',
        message: `**STL (Stereolithography)**

- Triangle mesh optimized for 3D printing and visualization
- Lightweight and widely supported
- Recommended for slicers (PrusaSlicer, Cura) or viewer tools (Meshmixer)

**Tip:** Pick STL when you want to validate the geometry quickly or send parts to additive manufacturing.`,
        options: [
            { id: 'supported-formats', label: '← Back to Formats', icon: 'ArrowLeft', isBack: true },
            { id: 'try-demo', label: 'Generate STL Now', icon: 'Sparkles', action: 'navigate', url: '/cad-generator' }
        ]
    },
    'example-uses': {
        id: 'example-uses',
        type: 'carousel',
        message: "Here are some examples of what you can create with SteelSmart:",
        items: [
            {
                title: 'I-Beam Template',
                description: 'Standard structural I-beam with configurable flange and web dimensions.',
                image: 'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/steel-beam-001/preview.png',
                action: { label: 'Try I-Beam Template', url: '/cad-generator?tab=template&template=i-beam' }
            },
            {
                title: 'Drill Guide Template',
                description: 'Precision surgical drill guide with customizable bit sizes and grip styles.',
                image: 'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/surgical_drill_guide/preview.png',
                action: { label: 'Try Drill Guide Template', url: '/cad-generator?tab=template&template=drill-guide' }
            },
            {
                title: 'Brake Rotor Template',
                description: 'Automotive brake rotor with adjustable bolt pattern and rotor diameters.',
                image: 'https://emgzohbqnkfxgzfvphzc.supabase.co/storage/v1/object/public/product-images/products/brake_rotor/preview.png',
                action: { label: 'Try Brake Rotor Template', url: '/cad-generator?tab=template&template=brake-rotor' }
            }
        ],
        options: [
            { id: 'try-demo', label: '🎯 Generate My Own', icon: 'Plus', action: 'navigate', url: '/cad-generator' },
            { id: 'getting-started', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    }
};

