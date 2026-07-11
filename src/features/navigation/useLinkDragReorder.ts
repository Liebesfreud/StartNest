import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useRef, useState } from 'react'
import type { Group, LinkItem } from '../../lib/api'

export type GroupSection = {
  group: Group
  links: LinkItem[]
}

function reorderIds(ids: string[], activeId: string, overId: string) {
  if (activeId === overId) return ids
  const next = [...ids]
  const fromIndex = next.indexOf(activeId)
  const toIndex = next.indexOf(overId)
  if (fromIndex === -1 || toIndex === -1) return ids
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export function useLinkDragReorder({
  sections,
  onReorderLinks,
}: {
  sections: GroupSection[]
  onReorderLinks: (groupId: string, orderedLinkIds: string[]) => void
}) {
  const [draggingLinkId, setDraggingLinkId] = useState<string | null>(null)
  const [dragOverLinkId, setDragOverLinkId] = useState<string | null>(null)
  const sectionsRef = useRef(sections)
  sectionsRef.current = sections
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingLinkId(String(event.active.id))
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overLinkId = event.over ? String(event.over.id) : null
    setDragOverLinkId((current) => (current === overLinkId ? current : overLinkId))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeLinkId = String(event.active.id)
      const overLinkId = event.over ? String(event.over.id) : null
      setDraggingLinkId(null)
      setDragOverLinkId(null)
      if (!overLinkId || activeLinkId === overLinkId) return

      const section = sectionsRef.current.find((item) => item.links.some((link) => link.id === activeLinkId))
      if (!section) return
      if (!section.links.some((link) => link.id === overLinkId)) return

      const linkIds = section.links.map((item) => item.id)
      const ordered = reorderIds(linkIds, activeLinkId, overLinkId)
      if (ordered !== linkIds) onReorderLinks(section.group.id, ordered)
    },
    [onReorderLinks],
  )

  const handleDragCancel = useCallback((_event?: DragCancelEvent) => {
    setDraggingLinkId(null)
    setDragOverLinkId(null)
  }, [])

  return {
    sensors,
    draggingLinkId,
    dragOverLinkId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  }
}
