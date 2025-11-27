import { ChatbotSection } from '../types';

export const generationSection: ChatbotSection = {
    'how-to-generate': {
        id: 'how-to-generate',
        type: 'message',
        message: "I'll help you generate your first CAD drawing! What do you need help with?",
        options: [
            { id: 'describe-component', label: 'How do I describe my component?', icon: 'MessageSquare' },
            { id: 'using-templates', label: 'Can I use templates?', icon: 'Layout' },
            { id: 'adjust-parameters', label: 'How do I adjust dimensions?', icon: 'Sliders' },
            { id: 'understanding-preview', label: 'Understanding the 3D preview', icon: 'Eye' },
            { id: 'greeting', label: '← Back to Menu', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'describe-component': {
        id: 'describe-component',
        type: 'message',
        message: `Writing good descriptions is easy! Here are some tips:

**Good Description Structure:**
1. Component type (L-bracket, flat plate, etc.)
2. Main dimensions (length, width, thickness)
3. Material (if known)
4. Holes (count, size, pattern)
5. Any special features

**Example Descriptions:**

✅ **Good:** "L-bracket, 6 inches tall, 4 inches wide, 1/4 inch thick, with four 1/2 inch holes in a square pattern"

✅ **Good:** "Rectangular steel plate, 12x8 inches, 3/8 inch thick, A36 steel, two 3/4 inch holes 6 inches apart"

❌ **Too Vague:** "I need a bracket"

❌ **Too Complex:** "Need a structurally optimized mounting solution with FEA-validated topology..."

**Pro Tips:**
- Use inches or millimeters (be consistent)
- Mention hole patterns if specific
- Standard sizes work best for faster fabrication

Ready to try?`,
        options: [
            { id: 'try-demo', label: '✨ Generate Now', icon: 'Sparkles', action: 'navigate', url: '/generate' },
            { id: 'using-templates', label: 'Or use a template instead', icon: 'Layout' },
            { id: 'how-to-generate', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'using-templates': {
        id: 'using-templates',
        type: 'message',
        message: `Templates are the fastest way to get started!

**Available Templates:**

🔷 **I-Beam**
Structural I-beam with configurable flange, web, and material selections.

🔷 **Drill Guide**
Surgical drill guide with multiple bit sizes, grip styles, and materials.

🔷 **Brake Rotor**
Automotive brake rotor with adjustable bolt pattern, rotor type, and materials.

**Using Templates:**
1. Select a template
2. Adjust dimensions with sliders
3. Modify hole count and positions
4. Preview in 3D
5. Generate and download

Templates come pre-validated for compliance! ✓`,
        options: [
            { id: 'browse-templates', label: '📋 Browse All Templates', icon: 'Grid', action: 'navigate', url: '/templates' },
            { id: 'try-demo', label: '▶ Start with Template', icon: 'Play', action: 'navigate', url: '/generate?tab=templates' },
            { id: 'how-to-generate', label: '← Back', icon: 'ArrowLeft', isBack: true }
        ]
    },
    'adjust-parameters': {
        id: 'adjust-parameters',
        type: 'message',
        message: `**Parameter Sliders**

- Use the Length/Width/Thickness sliders for precise adjustments (supports decimals)
- Hold Shift while dragging for 0.1 increments
- Toggle "Advanced" to edit hole spacing, profiles, and material

**Shortcuts:**
- Double-click a value to type exact dimensions
- Click the reset icon to revert to template defaults
- Use the lock icon to keep proportions synced`,
        options: [
            { id: 'how-to-generate', label: 'Back to Generator Help', icon: 'ArrowLeft', isBack: true },
            { id: 'describe-component', label: 'Need writing tips instead?', icon: 'Edit' }
        ]
    },
    'understanding-preview': {
        id: 'understanding-preview',
        type: 'message',
        message: `**3D Preview Basics**

- Orbit: drag with left mouse / one finger
- Pan: right-click drag / two-finger drag
- Zoom: mouse wheel / pinch

Layers:
- **CAD Outline:** shows manufacturing geometry
- **Compliance Overlay:** highlights violations in red
- **Dimensions:** toggle labels to inspect critical measurements

Click the flag icons in the preview to jump directly to the compliance report section that needs attention.`,
        options: [
            { id: 'how-to-generate', label: 'Back to Generator Help', icon: 'ArrowLeft', isBack: true },
            { id: 'troubleshooting', label: 'Still confused? Get help', icon: 'HelpCircle' }
        ]
    }
};

