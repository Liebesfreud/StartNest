import { closestCenter, DndContext } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { AppIcon } from '../../components/AppIcon'
import type { Group, LinkItem } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { LinkCard } from './LinkCard'
import { useLinkDragReorder, type GroupSection } from './useLinkDragReorder'

export function LinkGrid({
  sections,
  openInNewTab,
  cardDensity,
  editMode,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onMoveGroup,
  onCreateLink,
  onEditLink,
  onReorderLinks,
  hideEmptyState = false,
}: {
  sections: GroupSection[]
  openInNewTab: boolean
  cardDensity: 'compact' | 'comfortable'
  editMode: boolean
  hideEmptyState?: boolean
  onCreateGroup: () => void
  onEditGroup: (group: Group) => void
  onDeleteGroup: (group: Group) => void
  onMoveGroup: (group: Group, direction: -1 | 1) => void
  onCreateLink: (group: Group) => void
  onEditLink: (link: LinkItem) => void
  onReorderLinks: (groupId: string, orderedLinkIds: string[]) => void
}) {
  const {
    sensors,
    draggingLinkId,
    dragOverLinkId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useLinkDragReorder({ sections, onReorderLinks })

  if (!sections.length && hideEmptyState) {
    return null
  }

  if (!sections.length) {
    return (
      <section className="mx-auto w-full max-w-[110rem] px-2 pb-24 sm:px-3 lg:px-4 lg:pb-28">
        <div className="rounded-xl border border-dashed border-border/50 bg-card/60 px-6 py-16 text-center">
          <p className="text-2xl font-semibold text-foreground ">还没有任何分组</p>
          <p className="mt-2 text-sm text-muted-foreground ">先创建一个分组，再把常用链接整理进去。</p>
          {editMode ? (
            <div className="mt-6 flex justify-center">
              <Button onClick={onCreateGroup}>
                <AppIcon name="folder-plus" className="mr-2 h-5 w-5" />
                创建分组
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <section className="mx-auto flex w-full max-w-[110rem] flex-col gap-6 px-2 pb-24 sm:px-3 lg:px-4 lg:pb-28">
      {editMode ? (
        <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground ">编辑模式</p>
            <p className="mt-1 text-sm text-muted-foreground ">点击卡片编辑；拖动调整顺序，触屏请长按后拖动。</p>
          </div>
          <Button variant="secondary" onClick={onCreateGroup}>
            <AppIcon name="folder-plus" className="mr-2 h-4 w-4" />
            新建分组
          </Button>
        </div>
      ) : null}

      {sections.map((section, groupIndex) => {
        const { group, links } = section

        return (
          <section key={group.id} className="space-y-4 border-b border-border/40 pb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {group.icon ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <AppIcon name={group.icon} className="h-5 w-5" />
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight text-primary ">{group.name}</h2>
                  </div>
                </div>
                {editMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => onMoveGroup(group, -1)}
                      disabled={groupIndex === 0}
                      className="min-h-9 px-3 py-1.5 text-xs"
                    >
                      上移
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => onMoveGroup(group, 1)}
                      disabled={groupIndex === sections.length - 1}
                      className="min-h-9 px-3 py-1.5 text-xs"
                    >
                      下移
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onCreateLink(group)}
                      className="min-h-9 px-3 py-1.5 text-xs"
                    >
                      添加链接
                    </Button>
                    <Button variant="ghost" onClick={() => onEditGroup(group)} className="min-h-9 px-3 py-1.5 text-xs">
                      编辑
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => onDeleteGroup(group)}
                      className="min-h-9 px-3 py-1.5 text-xs"
                    >
                      删除
                    </Button>
                  </div>
                ) : null}
              </div>

              {links.length ? (
                <SortableContext items={links.map((link) => link.id)} strategy={rectSortingStrategy}>
                  <div
                    className="nav-link-grid grid gap-3 pb-1"
                    style={{
                      minWidth: '0',
                    }}
                  >
                    {links.map((link) => (
                      <LinkCard
                        key={link.id}
                        link={link}
                        editMode={editMode}
                        cardDensity={cardDensity}
                        openInNewTab={openInNewTab}
                        isDragging={draggingLinkId === link.id}
                        isDragOver={dragOverLinkId === link.id}
                        onEditLink={onEditLink}
                      />
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <div className="rounded-xl border border-dashed border-border/45 bg-secondary/45 px-5 py-10 text-center">
                  <p className="text-lg font-semibold text-foreground ">这个分组还没有链接</p>
                  <p className="mt-2 text-sm text-muted-foreground ">添加第一个链接，开始整理你的常用入口。</p>
                  {editMode ? (
                    <div className="mt-5 flex justify-center">
                      <Button variant="secondary" onClick={() => onCreateLink(group)}>
                        <AppIcon name="plus" className="mr-2 h-4 w-4" />
                        添加链接
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        )
      })}
      </section>
    </DndContext>
  )
}
