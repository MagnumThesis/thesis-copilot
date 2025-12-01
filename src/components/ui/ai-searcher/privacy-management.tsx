import React from "react";
import { ConsentBanner } from "../consent-banner";
import { PrivacyControls } from "../privacy-controls";

/**
 * Props for the PrivacyManagement component
 */
export interface PrivacyManagementProps {
  /**
   * The conversation ID for context and analytics
   */
  conversationId: string;
  /**
   * Whether privacy controls are currently visible
   */
  showPrivacyControls: boolean;
  /**
   * Callback function to reload privacy settings in the parent component
   * when consent is granted or settings are changed
   */
  onConsentChange?: () => void;
}

/**
 * PrivacyManagement component handles the consent banner and privacy controls.
 * It manages user privacy settings and data handling preferences.
 */
export const PrivacyManagement: React.FC<PrivacyManagementProps> = ({
  conversationId,
  showPrivacyControls,
  onConsentChange
}) => {
  return (
    <>
      {/* Consent Banner */}
      <ConsentBanner 
        conversationId={conversationId}
        onConsentChange={(granted) => {
          if (granted && onConsentChange) {
            onConsentChange();
          }
        }}
      />

      {/* Privacy Controls */}
      {showPrivacyControls && (
        <PrivacyControls
          conversationId={conversationId}
          onSettingsChange={(settings) => {
            if (onConsentChange) {
              onConsentChange();
            }
          }}
          onDataCleared={() => {
            // Data cleared, but no need to reload settings
          }}
          onDataExported={(data) => {
            console.log('Data exported:', data);
          }}
        />
      )}
    </>
  );
};