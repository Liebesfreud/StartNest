import { IconX } from '@tabler/icons-react'
import type { Group } from '../../lib/api'
import { AppIcon } from '../../components/AppIcon'
import { getFaviconUrl } from '../../lib/favicon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  customLinkCardIconBackgroundClassName,
  customLinkCardMutedTextClassName,
  customLinkCardTextClassName,
  getLinkCardStyle,
  hasCustomLinkCardBackground,
} from './linkCardTheme'

export type LinkDraft = {
  title: string
  url: string
  icon: string
  iconMode: 'favicon' | 'material' | 'image' | 'text'
  iconImageUrl: string
  iconText: string
  description: string
  tileSize: '1x1' | '1x3'
  groupId: string
  openMode: 'global' | 'same-tab' | 'new-tab'
  backgroundColor: string
}

const segmentShellClassName = 'flex flex-wrap justify-start'
const sectionClassName = 'space-y-4'

function LinkPreview({ draft }: { draft: LinkDraft }) {
  const iconOnly = draft.tileSize === '1x1'
  const faviconUrl = getFaviconUrl(draft.url)
  const iconClassName = iconOnly ? 'h-[82%] w-[82%]' : 'h-[74%] w-[74%]'
  const customBackground = hasCustomLinkCardBackground(draft.backgroundColor)
  const iconFrameClassName = `${iconClassName} flex items-center justify-center overflow-hidden rounded-xl ${customBackground ? customLinkCardIconBackgroundClassName : 'bg-muted/70'}`
  const faviconClassName = `${iconClassName} object-contain ${iconOnly ? 'p-[8%]' : 'p-2.5'}`
  const fallbackText = (draft.iconText || draft.title || '?').trim().slice(0, 2).toUpperCase() || '?'
  const cardStyle = getLinkCardStyle(draft.backgroundColor)
  const previewTextColorClassName = customBackground ? customLinkCardTextClassName : 'text-primary'
  const plainTextClassName = `${iconClassName} flex items-center justify-center font-bold ${previewTextColorClassName} ${iconOnly ? 'text-[1.4rem]' : 'text-sm'}`
  const framedTextClassName = `${iconFrameClassName} font-bold ${previewTextColorClassName} ${iconOnly ? 'text-[1.4rem]' : 'text-sm'}`

  const visual =
    draft.iconMode === 'image' && draft.iconImageUrl ? (
      <img
        src={draft.iconImageUrl}
        alt=""
        aria-hidden="true"
        className={`h-full w-full object-contain ${iconClassName} ${iconOnly ? 'p-[8%]' : 'p-2.5'}`}
      />
    ) : draft.iconMode === 'material' && draft.icon ? (
      <div className={iconFrameClassName}>
        <AppIcon
          name={draft.icon}
          className={`${iconOnly ? 'h-[70%] w-[70%]' : 'h-[60%] w-[60%]'} ${previewTextColorClassName}`}
        />
      </div>
    ) : draft.iconMode === 'text' ? (
      <div className={plainTextClassName}>{fallbackText}</div>
    ) : faviconUrl ? (
      <img src={faviconUrl} alt="" aria-hidden="true" loading="lazy" decoding="async" className={faviconClassName} />
    ) : (
      <div className={framedTextClassName}>{fallbackText}</div>
    )

  return (
    <div className="flex justify-center border-b pb-6">
      <Card
        style={cardStyle}
        className={`overflow-hidden ${customBackground ? customLinkCardTextClassName : 'text-foreground'} ${iconOnly ? 'flex h-[4.8rem] w-[4.8rem] flex-col items-center justify-center p-[5%]' : 'grid h-[4.8rem] w-[15rem] grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-0 px-2.5 py-2'}`}
      >
        {iconOnly ? (
          <div className="flex h-[90%] w-[90%] items-center justify-center">{visual}</div>
        ) : (
          <>
            <div className="flex h-full w-[4.25rem] items-center justify-center self-stretch">
              <div className="flex h-full w-full items-center justify-center">{visual}</div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center pl-1 pr-1 text-left">
              <div className="truncate text-sm font-semibold">{draft.title || '未命名项目'}</div>
              <div
                className={`mt-0.5 truncate text-xs ${customBackground ? customLinkCardMutedTextClassName : 'text-muted-foreground'}`}
              >
                {draft.description || draft.url || '这里会显示描述或链接地址'}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) onChange(nextValue as T)
      }}
      className={segmentShellClassName}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} variant="outline">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export function CreateLinkDrawer({
  open,
  title,
  draft,
  groups,
  pending,
  onOpenChange,
  onDraftChange,
  onSubmit,
  onDelete,
}: {
  open: boolean
  title: string
  draft: LinkDraft
  groups: Group[]
  pending: boolean
  onOpenChange: (open: boolean) => void
  onDraftChange: (next: LinkDraft | ((current: LinkDraft) => LinkDraft)) => void
  onSubmit: () => void
  onDelete?: () => void
}) {
  const setDraft = (next: LinkDraft | ((current: LinkDraft) => LinkDraft)) => {
    onDraftChange(next)
  }

  const hasGroups = groups.length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[min(100vw,46rem)] overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="sr-only">填写链接信息并预览显示效果。</SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-6">
          <LinkPreview draft={draft} />

          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-[0.95rem] font-semibold tracking-tight text-foreground">基础信息</h3>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                <Input
                  aria-label="链接标题"
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="标题"
                  maxLength={20}
                />
                <Input
                  aria-label="链接描述"
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="描述信息"
                  maxLength={100}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,2.3fr)_120px]">
                <Input
                  aria-label="链接地址"
                  value={draft.url}
                  onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
                  placeholder="链接地址 (优先复制)"
                />
                <Select
                  value={draft.groupId}
                  onValueChange={(value) => setDraft((current) => ({ ...current, groupId: value }))}
                  disabled={!hasGroups}
                >
                  <SelectTrigger className="w-full" aria-label="选择分组">
                    <SelectValue placeholder={hasGroups ? '选择分组' : '无分组'} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <div className={sectionClassName}>
              <h3 className="text-[0.95rem] font-semibold tracking-tight text-foreground">图标组合</h3>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <SegmentedControl
                  value={draft.iconMode}
                  onChange={(value) => setDraft((current) => ({ ...current, iconMode: value }))}
                  options={[
                    { value: 'favicon', label: '站点图标' },
                    { value: 'material', label: '内置图标' },
                    { value: 'image', label: '图片地址' },
                    { value: 'text', label: '文字' },
                  ]}
                />
                <div className="w-full md:max-w-[200px]">
                  {draft.iconMode === 'material' ? (
                    <Input
                      aria-label="内置图标名称"
                      value={draft.icon}
                      onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}
                      placeholder="图标名 (如: home)"
                    />
                  ) : null}
                  {draft.iconMode === 'image' ? (
                    <Input
                      aria-label="图标图片地址"
                      value={draft.iconImageUrl}
                      onChange={(event) => setDraft((current) => ({ ...current, iconImageUrl: event.target.value }))}
                      placeholder="https://..."
                    />
                  ) : null}
                  {draft.iconMode === 'text' ? (
                    <Input
                      aria-label="文字图标"
                      value={draft.iconText}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, iconText: event.target.value.slice(0, 2) }))
                      }
                      placeholder="1-2字"
                      maxLength={2}
                    />
                  ) : null}
                  {draft.iconMode === 'favicon' ? (
                    <p className="pt-2.5 text-xs text-muted-foreground">将自动拉取 Favicon</p>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />
            <div className={sectionClassName}>
              <h3 className="text-[0.95rem] font-semibold tracking-tight text-foreground">显示属性</h3>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <SegmentedControl
                  value={draft.tileSize}
                  onChange={(value) => setDraft((current) => ({ ...current, tileSize: value }))}
                  options={[
                    { value: '1x1', label: '小卡片' },
                    { value: '1x3', label: '宽卡片' },
                  ]}
                />
                <SegmentedControl
                  value={draft.openMode}
                  onChange={(value) => setDraft((current) => ({ ...current, openMode: value }))}
                  options={[
                    { value: 'global', label: '跟随配置' },
                    { value: 'same-tab', label: '当前页' },
                    { value: 'new-tab', label: '新页签' },
                  ]}
                />
                <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                  <div className="relative flex-1">
                    <Input
                      aria-label="背景色"
                      value={draft.backgroundColor}
                      onChange={(event) => setDraft((current) => ({ ...current, backgroundColor: event.target.value }))}
                      placeholder="背景色 (#HEX)"
                      className="!min-h-[38px] py-1.5 pl-3 pr-8 w-full"
                    />
                    {draft.backgroundColor ? (
                      <Button
                        type="button"
                        onClick={() => setDraft((current) => ({ ...current, backgroundColor: '' }))}
                        variant="ghost"
                        size="icon"
                        className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="恢复默认背景色"
                        title="恢复默认"
                      >
                        <IconX className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    aria-label="选择背景色"
                    type="color"
                    value={draft.backgroundColor || '#f8fafc'}
                    onChange={(event) => setDraft((current) => ({ ...current, backgroundColor: event.target.value }))}
                    className="h-[38px] w-10 shrink-0 cursor-pointer rounded-md border bg-card p-0.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-between">
              <div>
                {onDelete ? (
                  <Button variant="destructive" onClick={onDelete} disabled={pending}>
                    删除当前链接
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2 sm:justify-end">
                <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
                  取消
                </Button>
                <Button onClick={onSubmit} disabled={pending || !hasGroups}>
                  {pending ? '保存中' : title === '编辑链接' ? '保存' : '创建'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
