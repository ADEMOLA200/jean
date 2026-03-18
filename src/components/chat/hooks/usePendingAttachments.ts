import { useCallback } from 'react'
import { persistRemoveQueued } from '@/services/chat'
import { useChatStore } from '@/store/chat-store'
import { getFilename } from '@/lib/path-utils'

interface UsePendingAttachmentsParams {
  activeSessionId: string | null | undefined
  setInputDraft: (sessionId: string, draft: string) => void
}

/**
 * Handlers for removing pending attachments and queue management.
 */
export function usePendingAttachments({
  activeSessionId,
  setInputDraft,
}: UsePendingAttachmentsParams) {
  const handleRemovePendingImage = useCallback(
    (imageId: string) => {
      if (!activeSessionId) return
      useChatStore.getState().removePendingImage(activeSessionId, imageId)
    },
    [activeSessionId]
  )

  const handleRemovePendingTextFile = useCallback(
    (textFileId: string) => {
      if (!activeSessionId) return
      useChatStore.getState().removePendingTextFile(activeSessionId, textFileId)
    },
    [activeSessionId]
  )

  const handleRemovePendingSkill = useCallback(
    (skillId: string) => {
      if (!activeSessionId) return
      useChatStore.getState().removePendingSkill(activeSessionId, skillId)
    },
    [activeSessionId]
  )

  const handleRemovePendingFile = useCallback(
    (fileId: string) => {
      if (!activeSessionId) return
      const { removePendingFile, getPendingFiles, inputDrafts } =
        useChatStore.getState()

      const files = getPendingFiles(activeSessionId)
      const file = files.find(f => f.id === fileId)
      if (file) {
        const filename = getFilename(file.relativePath)
        const currentInput = inputDrafts[activeSessionId] ?? ''
        const pattern = new RegExp(
          `@${filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`,
          'g'
        )
        const newInput = currentInput
          .replace(pattern, '')
          .replace(/\s+/g, ' ')
          .trim()
        setInputDraft(activeSessionId, newInput)
      }

      removePendingFile(activeSessionId, fileId)
    },
    [activeSessionId, setInputDraft]
  )

  const handleRemoveQueuedMessage = useCallback(
    (sessionId: string, messageId: string) => {
      useChatStore.getState().removeQueuedMessage(sessionId, messageId)
      // Persist removal to backend for cross-client sync
      const { sessionWorktreeMap, worktreePaths } = useChatStore.getState()
      const wtId = sessionWorktreeMap[sessionId]
      const wtPath = wtId ? worktreePaths[wtId] : undefined
      if (wtId && wtPath) {
        persistRemoveQueued(wtId, wtPath, sessionId, messageId)
      }
    },
    []
  )

  const handleForceSendQueued = useCallback((sessionId: string) => {
    useChatStore.getState().forceProcessQueue(sessionId)
  }, [])

  return {
    handleRemovePendingImage,
    handleRemovePendingTextFile,
    handleRemovePendingSkill,
    handleRemovePendingFile,
    handleRemoveQueuedMessage,
    handleForceSendQueued,
  }
}
