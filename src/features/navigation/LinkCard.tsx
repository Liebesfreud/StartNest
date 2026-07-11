import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo, useRef, useState, type CSSProperties } from 'react'
import { AppIcon } from '../../components/AppIcon'
import type { LinkItem } from '../../lib/api'
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

export type LinkCardProps = {
  link: LinkItem
  editMode: boolean
  cardDensity: 'compact' | 'comfortable'
  openInNewTab: boolean
  isDragging: boolean
  isDragOver: boolean
  onEditLink: (link: LinkItem) => void
}

export const LinkCard = memo(function LinkCard({
  link,
  editMode,
  cardDensity,
  openInNewTab,
  isDragging,
  isDragOver,
  onEditLink,
}: LinkCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: link.id,
    disabled: !editMode,
  })
  const suppressNextClickRef = useRef(false)
  const { onKeyDown: handleSortableKeyDown, ...sortableListeners } = listeners ?? {}
  const iconOnly = link.tileSize === '1x1'
  const iconClassName = cardDensity === 'compact' ? 'h-12 w-12' : 'h-14 w-14'
  const glyphClassName = cardDensity === 'compact' ? 'h-9 w-9' : 'h-10 w-10'
  const imagePaddingClassName = 'p-0.5'
  const fallbackTextClassName = cardDensity === 'compact' ? 'text-xl' : 'text-2xl'
  const target = getLinkTarget(link.openMode, openInNewTab)
  const hasCustomBackground = hasCustomLinkCardBackground(link.backgroundColor)
  const hoverClassName = hasCustomBackground
    ? 'hover:brightness-95 hover:shadow-md dark:hover:brightness-110'
    : 'hover:bg-muted/60 hover:shadow-md'
  const draggingClassName = isDragging
    ? `scale-[0.98] opacity-60 ${hasCustomBackground ? '' : 'bg-muted'}`
    : ''
  const sharedClassName = `${editMode ? 'cursor-pointer' : ''} group relative overflow-hidden rounded-xl border border-border bg-card transition-[border-color,background-color,filter,transform,box-shadow,opacity] duration-200 hover:border-ring/35 ${hoverClassName} ${draggingClassName} ${isDragOver ? 'border-primary ring-1 ring-primary/20' : ''} ${getTileClassName(link.tileSize, cardDensity)}`
  const sortableStyle = {
    ...(getLinkCardStyle(link.backgroundColor) ?? {}),
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: editMode ? 'manipulation' : undefined,
  } satisfies CSSProperties

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
        ref={setNodeRef}
        {...attributes}
        {...sortableListeners}
        type="button"
        variant="ghost"
        onKeyDown={(event) => {
          if (event.key === ' ' && isSortableDragging) {
            suppressNextClickRef.current = true
            window.setTimeout(() => {
              suppressNextClickRef.current = false
            }, 250)
          }
          handleSortableKeyDown?.(event)
        }}
        onClick={() => {
          if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false
            return
          }
          onEditLink(link)
        }}
        title={`编辑 ${link.title}`}
        aria-label={`编辑 ${link.title}`}
        style={sortableStyle}
        className={`h-auto justify-start whitespace-normal p-0 text-left font-normal ${sharedClassName}`}
      >
        {content}
      </Button>
    )
  }

  return (
    <a
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
})
