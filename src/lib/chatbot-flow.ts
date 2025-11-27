import { ChatbotFlow, ChatbotNode, validateChatbotFlow } from './chatbot-flow/types';
import { coreSection } from './chatbot-flow/sections/core';
import { gettingStartedSection } from './chatbot-flow/sections/getting-started';
import { generationSection } from './chatbot-flow/sections/generation';
import { standardsSection } from './chatbot-flow/sections/standards';
import { troubleshootingSection } from './chatbot-flow/sections/troubleshooting';
import { supportSection } from './chatbot-flow/sections/support';

const chatbotSections = [
    coreSection,
    gettingStartedSection,
    generationSection,
    standardsSection,
    troubleshootingSection,
    supportSection
];

export const chatbotFlow: ChatbotFlow = Object.assign({}, ...chatbotSections);

if (process.env.NODE_ENV !== 'production') {
    validateChatbotFlow(chatbotFlow);
}

export function getConversationNode(nodeId: string): ChatbotNode {
    return chatbotFlow[nodeId] || chatbotFlow.greeting;
}

export function addToHistory(history: string[], nodeId: string): string[] {
    return [...history, nodeId];
}

export * from './chatbot-flow/types';


