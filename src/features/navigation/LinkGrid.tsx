import { useState, type DragEvent } from 'react'
import { AppIcon } from '../../components/AppIcon'
import type { Group, LinkItem } from '../../lib/api'
import { getFaviconUrl } from '../../lib/favicon'
import { Button } from '@/components/ui/button'
import {
  customLinkCardIconBackgroundClassName,
  customLinkCardIconBorderClassName,
  customLinkCardMutedTextClassName,
  customLinkCardTextClassName,
  getLinkCardStyle,
  hasCustomLinkCardBackground,
} from './linkCardTheme'

type GroupSection = {
  group: Group
  links: LinkItem[]
}

function renderTextFallback(text: string, sizeClass: string, textClassName = 'text-sm', customBackground = false) {
  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-xl ${customBackground ? `${customLinkCardIconBackgroundClassName} ${customLinkCardTextClassName}` : 'bg-secondary text-primary'} ${textClassName} font-bold`}
    >
      {text.trim().slice(0, 2).toUpperCase() || '?'}
    </div>
  )
}

function getTileClassName(tileSize: '1x1' | '1x3', density: 'compact' | 'comfortable') {
  if (tileSize === '1x1') {
    return density === 'compact'
      ? 'col-span-1 row-span-1 flex h-full w-full items-center justify-center p-1.5'
      : 'col-span-1 row-span-1 flex h-full w-full items-center justify-center p-2'
  }

  return density === 'compact'
    ? 'col-span-3 row-span-1 flex h-full w-full items-center gap-2 px-2 py-2 text-left'
    : 'col-span-3 row-span-1 flex h-full w-full items-center gap-2.5 px-2.5 py-2.5 text-left'
}

function getLinkTarget(openMode: 'global' | 'same-tab' | 'new-tab', openInNewTab: boolean) {
  if (openMode === 'same-tab') return undefined
  if (openMode === 'new-tab') return '_blank'
  return openInNewTab ? '_blank' : undefined
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

function LinkVisual({
  link,
  iconClassName,
  glyphClassName,
  imagePaddingClassName,
  fallbackTextClassName,
}: {
  link: LinkItem
  iconClassName: string
  glyphClassName: string
  imagePaddingClassName: string
  fallbackTextClassName: string
}) {
  const [faviconFailed, setFaviconFailed] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const faviconUrl = getFaviconUrl(link.url)
  const fallbackText = link.iconText || link.title.slice(0, 2) || '?'
  const customBackground = hasCustomLinkCardBackground(link.backgroundColor)
  const iconFrameClassName = `${iconClassName} flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${customBackground ? customLinkCardIconBackgroundClassName : 'bg-secondary'}`
  const fallbackIconFrameClassName = `${iconClassName} flex shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-sm ${customBackground ? `${customLinkCardIconBackgroundClassName} ${customLinkCardIconBorderClassName}` : 'border-border/60 bg-muted'}`
  const faviconClassName = `${iconClassName} shrink-0 object-contain ${imagePaddingClassName}`

  if (link.iconMode === 'image' && link.iconImageUrl && !imageFailed) {
    return (
      <img
        src={link.iconImageUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={() => setImageFailed(true)}
        className={`${iconClassName} shrink-0 object-contain ${imagePaddingClassName}`}
      />
    )
  }

  if (link.iconMode === 'material' && link.icon) {
    return (
      <div className={iconFrameClassName}>
        <AppIcon name={link.icon} className={`${glyphClassName} ${customBackground ? customLinkCardTextClassName : 'text-primary'} `} />
      </div>
    )
  }

  if (link.iconMode === 'text') {
    return renderTextFallback(fallbackText, `${iconClassName} shrink-0`, fallbackTextClassName, customBackground)
  }

  if (faviconUrl && !faviconFailed) {
    return (
      <img
        src={faviconUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={() => setFaviconFailed(true)}
        decoding="async"
        className={faviconClassName}
      />
    )
  }

  if (link.iconMode === 'favicon') {
    return (
      <div className={fallbackIconFrameClassName}>
        <AppIcon name="box" className={`${glyphClassName} ${customBackground ? customLinkCardTextClassName : 'text-primary'} `} />
      </div>
    )
  }

  if (link.iconMode === 'image') {
    return renderTextFallback(fallbackText, `${iconClassName} shrink-0`, fallbackTextClassName, customBackground)
  }

  return renderTextFallback(fallbackText, `${iconClassName} shrink-0`, fallbackTextClassName, customBackground)
}

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
  const [draggingLinkId, setDraggingLinkId] = useState<string | null>(null)
  const [dragOverLinkId, setDragOverLinkId] = useState<string | null>(null)

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, linkId: string) => {
    setDraggingLinkId(linkId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', linkId)
  }

  const handleDragOver = (event: DragEvent<HTMLButtonElement>, linkId: string) => {
    event.preventDefault()
    if (!draggingLinkId || draggingLinkId === linkId) return
    setDragOverLinkId(linkId)
  }

  const handleDrop = (groupId: string, linkIds: string[], overLinkId: string) => {
    if (!draggingLinkId) return
    const ordered = reorderIds(linkIds, draggingLinkId, overLinkId)
    setDraggingLinkId(null)
    setDragOverLinkId(null)
    if (ordered !== linkIds) onReorderLinks(groupId, ordered)
  }

  const clearDragState = () => {
    setDraggingLinkId(null)
    setDragOverLinkId(null)
  }

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
    <section className="mx-auto flex w-full max-w-[110rem] flex-col gap-6 px-2 pb-24 sm:px-3 lg:px-4 lg:pb-28">
      {editMode ? (
        <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground ">编辑模式</p>
            <p className="mt-1 text-sm text-muted-foreground ">点击卡片编辑，拖动卡片调整顺序。</p>
          </div>
          <Button variant="secondary" onClick={onCreateGroup}>
            <AppIcon name="folder-plus" className="mr-2 h-4 w-4" />
            新建分组
          </Button>
        </div>
      ) : null}

      {sections.map((section, groupIndex) => {
        const { group, links } = section
        const linkIds = links.map((link) => link.id)

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
                <div
                  className="nav-link-grid grid gap-3 pb-1"
                  style={{
                    minWidth: '0',
                  }}
                >
                  {links.map((link) => {
                    const iconOnly = link.tileSize === '1x1'
                    const iconClassName = cardDensity === 'compact' ? 'h-12 w-12' : 'h-14 w-14'
                    const glyphClassName = cardDensity === 'compact' ? 'h-9 w-9' : 'h-10 w-10'
                    const imagePaddingClassName = 'p-0.5'
                    const fallbackTextClassName = cardDensity === 'compact' ? 'text-xl' : 'text-2xl'
                    const target = getLinkTarget(link.openMode, openInNewTab)
                    const isDragging = draggingLinkId === link.id
                    const isDragOver = dragOverLinkId === link.id
                    const hasCustomBackground = hasCustomLinkCardBackground(link.backgroundColor)
                    const hoverClassName = hasCustomBackground
                      ? 'hover:brightness-95 hover:shadow-md dark:hover:brightness-110'
                      : 'hover:bg-muted/60 hover:shadow-md'
                    const draggingClassName = isDragging
                      ? `scale-[0.98] opacity-60 ${hasCustomBackground ? '' : 'bg-muted'}`
                      : ''
                    const sharedClassName = `${editMode ? 'cursor-pointer' : ''} group relative overflow-hidden rounded-xl border border-border bg-card transition-[border-color,background-color,filter,transform,box-shadow,opacity] duration-200 hover:border-ring/35 ${hoverClassName} ${draggingClassName} ${isDragOver ? 'border-primary ring-1 ring-primary/20' : ''} ${getTileClassName(link.tileSize, cardDensity)}`

                    const content = iconOnly ? (
                      <LinkVisual
                        link={link}
                        iconClassName={iconClassName}
                        glyphClassName={glyphClassName}
                        imagePaddingClassName={imagePaddingClassName}
                        fallbackTextClassName={fallbackTextClassName}
                      />
                    ) : (
                      <>
                        <LinkVisual
                          link={link}
                          iconClassName={cardDensity === 'compact' ? 'h-10 w-10' : 'h-11 w-11'}
                          glyphClassName={cardDensity === 'compact' ? 'h-7 w-7' : 'h-8 w-8'}
                          imagePaddingClassName={imagePaddingClassName}
                          fallbackTextClassName={cardDensity === 'compact' ? 'text-lg' : 'text-xl'}
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <h3
                            className={`truncate text-base font-semibold tracking-tight sm:text-[1.05rem] ${hasCustomBackground ? customLinkCardTextClassName : 'text-foreground'}`}
                          >
                            {link.title}
                          </h3>
                          <p
                            className={`mt-0.5 truncate whitespace-nowrap text-[11px] leading-4 ${hasCustomBackground ? customLinkCardMutedTextClassName : 'text-muted-foreground'} `}
                          >
                            {link.description || link.url}
                          </p>
                        </div>
                      </>
                    )

                    if (editMode) {
                      return (
                        <Button
                          key={link.id}
                          type="button"
                          variant="ghost"
                          draggable
                          onClick={() => onEditLink(link)}
                          onDragStart={(event) => handleDragStart(event, link.id)}
                          onDragOver={(event) => handleDragOver(event, link.id)}
                          onDrop={() => handleDrop(group.id, linkIds, link.id)}
                          onDragEnd={clearDragState}
                          onDragLeave={() => {
                            if (dragOverLinkId === link.id) setDragOverLinkId(null)
                          }}
                          title={`编辑 ${link.title}`}
                          aria-label={`编辑 ${link.title}`}
                          style={getLinkCardStyle(link.backgroundColor)}
                          className={`h-auto justify-start whitespace-normal p-0 text-left font-normal ${sharedClassName}`}
                        >
                          {content}
                        </Button>
                      )
                    }

                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target={target}
                        rel={target === '_blank' ? 'noreferrer' : undefined}
                        title={link.title}
                        aria-label={link.title}
                        style={getLinkCardStyle(link.backgroundColor)}
                        className={sharedClassName}
                      >
                        {content}
                      </a>
                    )
                  })}
                </div>
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
  )
}
