interface PromptSuggestionsProps {
  label: string
  append: (message: { role: "user"; content: string }) => void
  suggestions: string[]
}

/**
 * @component PromptSuggestions
 * @description A component that displays a list of suggested prompts or questions for the user.
 * Clicking on a suggestion appends it to the current conversation.
 * @param {PromptSuggestionsProps} props - The properties for the PromptSuggestions component.
 * @param {string} props.label - The title or label for the suggestions section.
 * @param {(message: { role: "user"; content: string }) => void} props.append - Callback function to append a new message to the conversation.
 * @param {string[]} props.suggestions - An array of strings, where each string is a suggested prompt.
 */
export function PromptSuggestions({
  label,
  append,
  suggestions,
}: PromptSuggestionsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-center text-2xl font-bold">{label}</h2>
      <div className="flex gap-6 text-sm">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => append({ role: "user", content: suggestion })}
            className="h-max flex-1 rounded-xl border bg-background p-4 hover:bg-muted"
          >
            <p>{suggestion}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
