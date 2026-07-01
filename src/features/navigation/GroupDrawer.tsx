import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export type GroupDraft = {
  name: string
  icon: string
}

export function GroupDrawer({
  open,
  title,
  draft,
  pending,
  errorMessage,
  onOpenChange,
  onDraftChange,
  onSubmit,
}: {
  open: boolean
  title: string
  draft: GroupDraft
  pending: boolean
  errorMessage: string | null
  onOpenChange: (open: boolean) => void
  onDraftChange: (next: GroupDraft | ((current: GroupDraft) => GroupDraft)) => void
  onSubmit: () => void
}) {
  const setDraft = (next: GroupDraft | ((current: GroupDraft) => GroupDraft)) => {
    onDraftChange(next)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[min(100vw,30rem)] overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="sr-only">设置分组名称和图标。</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">基础信息</p>
            <Label htmlFor="group-name">分组名称</Label>
            <Input
              id="group-name"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="分组名称"
            />
            <Label htmlFor="group-icon">图标</Label>
            <Input
              id="group-icon"
              value={draft.icon}
              onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}
              placeholder="图标名（如：folder、plane、brand-github）"
            />
          </div>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
              取消
            </Button>
            <Button onClick={onSubmit} disabled={pending}>
              {pending ? '保存中' : title === '编辑分组' ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
