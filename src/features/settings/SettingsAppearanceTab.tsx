import type { Settings } from '../../lib/api'
import { AppIcon } from '../../components/AppIcon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  NumberControl,
  SettingToggleCard,
  SegmentedControl,
  saveSetting,
  normalizeNumberSetting,
} from './settingsControls'

type SettingsAppearanceTabProps = {
  settings: Settings
  pending: boolean
  wallpaperDraft: string
  wallpaperError: string | null
  onWallpaperChange: (value: string) => void
  onSaveWallpaper: () => void
  onClearWallpaper: () => void
  onSaveSetting: (payload: Partial<Omit<Settings, 'updatedAt'>>) => void
}

export function SettingsAppearanceTab({
  settings,
  pending,
  wallpaperDraft,
  wallpaperError,
  onWallpaperChange,
  onSaveWallpaper,
  onClearWallpaper,
  onSaveSetting,
}: SettingsAppearanceTabProps) {
  return (
    <>
      <SegmentedControl
        icon="contrast-2"
        title="主题模式"
        value={settings.themeMode}
        options={[
          { value: 'light', label: '浅色' },
          { value: 'dark', label: '深色' },
          { value: 'system', label: '跟随系统' },
        ]}
        onChange={(value) => saveSetting(onSaveSetting, 'themeMode', value)}
      />
      <SegmentedControl
        icon="layout-dashboard"
        title="卡片密度"
        value={settings.cardDensity}
        options={[
          { value: 'comfortable', label: '舒适' },
          { value: 'compact', label: '紧凑' },
        ]}
        onChange={(value) => saveSetting(onSaveSetting, 'cardDensity', value)}
      />
      <SettingToggleCard
        icon="grid-dots"
        title="显示分组图标"
        checked={settings.showGroupIcons}
        onToggle={() => saveSetting(onSaveSetting, 'showGroupIcons', !settings.showGroupIcons)}
      />
      <Card className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
            <AppIcon name="wallpaper" className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <Label htmlFor="settings-wallpaper-url">全局壁纸</Label>
            <div className="mt-3 space-y-3">
              <Input
                id="settings-wallpaper-url"
                type="url"
                inputMode="url"
                value={wallpaperDraft}
                onChange={(event) => onWallpaperChange(event.target.value)}
                placeholder="https://example.com/wallpaper.jpg"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={onSaveWallpaper} disabled={pending}>
                  {pending ? '应用中' : '应用壁纸'}
                </Button>
                <Button variant="secondary" onClick={onClearWallpaper} disabled={pending && !settings.wallpaperUrl}>
                  清空壁纸
                </Button>
              </div>
              {wallpaperError ? <p className="text-sm text-destructive">{wallpaperError}</p> : null}
            </div>
          </div>
        </div>
      </Card>
      <NumberControl
        icon="droplet"
        title="背景遮罩强度"
        value={settings.wallpaperOverlayOpacity}
        min={0}
        max={100}
        suffix="%"
        disabled={!settings.wallpaperUrl}
        onChange={(value) =>
          saveSetting(onSaveSetting, 'wallpaperOverlayOpacity', normalizeNumberSetting(String(value), 0, 100))
        }
      />
      <NumberControl
        icon="aperture"
        title="背景模糊"
        value={settings.wallpaperBlur}
        min={0}
        max={100}
        disabled={!settings.wallpaperUrl}
        onChange={(value) => saveSetting(onSaveSetting, 'wallpaperBlur', normalizeNumberSetting(String(value), 0, 100))}
      />
    </>
  )
}
