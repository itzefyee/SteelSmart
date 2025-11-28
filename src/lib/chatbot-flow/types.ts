export type ChatbotNodeType = 'message' | 'carousel' | 'form';

export type Media =
    | { type: 'image'; url: string; alt: string }
    | { type: 'video'; url: string; thumbnail: string };

export type OptionAction = 'navigate' | 'link' | 'form' | 'modal';

export interface ChatbotContext {
    [key: string]: unknown;
}

interface ConditionalMetadata {
    condition?: (context: ChatbotContext) => boolean;
    next?: string | ((context: ChatbotContext) => string);
}

interface BaseOption extends ConditionalMetadata {
    id: string;
    label: string;
    icon?: string;
    isBack?: boolean;
}

interface NodeOption extends BaseOption {
    action?: undefined;
}

interface NavigateOption extends BaseOption {
    action: 'navigate';
    url: string;
}

interface LinkOption extends BaseOption {
    action: 'link';
    url: string;
}

interface FormOption extends BaseOption {
    action: 'form';
    formType: string;
}

interface ModalOption extends BaseOption {
    action: 'modal';
    content: string;
}

export type ChatbotOption = NodeOption | NavigateOption | LinkOption | FormOption | ModalOption;

interface BaseNode {
    id: string;
    type: ChatbotNodeType;
    message: string;
    options?: ChatbotOption[];
}

export interface MessageNode extends BaseNode {
    type: 'message';
    media?: Media;
}

export interface CarouselItem {
    title: string;
    description: string;
    image: string;
    action?: { label: string; url: string };
}

export interface CarouselNode extends BaseNode {
    type: 'carousel';
    items: CarouselItem[];
}

export interface FormFieldOption {
    value: string;
    label: string;
}

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'select' | 'textarea';
    required?: boolean;
    placeholder?: string;
    options?: FormFieldOption[];
    rows?: number;
}

export interface FormNode extends BaseNode {
    type: 'form';
    formFields: FormField[];
    submitLabel: string;
    onSubmit: string;
    successMessage: MessageNode;
}

export type ChatbotNode = MessageNode | CarouselNode | FormNode;
export type ChatbotSection = Record<string, ChatbotNode>;
export type ChatbotFlow = Record<string, ChatbotNode>;

export function validateChatbotFlow(flow: ChatbotFlow): void {
    const nodeIds = new Set(Object.keys(flow));

    Object.values(flow).forEach((node) => {
        node.options?.forEach((option) => {
            const targetId = typeof option.next === 'string' ? option.next : option.id;

            if (!option.action) {
                const resolvedId = typeof targetId === 'string' ? targetId : option.id;
                if (!nodeIds.has(resolvedId)) {
                    const message = `Chatbot option "${option.id}" referenced from node "${node.id}" does not map to a valid node id.`;
                    throw new Error(message);
                }
            }
        });
    });
}



