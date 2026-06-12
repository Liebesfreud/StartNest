import { useId } from 'react'
import type { Settings } from '../../lib/api'
import { AppIcon } from '../../components/AppIcon'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type SettingToggleCardProps = {
  icon: string
  title: string
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}

type SegmentedOption<T extends string> = {
  value: T
  label: string
}

type SegmentedControlProps<T extends string> = {
  icon: string
  title: string
  value: T
  options: SegmentedOption<T>[]
  disabled?: boolean
  onChange: (value: T) => void
}

type NumberControlProps = {
  icon: string
  title: string
  value: number
  min: number
  max: number
  suffix?: string
  disabled?: boolean
  onChange: (value: number) => void
}

const sectionItemClassName = 'px-4 py-4'
const rowIconClassName = 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground'

export function SettingToggleCard({ icon, title, checked, disabled = false, onToggle }: SettingToggleCardProps) {
  return (
    <Card className={`${sectionItemClassName} flex items-center justify-between gap-3 shadow-none`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={rowIconClassName}>
          <AppIcon name={icon} className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} aria-label={title} />
    </Card>
  )
}

export function SegmentedControl<T extends string>({
  icon,
  title,
  value,
  options,
  disabled = false,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <Card className={`${sectionItemClassName} shadow-none`}>
      <div className="flex items-start gap-3">
        <div className={rowIconClassName}>
          <AppIcon name={icon} className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <ToggleGroup
            type="single"
            value={value}
            disabled={disabled}
            onValueChange={(nextValue) => {
              if (nextValue) onChange(nextValue as T)
            }}
            className="mt-3 flex flex-wrap justify-start"
          >
            {options.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value} variant="outline" className="min-w-16">
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </Card>
  )
}

export function NumberControl({
  icon,
  title,
  value,
  min,
  max,
  suffix = '',
  disabled = false,
  onChange,
}: NumberControlProps) {
  const inputId = useId()

  return (
    <Card className={`${sectionItemClassName} shadow-none`}>
      <div className="flex items-start gap-3">
        <div className={rowIconClassName}>
          <AppIcon name={icon} className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={inputId}>{title}</Label>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {min}-{max}
              {suffix}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Input
              type="number"
              min={min}
              max={max}
              step={1}
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(Number(event.target.value))}
              id={inputId}
            />
            {suffix ? <span className="shrink-0 text-sm text-muted-foreground">{suffix}</span> : null}
          </div>
        </div>
      </div>
    </Card>
  )
}

export function saveSetting<K extends keyof Omit<Settings, 'updatedAt'>>(
  mutate: (payload: Partial<Omit<Settings, 'updatedAt'>>) => void,
  key: K,
  value: Settings[K],
) {
  mutate({ [key]: value })
}

export function normalizeNumberSetting(value: string, min: number, max: number) {
  if (!value.trim()) {
    return min
  }

  const next = Number(value)

  if (!Number.isFinite(next)) {
    return min
  }

  return Math.max(min, Math.min(max, Math.round(next)))
}
