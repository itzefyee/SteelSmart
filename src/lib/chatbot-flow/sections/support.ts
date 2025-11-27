import { ChatbotSection } from '../types';

export const supportSection: ChatbotSection = {
    'contact-human': {
        id: 'contact-human',
        type: 'form',
        message: "I'll connect you with our support team. Please provide some details:",
        formFields: [
            {
                id: 'name',
                label: 'Your Name',
                type: 'text',
                required: true,
                placeholder: 'John Smith'
            },
            {
                id: 'email',
                label: 'Email Address',
                type: 'email',
                required: true,
                placeholder: 'john@company.com'
            },
            {
                id: 'category',
                label: 'Issue Category',
                type: 'select',
                required: true,
                options: [
                    { value: 'technical', label: 'Technical Issue' },
                    { value: 'billing', label: 'Billing Question' },
                    { value: 'feature', label: 'Feature Request' },
                    { value: 'other', label: 'Other' }
                ]
            },
            {
                id: 'message',
                label: 'Describe Your Issue',
                type: 'textarea',
                required: true,
                placeholder: 'Please provide details...',
                rows: 4
            }
        ],
        submitLabel: 'Send to Support Team',
        onSubmit: 'submitSupportTicket',
        successMessage: {
            id: 'contact-success',
            type: 'message',
            message: `✅ **Support Ticket Created**

We've received your message and will respond within 24 hours (usually much faster!).

**What Happens Next:**
1. You'll receive an email confirmation
2. A support specialist will review your ticket
3. They'll reach out with a solution or follow-up questions

**Ticket Reference:** #ST-{timestamp}

**Average Response Time:** 4 hours

In the meantime, you can:`,
            options: [
                { id: 'troubleshooting', label: '🔍 Browse FAQs', icon: 'Book' },
                { id: 'try-demo', label: '▶ Continue Using SteelSmart', icon: 'Play', action: 'navigate', url: '/generate' },
                { id: 'greeting', label: '← Back to Menu', icon: 'Home' }
            ]
        }
    }
};


