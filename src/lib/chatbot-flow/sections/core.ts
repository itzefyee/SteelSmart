import { ChatbotSection } from '../types';

export const coreSection: ChatbotSection = {
    greeting: {
        id: 'greeting',
        type: 'message',
        message: "👋 Hi! I'm SteelBot, your CAD assistant. How can I help you today?",
        options: [
            { id: 'getting-started', label: '🚀 Getting Started', icon: 'Rocket' },
            { id: 'how-to-generate', label: '⚡ Generate a CAD Drawing', icon: 'Zap' },
            { id: 'standards-info', label: '📋 Standards & Compliance', icon: 'CheckCircle' },
            { id: 'troubleshooting', label: '🔧 Troubleshooting', icon: 'Wrench' },
            { id: 'contact-human', label: '👤 Talk to Support', icon: 'MessageCircle' }
        ]
    }
};


