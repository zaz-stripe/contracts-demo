/**
 * ProductAssistantPanel - Re-export for backward compatibility
 *
 * This file has been refactored into smaller modules in the ProductAssistantPanel/ folder:
 * - assistantTypes.ts: Type definitions
 * - assistantUtils.ts: Utility functions
 * - assistantPrompts.ts: System prompt building
 * - assistantComponents.tsx: Shared UI components
 * - ProductAssistantPanel.tsx: Main component
 *
 * Import from this file or from '@/components/ProductAssistantPanel' - both work.
 */

export {
  // Types
  type AssistantAction,
  type AssistantApplyResult,
  type AssistantPreviewResult,
  type AssistantContext,
  type AssistantReferenceKind,
  type AssistantReference,
  type MentionableObject,
  type ChatMessage,
  type ProductAssistantPanelProps,
  // Utilities
  nextMessageId,
  selectModel,
  getMentionableObjects,
  getFriendlyActionName,
  countTotalChanges,
  summarizeActions,
  pruneContext,
  fixActionTypeTypos,
  normalizeActions,
  orderActions,
  compressConversationHistory,
  parseJsonContent,
  // Prompts
  AI_MODEL_REFERENCE,
  buildSystemPrompt,
  // Components
  AccountLogo,
  RevertIcon,
  ContentTooltip,
  ProductAssistantPanel,
} from "./ProductAssistantPanel/index"
