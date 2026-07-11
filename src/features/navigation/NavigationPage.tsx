import { useOutletContext } from 'react-router-dom'
import { ApiError } from '../../lib/api'
import { useBootstrapCache } from '../../hooks/useBootstrap'
import type { AppOutletContext } from '../../app/App'
import { PageContainer } from '../../components/layout/PageContainer'
import { NavigationHero } from './NavigationHero'
import { NavigationSearch } from './NavigationSearch'
import { LinkGrid } from './LinkGrid'
import { CreateLinkDrawer } from './CreateLinkDrawer'
import { DeleteLinkDialog } from './DeleteLinkDialog'
import { GroupDrawer } from './GroupDrawer'
import { useNavigationMutations } from './useNavigationMutations'
import { useNavigationSearch } from './useNavigationSearch'
import { useNavigationWeather } from './useNavigationWeather'

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

  const data = bootstrapData
  const groups = data?.groups ?? []
  const links = data?.links ?? []
  const searchEngines = data?.searchEngines ?? []
  const settings = data?.settings
  const weatherState = useNavigationWeather(settings)
  const navigationSearch = useNavigationSearch({ groups, links, searchEngines, settings })
  const navigationMutations = useNavigationMutations({ groups, links, update })
  const {
    search,
    searchRef,
    setSearch,
    query,
    sections,
    hasSearchResults,
    searchEngine,
    searchEngineOptions,
    handleSearchWeb,
  } = navigationSearch
  const {
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
  } = navigationMutations

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
              searchEngines={searchEngineOptions}
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
        onDeleteGroup={openDeleteGroup}
        onMoveGroup={moveGroup}
        onCreateLink={openCreateLink}
        onEditLink={openEditLink}
        onReorderLinks={reorderLinksInGroup}
        hideEmptyState={Boolean(query)}
      />
      <CreateLinkDrawer
        open={linkDrawerOpen && editMode}
        onOpenChange={handleLinkDrawerOpenChange}
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
        onOpenChange={handleGroupDrawerOpenChange}
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
