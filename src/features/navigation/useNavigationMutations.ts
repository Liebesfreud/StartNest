import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  api,
  type BootstrapState,
  type Group,
  type GroupCreatePayload,
  type LinkCreatePayload,
  type LinkItem,
  type ReorderPayload,
  type Settings,
} from '../../lib/api'
import type { LinkDraft } from './CreateLinkDrawer'
import type { GroupDraft } from './GroupDrawer'

export type DeleteState = { type: 'group' | 'link'; id: string; title: string }

const emptyLinkDraft: LinkDraft = {
  title: '',
  url: '',
  icon: '',
  iconMode: 'favicon',
  iconImageUrl: '',
  iconText: '',
  description: '',
  tileSize: '1x3',
  groupId: '',
  openMode: 'global',
  backgroundColor: '',
}

const emptyGroupDraft: GroupDraft = { name: '', icon: '' }

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(nextIndex, 0, item)
  return next
}

function buildReorderPayload(groups: Group[], links: LinkItem[]): ReorderPayload {
  return {
    groups: groups.map((group, index) => ({ id: group.id, sortOrder: index })),
    links: links.map((link, index) => ({ id: link.id, groupId: link.groupId, sortOrder: index })),
  }
}

function mapLinkToDraft(link: LinkItem): LinkDraft {
  return {
    title: link.title,
    url: link.url,
    icon: link.icon ?? '',
    iconMode: link.iconMode,
    iconImageUrl: link.iconImageUrl ?? '',
    iconText: link.iconText ?? '',
    description: link.description ?? '',
    tileSize: link.tileSize,
    groupId: link.groupId,
    openMode: link.openMode,
    backgroundColor: link.backgroundColor ?? '',
  }
}

function mapGroupToDraft(group: Group): GroupDraft {
  return {
    name: group.name,
    icon: group.icon ?? '',
  }
}

export function useNavigationMutations({
  groups,
  links,
  update,
}: {
  groups: Group[]
  links: LinkItem[]
  update: (next: Partial<BootstrapState & { settings: Settings }>) => void
}) {
  const [linkDrawerOpen, setLinkDrawerOpen] = useState(false)
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false)
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null)
  const [linkDraft, setLinkDraft] = useState<LinkDraft>(emptyLinkDraft)
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(emptyGroupDraft)
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

  const saveGroupMutation = useMutation({
    mutationFn: async (payload: GroupCreatePayload) =>
      editingGroupId ? api.updateGroup(editingGroupId, payload) : api.createGroup(payload),
    onSuccess: ({ groups: nextGroups }) => {
      update({ groups: nextGroups })
      setGroupDrawerOpen(false)
      setEditingGroupId(null)
      setGroupDraft(emptyGroupDraft)
    },
  })

  const saveLinkMutation = useMutation({
    mutationFn: async (payload: LinkCreatePayload) =>
      editingLinkId ? api.updateLink(editingLinkId, payload) : api.createLink(payload),
    onSuccess: ({ links: nextLinks }) => {
      update({ links: nextLinks })
      setLinkDrawerOpen(false)
      setEditingLinkId(null)
      setLinkDraft(emptyLinkDraft)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (state: DeleteState) => (state.type === 'group' ? api.deleteGroup(state.id) : api.deleteLink(state.id)),
    onSuccess: (payload) => {
      update(payload)
      setDeleteState(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: api.reorder,
    onSuccess: (payload) => {
      update(payload)
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: ({ settings: nextSettings }) => {
      update({ settings: nextSettings })
    },
  })

  const openCreateGroup = () => {
    setEditingGroupId(null)
    setGroupDraft(emptyGroupDraft)
    setGroupDrawerOpen(true)
  }

  const openEditGroup = (group: Group) => {
    setEditingGroupId(group.id)
    setGroupDraft(mapGroupToDraft(group))
    setGroupDrawerOpen(true)
  }

  const openCreateLink = (group?: Group) => {
    setEditingLinkId(null)
    setLinkDraft({ ...emptyLinkDraft, groupId: group?.id ?? groups[0]?.id ?? '' })
    setLinkDrawerOpen(true)
  }

  const openEditLink = (link: LinkItem) => {
    setEditingLinkId(link.id)
    setLinkDraft(mapLinkToDraft(link))
    setLinkDrawerOpen(true)
  }

  const openDeleteLink = (linkId: string, title: string) => {
    setLinkDrawerOpen(false)
    setDeleteState({ type: 'link', id: linkId, title })
  }

  const openDeleteGroup = (group: Group) => {
    setDeleteState({ type: 'group', id: group.id, title: group.name })
  }

  const handleLinkDrawerOpenChange = (open: boolean) => {
    setLinkDrawerOpen(open)
    if (!open) {
      setEditingLinkId(null)
      setLinkDraft(emptyLinkDraft)
    }
  }

  const handleGroupDrawerOpenChange = (open: boolean) => {
    setGroupDrawerOpen(open)
    if (!open) {
      setEditingGroupId(null)
      setGroupDraft(emptyGroupDraft)
    }
  }

  const submitGroup = () => {
    const payload: GroupCreatePayload = {
      name: groupDraft.name.trim(),
      icon: groupDraft.icon.trim() || null,
    }
    if (!payload.name) return
    saveGroupMutation.mutate(payload)
  }

  const submitLink = () => {
    const payload: LinkCreatePayload = {
      title: linkDraft.title.trim(),
      url: linkDraft.url.trim(),
      icon: linkDraft.icon.trim() || null,
      iconMode: linkDraft.iconMode,
      iconImageUrl: linkDraft.iconImageUrl.trim() || null,
      iconText: linkDraft.iconText.trim() || null,
      description: linkDraft.description.trim() || null,
      tileSize: linkDraft.tileSize,
      groupId: linkDraft.groupId || groups[0]?.id || '',
      openMode: linkDraft.openMode,
      backgroundColor: linkDraft.backgroundColor.trim() || null,
    }
    if (!payload.title || !payload.url || !payload.groupId) return
    saveLinkMutation.mutate(payload)
  }

  const moveGroup = (group: Group, direction: -1 | 1) => {
    const index = groups.findIndex((item) => item.id === group.id)
    if (index === -1) return
    const nextGroups = moveItem(groups, index, direction)
    reorderMutation.mutate(buildReorderPayload(nextGroups, links))
  }

  const reorderLinksInGroup = (groupId: string, orderedLinkIds: string[]) => {
    const groupLinks = links.filter((item) => item.groupId === groupId)
    if (groupLinks.length <= 1 || groupLinks.length !== orderedLinkIds.length) return

    const linkMap = new Map(groupLinks.map((item) => [item.id, item]))
    const reorderedGroupLinks = orderedLinkIds
      .map((id) => linkMap.get(id))
      .filter((item): item is LinkItem => Boolean(item))
      .map((item, index) => ({
        ...item,
        sortOrder: index,
      }))

    if (reorderedGroupLinks.length !== groupLinks.length) return

    const otherLinks = links.filter((item) => item.groupId !== groupId)
    reorderMutation.mutate(buildReorderPayload(groups, [...otherLinks, ...reorderedGroupLinks]))
  }

  const handleSearchEngineChange = (next: string) => {
    updateSettingsMutation.mutate({ searchEngine: next })
  }

  return {
    linkDrawerOpen,
    groupDrawerOpen,
    deleteState,
    linkDraft,
    groupDraft,
    editingLinkId,
    editingGroupId,
    saveGroupMutation,
    saveLinkMutation,
    deleteMutation,
    reorderMutation,
    updateSettingsMutation,
    openCreateGroup,
    openEditGroup,
    openCreateLink,
    openEditLink,
    openDeleteLink,
    openDeleteGroup,
    handleLinkDrawerOpenChange,
    handleGroupDrawerOpenChange,
    setLinkDraft,
    setGroupDraft,
    setDeleteState,
    submitGroup,
    submitLink,
    moveGroup,
    reorderLinksInGroup,
    handleSearchEngineChange,
  }
}
