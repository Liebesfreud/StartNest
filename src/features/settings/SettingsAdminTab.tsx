import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { AppIcon } from '../../components/AppIcon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SettingsAdminTabProps = {
  user: User
  displayName: string
  nameDraft: string
  canSaveName: boolean
  updatePending: boolean
  updateError: string | null
  onNameDraftChange: (value: string) => void
  onSaveName: () => void
}

function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  const handleLogout = async () => {
    setPending(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Button variant="destructive" onClick={handleLogout} disabled={pending}>
      {pending ? '退出中...' : '退出'}
    </Button>
  )
}

export function SettingsAdminTab({
  user,
  displayName,
  nameDraft,
  canSaveName,
  updatePending,
  updateError,
  onNameDraftChange,
  onSaveName,
}: SettingsAdminTabProps) {
  return (
    <>
      <Card className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center justify-center text-primary">
            <AppIcon name="user-circle" className="h-10 w-10" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{user.subject.replace(/^admin:/, '')}</p>
          </div>
        </div>
      </Card>

      <Card className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
            <AppIcon name="badge" className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <Label htmlFor="settings-display-name">显示名称</Label>
            <p className="mt-1 text-xs text-muted-foreground">仅在 StartNest 内显示，不会修改登录系统中的姓名。</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Input
                id="settings-display-name"
                value={nameDraft}
                onChange={(event) => onNameDraftChange(event.target.value)}
                placeholder="请输入显示名称"
                className="flex-1"
              />
              <Button onClick={onSaveName} disabled={updatePending || !canSaveName} className="sm:self-start">
                {updatePending ? '保存中' : '保存'}
              </Button>
            </div>
            {updateError ? <p className="mt-3 text-sm text-destructive">{updateError}</p> : null}
          </div>
        </div>
      </Card>

      <Card className="border-destructive/25 bg-destructive/5 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
              <AppIcon name="logout" className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">退出登录</p>
              <p className="mt-0.5 text-xs text-muted-foreground">清除本地会话并返回登录页面。</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </Card>
    </>
  )
}
