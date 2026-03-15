import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chat } from '../../../../src/components/ui/chat';

// Need to mock user event & UI components
vi.mock('@/components/ui/shadcn/button', () => ({
  Button: ({ children, 'aria-label': ariaLabel, onClick, ...props }: any) => (
    <button aria-label={ariaLabel} onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/copy-button', () => ({
  CopyButton: () => <button>Copy</button>
}));

vi.mock('@/components/ui/message-input', () => ({
  MessageInput: () => <div>MessageInput</div>
}));

vi.mock('@/components/ui/message-list', () => ({
  MessageList: ({ messageOptions, messages }: any) => (
    <div>
      {messages.map((m: any) => (
        <div key={m.id}>
          {m.content}
          {messageOptions(m).actions}
        </div>
      ))}
    </div>
  )
}));

vi.mock('@/hooks/use-auto-scroll', () => ({
  useAutoScroll: () => ({
    containerRef: { current: null },
    scrollToBottom: vi.fn(),
    handleScroll: vi.fn(),
    shouldAutoScroll: false, // Force showing the scroll to bottom button
    handleTouchStart: vi.fn()
  })
}));

describe('Chat UX', () => {
  it('should render rating buttons with correct aria-labels', () => {
    const messages = [{ id: '1', role: 'assistant', content: 'test msg' } as any];
    const onRateResponse = vi.fn();

    render(
      <Chat
        messages={messages}
        input=""
        handleInputChange={() => {}}
        handleSubmit={() => {}}
        isGenerating={false}
        onRateResponse={onRateResponse}
      />
    );

    expect(screen.getByLabelText('Rate response thumbs up')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate response thumbs down')).toBeInTheDocument();
  });

  it('should render scroll to bottom button with correct aria-label', () => {
    const messages = [{ id: '1', role: 'user', content: 'test msg' } as any];

    render(
      <Chat
        messages={messages}
        input=""
        handleInputChange={() => {}}
        handleSubmit={() => {}}
        isGenerating={false}
      />
    );

    expect(screen.getByLabelText('Scroll to bottom')).toBeInTheDocument();
  });
});
