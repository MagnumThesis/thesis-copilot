import React from "react";
import { Button } from "../shadcn/button";
import { Sparkles, Shield } from "lucide-react";

/**
 * Props for the SearchHeader component
 */
export interface SearchHeaderProps {
  /**
   * Function to toggle privacy controls visibility
   */
  onTogglePrivacyControls: () => void;
  /**
   * Whether privacy controls are currently visible
   */
  showPrivacyControls: boolean;
}

/**
 * SearchHeader component displays the header section of the AISearcher component
 * including the title with Sparkles icon and the Privacy button.
 */
export const SearchHeader: React.FC<SearchHeaderProps> = ({
  onTogglePrivacyControls,
  showPrivacyControls
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">AI-Powered Reference Search</h3>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onTogglePrivacyControls}
        className="flex items-center gap-2"
      >
        <Shield className="h-4 w-4" />
        Privacy
      </Button>
    </div>
  );
};