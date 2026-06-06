import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  api,
  ApiError,
  type Group,
  type GroupCreatePayload,
  type LinkCreatePayload,
  type LinkItem,
  type ReorderPayload,
} from '../../lib/api'
import { useBootstrapCache } from '../../hooks/useBootstrap'
import type { AppOutletContext } from '../../app/App'
import { PageContainer } from '../../components/layout/PageContainer'
import { NavigationHero } from './NavigationHero'
import { NavigationSearch } from './NavigationSearch'
import { LinkGrid } from './LinkGrid'
import { CreateLinkDrawer, type LinkDraft } from './CreateLinkDrawer'
import { DeleteLinkDialog } from './DeleteLinkDialog'
import { GroupDrawer, type GroupDraft } from './GroupDrawer'

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

const searchEngineBaseUrl = {
  bing: 'https://www.bing.com/search?q=',
  google: 'https://www.google.com/search?q=',
} as const

function roundCoordinate(value: number) {
  return Math.round(value * 1000) / 1000
}

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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.code === 'GROUP_NOT_EMPTY') return '请先移动或删除该分组下的链接。'
    return error.message
  }
  return error instanceof Error ? error.message : fallback
}

export function NavigationPage() {
  const { editMode, bootstrapData } = useOutletContext<AppOutletContext>()
  const { update } = useBootstrapCache()
  const [search, setSearch] = useState('')
  const [linkDrawerOpen, setLinkDrawerOpen] = useState(false)
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false)
  const [deleteState, setDeleteState] = useState<{ type: 'group' | 'link'; id: string; title: string } | null>(null)
  const [linkDraft, setLinkDraft] = useState<LinkDraft>(emptyLinkDraft)
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(emptyGroupDraft)
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'locating' | 'ready' | 'denied' | 'unsupported' | 'error'
  >('idle')
  const searchRef = useRef<HTMLInputElement>(null)

  const data = bootstrapData

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement !== searchRef.current) {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const groups = data?.groups ?? []
  const links = data?.links ?? []
  const settings = data?.settings
  const searchEngine = settings?.searchEngine ?? 'bing'
  const rawQuery = search.trim()
  const query = rawQuery.toLowerCase()
  const roundedCoords = coords
    ? { latitude: roundCoordinate(coords.latitude), longitude: roundCoordinate(coords.longitude) }
    : null
  const weatherEnabled = settings?.weatherEnabled ?? true
  const weatherAutoLocate = settings?.weatherAutoLocate ?? false
  const temperatureUnit = settings?.temperatureUnit ?? 'system'
  const visibleLinks = useMemo(() => {
    if (!query) return links
    return links.filter((link) =>
      [link.title, link.url, link.description ?? ''].some((value) => value.toLowerCase().includes(query)),
    )
  }, [links, query])

  const sections = useMemo(() => {
    const nextSections = groups.map((group) => ({
      group,
      links: visibleLinks.filter((link) => link.groupId === group.id),
    }))

    return query ? nextSections.filter((section) => section.links.length > 0) : nextSections
  }, [groups, query, visibleLinks])

  const hasSearchResults = sections.some((section) => section.links.length > 0)

  useEffect(() => {
    if (!weatherEnabled || !weatherAutoLocate) {
      setCoords(null)
      setLocationStatus('idle')
      return
    }

    if (!('geolocation' in navigator)) {
      setCoords(null)
      setLocationStatus('unsupported')
      return
    }

    let cancelled = false
    setLocationStatus('locating')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationStatus('ready')
      },
      (error) => {
        if (cancelled) return
        setCoords(null)
        setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 10 * 60 * 1000,
      },
    )

    return () => {
      cancelled = true
    }
  }, [weatherAutoLocate, weatherEnabled])

  const weatherQuery = useQuery({
    queryKey: ['weather', roundedCoords?.latitude, roundedCoords?.longitude, temperatureUnit],
    queryFn: () =>
      api.getWeather({
        latitude: roundedCoords!.latitude,
        longitude: roundedCoords!.longitude,
        temperatureUnit,
      }),
    enabled: weatherEnabled && locationStatus === 'ready' && roundedCoords !== null,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  })

  const weatherState = !weatherEnabled
    ? { mode: 'hidden' as const }
    : !weatherAutoLocate
      ? { mode: 'idle' as const, message: '开启自动定位后显示天气' }
      : locationStatus === 'locating'
        ? { mode: 'loading' as const, message: '正在获取天气...' }
        : locationStatus === 'unsupported'
          ? { mode: 'error' as const, message: '当前浏览器不支持定位' }
          : locationStatus === 'denied'
            ? { mode: 'error' as const, message: '定位权限被拒绝' }
            : locationStatus === 'error'
              ? { mode: 'error' as const, message: '定位失败，请稍后重试' }
              : weatherQuery.isPending
                ? { mode: 'loading' as const, message: '正在获取天气...' }
                : weatherQuery.isError
                  ? {
                      mode: 'error' as const,
                      message: weatherQuery.error instanceof Error ? weatherQuery.error.message : '天气暂时不可用',
                    }
                  : weatherQuery.data
                    ? { mode: 'ready' as const, data: weatherQuery.data }
                    : { mode: 'idle' as const, message: '天气数据暂不可用' }

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
    mutationFn: async (state: NonNullable<typeof deleteState>) =>
      state.type === 'group' ? api.deleteGroup(state.id) : api.deleteLink(state.id),
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

  const handleSearchWeb = () => {
    if (!rawQuery) return
    const url = `${searchEngineBaseUrl[searchEngine]}${encodeURIComponent(rawQuery)}`
    if (settings?.openInNewTab ?? true) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    window.location.href = url
  }

  const handleSearchEngineChange = (next: 'google' | 'bing') => {
    updateSettingsMutation.mutate({ searchEngine: next })
  }

  return (
    <>
      <PageContainer className="pb-4 pt-5 lg:pb-5 lg:pt-6">
        <div className="space-y-4 lg:space-y-5">
          <div className="space-y-4">
            <NavigationHero weather={weatherState} />
            <NavigationSearch
              ref={searchRef}
              value={search}
              searchEngine={searchEngine}
              onChange={setSearch}
              onSearchEngineChange={handleSearchEngineChange}
              onSearchWeb={handleSearchWeb}
            />
          </div>
          {!hasSearchResults && query ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-card/75 px-5 py-6 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur ">
              没找到匹配的链接。按回车或点击搜索可直接搜索互联网。
            </div>
          ) : null}
          {reorderMutation.error ? (
            <p className="text-sm text-destructive">
              {getErrorMessage(reorderMutation.error, '排序失败，请稍后重试。')}
            </p>
          ) : null}
          {updateSettingsMutation.error ? (
            <p className="text-sm text-destructive">
              {getErrorMessage(updateSettingsMutation.error, '设置更新失败。')}
            </p>
          ) : null}
        </div>
      </PageContainer>
      <LinkGrid
        sections={sections}
        openInNewTab={settings?.openInNewTab ?? true}
        cardDensity={settings?.cardDensity ?? 'comfortable'}
        editMode={editMode}
        onCreateGroup={openCreateGroup}
        onEditGroup={openEditGroup}
        onDeleteGroup={(group) => setDeleteState({ type: 'group', id: group.id, title: group.name })}
        onMoveGroup={moveGroup}
        onCreateLink={openCreateLink}
        onEditLink={openEditLink}
        onReorderLinks={reorderLinksInGroup}
        hideEmptyState={Boolean(query)}
      />
      <CreateLinkDrawer
        open={linkDrawerOpen && editMode}
        onOpenChange={(open) => {
          setLinkDrawerOpen(open)
          if (!open) {
            setEditingLinkId(null)
            setLinkDraft(emptyLinkDraft)
          }
        }}
        title={editingLinkId ? '编辑链接' : '新建链接'}
        draft={linkDraft}
        groups={groups}
        pending={saveLinkMutation.isPending}
        onDraftChange={(next) => setLinkDraft((current) => (typeof next === 'function' ? next(current) : next))}
        onSubmit={submitLink}
        onDelete={
          editingLinkId ? () => openDeleteLink(editingLinkId, linkDraft.title.trim() || '未命名链接') : undefined
        }
      />
      <GroupDrawer
        open={groupDrawerOpen && editMode}
        onOpenChange={(open) => {
          setGroupDrawerOpen(open)
          if (!open) {
            setEditingGroupId(null)
            setGroupDraft(emptyGroupDraft)
          }
        }}
        title={editingGroupId ? '编辑分组' : '新建分组'}
        draft={groupDraft}
        pending={saveGroupMutation.isPending}
        errorMessage={saveGroupMutation.error ? getErrorMessage(saveGroupMutation.error, '保存分组失败。') : null}
        onDraftChange={(next) => setGroupDraft((current) => (typeof next === 'function' ? next(current) : next))}
        onSubmit={submitGroup}
      />
      <DeleteLinkDialog
        open={Boolean(deleteState) && editMode}
        onOpenChange={(open) => {
          if (!open) setDeleteState(null)
        }}
        title={deleteState?.type === 'group' ? '删除分组' : '删除链接'}
        description={
          deleteState?.type === 'group'
            ? `确认删除分组「${deleteState?.title ?? ''}」吗？`
            : `确认删除链接「${deleteState?.title ?? ''}」吗？`
        }
        pending={deleteMutation.isPending}
        errorMessage={deleteMutation.error ? getErrorMessage(deleteMutation.error, '删除失败，请稍后重试。') : null}
        onCancel={() => setDeleteState(null)}
        onConfirm={() => deleteState && deleteMutation.mutate(deleteState)}
      />
      <div className="pointer-events-none fixed bottom-8 right-10 z-10 flex flex-col items-end gap-1 opacity-20 transition-opacity hover:opacity-100">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">StartNest</p>
      </div>
    </>
  )
}
