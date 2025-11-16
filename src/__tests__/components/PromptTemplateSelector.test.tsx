import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PromptTemplateSelector from '@/components/cad/PromptTemplateSelector';
import { MLPromptTemplate } from '@/data/sample-data';

const mockTemplates: MLPromptTemplate[] = [
  {
    id: 'template-1',
    title: 'I-Beam',
    description: 'Standard structural I-beam with specified dimensions',
    prompt: 'I-beam, 12 in long, 4 in high',
    category: 'structural',
    tags: ['beam', 'structural'],
  },
  {
    id: 'template-2',
    title: 'Brake Rotor',
    description: 'Vented automotive brake rotor',
    prompt: 'A 320mm vented brake rotor',
    category: 'automotive',
    tags: ['brake', 'rotor'],
  },
];

describe('PromptTemplateSelector', () => {
  it('renders templates in grid layout', () => {
    const onSelect = vi.fn();
    render(
      <PromptTemplateSelector
        templates={mockTemplates}
        selectedTemplateId={null}
        onSelectTemplate={onSelect}
      />
    );

    expect(screen.getByText('I-Beam')).toBeInTheDocument();
    expect(screen.getByText('Brake Rotor')).toBeInTheDocument();
  });

  it('displays template details correctly', () => {
    const onSelect = vi.fn();
    render(
      <PromptTemplateSelector
        templates={mockTemplates}
        selectedTemplateId={null}
        onSelectTemplate={onSelect}
      />
    );

    expect(screen.getByText('Standard structural I-beam with specified dimensions')).toBeInTheDocument();
    expect(screen.getByText('Structural')).toBeInTheDocument();
    expect(screen.getByText('beam')).toBeInTheDocument();
  });

  it('calls onSelectTemplate when template is clicked', () => {
    const onSelect = vi.fn();
    render(
      <PromptTemplateSelector
        templates={mockTemplates}
        selectedTemplateId={null}
        onSelectTemplate={onSelect}
      />
    );

    const templateButton = screen.getByRole('button', { name: /Select template: I-Beam/i });
    fireEvent.click(templateButton);

    expect(onSelect).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it('highlights selected template', () => {
    const onSelect = vi.fn();
    render(
      <PromptTemplateSelector
        templates={mockTemplates}
        selectedTemplateId="template-1"
        onSelectTemplate={onSelect}
      />
    );

    const selectedButton = screen.getByRole('button', { name: /Select template: I-Beam/i });
    expect(selectedButton).toHaveClass('border-primary');
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('shows empty state when no templates', () => {
    const onSelect = vi.fn();
    render(
      <PromptTemplateSelector
        templates={[]}
        selectedTemplateId={null}
        onSelectTemplate={onSelect}
      />
    );

    expect(screen.getByText('No templates available')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const onSelect = vi.fn();
    render(
      <PromptTemplateSelector
        templates={[]}
        selectedTemplateId={null}
        onSelectTemplate={onSelect}
        isLoading={true}
      />
    );

    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});
