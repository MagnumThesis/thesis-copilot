import React from "react";
import { ConsentBanner } from "../consent-banner";
import { PrivacyControls } from "../privacy-controls";
import { usePrivacyManager } from "../../../hooks/usePrivacyManager";

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
}

/**
 * PrivacyManagement component handles the consent banner and privacy controls.
 * It manages user privacy settings and data handling preferences.
 */
export const PrivacyManagement: React.FC<PrivacyManagementProps> = ({
  conversationId,
  showPrivacyControls
}) => {
  const privacyManager = usePrivacyManager(conversationId);

  return (
    <>
      {/* Consent Banner */}
      <ConsentBanner 
        conversationId={conversationId}
        onConsentChange={(granted) => {
          if (granted) {
            privacyManager.loadSettings();
          }
        }}
      />

      {/* Privacy Controls */}
      {showPrivacyControls && (
        <PrivacyControls
          conversationId={conversationId}
          onSettingsChange={(settings) => {
            privacyManager.loadSettings();
          }}
          onDataCleared={() => {
            privacyManager.loadDataSummary();
          }}
          onDataExported={(data) => {
            console.log('Data exported:', data);
          }}
        />
      )}
    </>
  );
};