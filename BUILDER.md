# Builder Tool with AI Integration

## Overview

The Builder tool is an advanced markdown editor integrated with AI capabilities for thesis proposal writing. It provides multiple AI-powered modes to assist users in creating, continuing, and modifying their academic content while maintaining proper markdown formatting and academic tone.

## Features

### Core Functionality
- **Rich Markdown Editor**: Built on Milkdown editor with full markdown support
- **Real-time Content Synchronization**: Automatic saving and content updates
- **Text Selection Tracking**: Precise cursor and selection management
- **Academic Context Awareness**: Integration with thesis proposal structure

### AI Integration Modes

#### 1. Prompt Mode
Generate content from custom prompts to overcome writer's block and create initial drafts.

**How to Use:**
1. Click the "Prompt" button in the AI Action Toolbar
2. Enter your prompt in the input field
3. Review the generated content
4. Accept, reject, or regenerate as needed

**Best Practices:**
- Be specific in your prompts
- Include context about your thesis topic
- Use action verbs (e.g., "Explain", "Analyze", "Compare")

#### 2. Continue Mode
Continue generating content from your current cursor position while maintaining style and flow.

**How to Use:**
1. Position your cursor where you want to continue writing
2. Click the "Continue" button in the AI Action Toolbar
3. Review the generated continuation
4. Accept, reject, or regenerate as needed

**Features:**
- Maintains writing style and tone
- Preserves document structure
- Context-aware content generation

#### 3. Modify Mode
Modify selected text with AI assistance using various transformation options.

**How to Use:**
1. Select the text you want to modify
2. Click the "Modify" button in the AI Action Toolbar
3. Choose from modification types:
   - **Rewrite**: Improve clarity, flow, and academic quality
   - **Expand**: Add more detail, examples, and supporting information
   - **Summarize**: Condense to capture essential points concisely
   - **Improve Clarity**: Enhance readability and simplify complex sentences
   - **Custom Prompt**: Provide your own modification instructions
4. Preview the changes side-by-side
5. Accept, reject, or regenerate the modification

## User Interface

### AI Action Toolbar

The AI Action Toolbar provides quick access to all AI modes with visual indicators:

- **Mode Buttons**: Clearly labeled buttons for each AI mode
- **Status Indicators**: Visual feedback for active modes and processing states
- **Error Handling**: Clear error messages with retry options
- **Accessibility**: Full keyboard navigation and screen reader support

### Content Confirmation System

When AI generates content, you'll see a confirmation dialog with:
- **Original vs Generated Content**: Side-by-side comparison
- **Metadata Information**: Token usage and processing time
- **Action Options**: Accept, Reject, or Regenerate
- **Preview Mode**: See changes before applying them

## Technical Architecture

### Frontend Components

#### Builder Component (`src/components/ui/builder.tsx`)
The main container component that orchestrates all AI functionality.

**Key Features:**
- State management for AI modes and content
- Integration with Milkdown editor
- Error handling and user feedback
- Content synchronization

**Props:**
```typescript
interface BuilderProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversation: { title: string; id: string };
}
```

#### AI Action Toolbar (`src/components/ui/ai-action-toolbar.tsx`)
Provides the main interface for AI mode selection and status display.

**Features:**
- Mode selection buttons with tooltips
- Processing state indicators
- Error notifications with recovery options
- Accessibility compliance

#### AI Mode Manager Hook (`src/hooks/use-ai-mode-manager.ts`)
Central state management for all AI operations.

**Capabilities:**
- Mode state management
- AI request processing
- Error handling and recovery
- Performance optimization
- Content validation

### Backend Integration

#### AI Handler (`src/worker/handlers/builder-ai.ts`)
Processes AI requests and manages context.

**Endpoints:**
- `POST /api/builder/ai/prompt` - Process prompt requests
- `POST /api/builder/ai/continue` - Handle content continuation
- `POST /api/builder/ai/modify` - Manage text modifications

**Features:**
- Context-aware AI generation
- Academic tone preservation
- Error handling and validation
- Performance optimization

## Error Handling

### Comprehensive Error Management

The Builder tool includes robust error handling:

#### Network Errors
- Automatic retry with exponential backoff
- Offline detection and graceful degradation
- User-friendly error messages

#### AI Service Errors
- Service unavailability handling
- Rate limiting management
- Authentication error recovery

#### Validation Errors
- Input validation with real-time feedback
- Text selection validation
- Content format validation

#### Recovery Strategies
- Graceful degradation to manual editing
- Retry mechanisms with user control
- Clear error communication

## Performance Optimization

### Caching System
- AI response caching for similar requests
- Context optimization for faster processing
- Intelligent cache invalidation

### Request Optimization
- Request debouncing to prevent excessive API calls
- Optimistic UI updates for better user experience
- Context size optimization for AI requests

### Performance Monitoring
- Token usage tracking
- Processing time measurement
- Performance metrics collection

## Accessibility

### Keyboard Navigation
- Full keyboard support for all AI modes
- Logical tab order through interface
- Keyboard shortcuts for common actions

### Screen Reader Support
- Proper ARIA labels and descriptions
- Status announcements for AI processing
- Clear content structure for navigation

### Visual Accessibility
- High contrast mode support
- Scalable interface elements
- Clear visual indicators for all states

## Integration with Thesis Copilot

### Context Integration
- Automatic integration with Idealist tool data
- Conversation context awareness
- Academic structure preservation

### Data Flow
1. User interacts with Builder interface
2. AI Mode Manager processes requests
3. Backend handler manages AI service communication
4. Context manager provides relevant thesis data
5. Generated content is formatted and presented
6. User confirms or modifies the content

## Best Practices

### For Users

#### Writing Effective Prompts
- Be specific about what you want
- Provide context about your thesis topic
- Use clear, actionable language
- Include target audience information

#### Using Continue Mode
- Position cursor at natural break points
- Ensure sufficient context exists
- Review generated content for consistency
- Use with existing structured content

#### Modifying Content Effectively
- Select meaningful text chunks (not single words)
- Choose appropriate modification types
- Review changes carefully before accepting
- Use custom prompts for specific needs

### For Developers

#### Component Integration
- Follow the established state management patterns
- Use the AI Mode Manager hook for consistency
- Implement proper error boundaries
- Maintain accessibility standards

#### Error Handling
- Always provide user-friendly error messages
- Implement retry mechanisms where appropriate
- Log errors for debugging purposes
- Test error scenarios thoroughly

#### Performance Considerations
- Use debouncing for user input
- Implement proper loading states
- Cache responses when appropriate
- Monitor performance metrics

## Troubleshooting

### Common Issues

#### AI Not Responding
1. Check internet connection
2. Verify AI service status
3. Try refreshing the page
4. Contact support if issues persist

#### Content Not Generating
1. Ensure prompts are clear and specific
2. Check for sufficient context in continue mode
3. Verify text selection for modify mode
4. Try regenerating with different parameters

#### Performance Issues
1. Clear browser cache
2. Check for large document sizes
3. Reduce context size if needed
4. Monitor network connectivity

### Error Messages

#### "AI service temporarily unavailable"
- **Cause**: Backend AI service is down or overloaded
- **Solution**: Wait a few minutes and retry
- **Prevention**: System automatically retries with backoff

#### "Insufficient context for continuation"
- **Cause**: Not enough existing content to continue from
- **Solution**: Add more content or use prompt mode instead
- **Prevention**: Ensure adequate context before using continue mode

#### "Invalid text selection"
- **Cause**: No text selected or selection too small/large
- **Solution**: Select appropriate text chunk (3-5000 characters)
- **Prevention**: Follow text selection guidelines

## API Reference

### AI Mode Manager Hook

```typescript
const aiModeManager = useAIModeManager(conversationId, documentContent, config);

// Core methods
aiModeManager.setMode(AIMode.PROMPT);
aiModeManager.processPrompt(prompt, cursorPosition);
aiModeManager.processContinue(cursorPosition, selectedText);
aiModeManager.processModify(selectedText, modificationType);

// State properties
aiModeManager.currentMode;
aiModeManager.isProcessing;
aiModeManager.errorState;
aiModeManager.hasSelectedText;
```

### AI Response Format

```typescript
interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    tokensUsed: number;
    processingTime: number;
    requestId: string;
    timestamp: number;
  };
}
```

## Development

### Setup
1. Install dependencies: `npm install`
2. Set up environment variables (see `.env.example`)
3. Start development server: `npm run dev`
4. Run tests: `npm test`

### Testing
- Unit tests for all components
- Integration tests for AI workflows
- End-to-end tests for complete user journeys
- Performance tests for optimization validation

### Contributing
1. Follow the established code style
2. Write comprehensive tests
3. Update documentation for new features
4. Ensure accessibility compliance

## Support

For technical support or feature requests:
1. Check the troubleshooting section
2. Review the API documentation
3. Contact the development team
4. Submit issues through the project repository

---

*This documentation covers the Builder tool with AI integration. For more information about the broader Thesis Copilot application, see the main README.md file.*