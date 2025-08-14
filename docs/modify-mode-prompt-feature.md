# Modify Mode - Custom Prompt Feature

## Overview

The AI Builder Integration now supports a **Custom Prompt** modification type, allowing users to provide specific instructions for how they want their selected text to be modified.

## How It Works

### 1. Text Selection

- Select any text in the editor (minimum 3 characters, maximum 5000 characters)
- Click the "Modify" button in the AI Action Toolbar

### 2. Modification Type Selection

Choose from 5 modification types:

- **Rewrite**: Improve clarity, flow, and academic quality
- **Expand**: Add more detail, examples, and supporting information
- **Summarize**: Condense to capture essential points concisely
- **Improve Clarity**: Enhance readability and simplify complex sentences
- **Custom Prompt**: Provide your own modification instructions ✨ _NEW_

### 3. Custom Prompt Input (New Feature)

When you select "Custom Prompt":

- A text input dialog appears
- Enter specific instructions (e.g., "Make this more technical and add examples")
- Use the lightbulb icon to see suggested prompts
- Submit with Ctrl+Enter or click "Modify Text"

### 4. Preview and Apply

- Review the AI-generated modification
- Compare original vs modified text side-by-side
- Accept, reject, or regenerate the modification

## Example Custom Prompts

Here are some effective custom prompts you can use:

### Academic Writing

- "Make this more formal and academic"
- "Add citations and references where appropriate"
- "Convert to passive voice for academic style"

### Technical Content

- "Add more technical details and specifications"
- "Include code examples and implementation details"
- "Explain the underlying algorithms and methods"

### Audience Adaptation

- "Simplify this for a general audience"
- "Make this suitable for undergraduate students"
- "Adapt this for industry professionals"

### Structure and Format

- "Convert to bullet points with clear headings"
- "Reorganize into a logical step-by-step process"
- "Add section headers and improve organization"

### Content Enhancement

- "Add real-world examples and case studies"
- "Include potential challenges and solutions"
- "Expand with pros and cons analysis"

## Technical Implementation

### New Components

- `CustomPromptInput`: Interactive prompt input with suggestions
- Enhanced `ModificationTypeSelector`: Includes prompt option
- Updated `AIContentPreview`: Handles custom prompt modifications

### Backend Support

- `ModificationType.PROMPT`: New enum value
- `AIModifyRequest.customPrompt`: Optional field for custom instructions
- Enhanced AI handler with custom prompt processing

### Testing

- 40+ comprehensive test cases
- Full workflow testing from selection to application
- Error handling and accessibility compliance

## Benefits

1. **Flexibility**: Users can specify exactly how they want text modified
2. **Precision**: More targeted modifications than predefined types
3. **Creativity**: Enables unique modification approaches
4. **Efficiency**: Guided suggestions help users craft effective prompts
5. **Consistency**: Same preview/apply workflow as other modification types

## Usage Tips

- Be specific in your prompts for better results
- Use action verbs (e.g., "Add", "Convert", "Simplify")
- Specify the target audience or context when relevant
- Combine multiple instructions (e.g., "Make more formal and add examples")
- Use the suggestion prompts as starting points for your own ideas
