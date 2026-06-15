/**
 * ProductAssistantPanel - AI-powered assistant for configuring products and pricing plans
 *
 * This module has been split into smaller, focused files for better maintainability:
 * - assistantTypes.ts: Type definitions
 * - assistantUtils.ts: Utility functions for actions, context, and message handling
 * - assistantPrompts.ts: System prompt building for AI interactions
 * - assistantComponents.tsx: Shared UI components (icons, tooltips)
 */

// Re-export types
export type {
  AssistantAction,
  AssistantApplyResult,
  AssistantPreviewResult,
  AssistantContext,
  AssistantReferenceKind,
  AssistantReference,
  MentionableObject,
  ChatMessage,
  ProductAssistantPanelProps,
} from "./assistantTypes"

// Re-export utilities
export {
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
} from "./assistantUtils"

// Re-export prompts
export { AI_MODEL_REFERENCE, buildSystemPrompt } from "./assistantPrompts"

// Re-export components
export { AccountLogo, RevertIcon, ContentTooltip } from "./assistantComponents"

// Main component
export { ProductAssistantPanel } from "./ProductAssistantPanel"
