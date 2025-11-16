# Requirements Document

## Introduction

This feature enhances the CAD Drawing Generator by replacing the current manual text input and static template selections with dynamic, pre-built templates and suggested prompts fetched from the Zoo Dev API's ML prompt templates endpoint. This will provide users with best-practice examples and professionally crafted prompts for text-to-CAD generation, improving the quality of generated models and reducing user friction.

## Glossary

- **CAD Generator**: The application component that converts text prompts into 3D CAD models using the Zoo Dev API
- **ML Prompt Template**: A pre-built, best-practice text prompt provided by Zoo Dev API for text-to-CAD generation
- **Zoo Dev API**: The external API service (`@kittycad/lib`) used for CAD model generation and conversion
- **Template List**: The collection of prompt templates returned by `ml.list_ml_prompts({type: 'text_to_cad'})`
- **User Interface**: The CAD Generator page component where users interact with prompt selection and model generation

## Requirements

### Requirement 1

**User Story:** As an engineer using the CAD Generator, I want to see pre-built prompt templates from Zoo Dev API, so that I can quickly generate CAD models using best-practice prompts without writing them from scratch.

#### Acceptance Criteria

1. WHEN the CAD Generator page loads, THE User Interface SHALL fetch prompt templates from Zoo Dev API using `ml.list_ml_prompts({type: 'text_to_cad'})`
2. THE User Interface SHALL display the fetched prompt templates in a selectable list format
3. WHEN a user selects a template, THE User Interface SHALL populate the generation input with the selected template text
4. IF the API request fails, THEN THE User Interface SHALL display a fallback message and allow manual text input
5. THE User Interface SHALL display at least the template title and description for each available prompt template

### Requirement 2

**User Story:** As a user, I want the template selection interface to be intuitive and visually organized, so that I can easily browse and choose the most appropriate prompt for my needs.

#### Acceptance Criteria

1. THE User Interface SHALL organize prompt templates in a grid or list layout with clear visual separation
2. WHEN a user hovers over a template, THE User Interface SHALL provide visual feedback indicating the template is selectable
3. THE User Interface SHALL display template metadata including title, description, and any relevant tags or categories
4. THE User Interface SHALL maintain consistent styling with the existing design system (Tailwind CSS with primary color #2563eb)

### Requirement 3

**User Story:** As a developer, I want the prompt template fetching logic to be reusable and maintainable, so that other parts of the application can leverage the same functionality if needed.

#### Acceptance Criteria

1. THE CAD Generator SHALL implement prompt template fetching in a dedicated utility function or hook
2. THE utility function SHALL handle error cases and return appropriate error states
3. THE utility function SHALL cache template results to minimize redundant API calls during a user session
4. THE utility function SHALL accept configuration parameters for template type filtering

### Requirement 4

**User Story:** As a user, I want to still have the option to write custom prompts, so that I can generate CAD models for specific use cases not covered by templates.

#### Acceptance Criteria

1. THE User Interface SHALL provide a toggle or tab to switch between template selection and custom text input modes
2. WHEN in custom input mode, THE User Interface SHALL display a text area for manual prompt entry
3. THE User Interface SHALL preserve the user's custom input when switching between modes
4. THE User Interface SHALL allow users to edit selected template text before generating the CAD model

### Requirement 5

**User Story:** As a system administrator, I want the template fetching to handle API rate limits and errors gracefully, so that the application remains stable even when the Zoo Dev API is unavailable.

#### Acceptance Criteria

1. IF the Zoo Dev API returns a rate limit error, THEN THE User Interface SHALL display an appropriate message to the user
2. IF the Zoo Dev API is unavailable, THEN THE User Interface SHALL fall back to manual text input mode
3. THE User Interface SHALL implement a retry mechanism with exponential backoff for transient API failures
4. THE User Interface SHALL log API errors for debugging purposes without exposing sensitive information to users
