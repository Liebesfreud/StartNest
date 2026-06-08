import type { Settings } from '../../lib/api'
import { SettingToggleCard, SegmentedControl, saveSetting } from './settingsControls'

type SettingsGeneralTabProps = {
  settings: Settings
  onSaveSetting: (payload: Partial<Omit<Settings, 'updatedAt'>>) => void
}

export function SettingsGeneralTab({ settings, onSaveSetting }: SettingsGeneralTabProps) {
  return (
    <>
      <SettingToggleCard
        icon="external-link"
        title="默认在新标签页打开"
        checked={settings.openInNewTab}
        onToggle={() => saveSetting(onSaveSetting, 'openInNewTab', !settings.openInNewTab)}
      />
      <SettingToggleCard
        icon="cloud"
        title="显示天气组件"
        checked={settings.weatherEnabled}
        onToggle={() => saveSetting(onSaveSetting, 'weatherEnabled', !settings.weatherEnabled)}
      />
      <SettingToggleCard
        icon="location"
        title="自动定位天气位置"
        checked={settings.weatherAutoLocate}
        disabled={!settings.weatherEnabled}
        onToggle={() => saveSetting(onSaveSetting, 'weatherAutoLocate', !settings.weatherAutoLocate)}
      />
      <SegmentedControl
        icon="temperature"
        title="温度单位"
        value={settings.temperatureUnit}
        disabled={!settings.weatherEnabled}
        options={[
          { value: 'system', label: '自动' },
          { value: 'c', label: '°C' },
          { value: 'f', label: '°F' },
        ]}
        onChange={(value) => saveSetting(onSaveSetting, 'temperatureUnit', value)}
      />
    </>
  )
}
