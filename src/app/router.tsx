import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { App } from './App'
import { RequireAuth } from '../features/auth/RequireAuth'

const NavigationPage = lazy(async () => {
  const module = await import('../features/navigation/NavigationPage')
  return { default: module.NavigationPage }
})

const SettingsPage = lazy(async () => {
  const module = await import('../features/settings/SettingsPage')
  return { default: module.SettingsPage }
})

const PanelPage = lazy(async () => {
  const module = await import('../features/panels/PanelPage')
  return { default: module.PanelPage }
})

const LoginPage = lazy(async () => {
  const module = await import('../features/auth/LoginPage')
  return { default: module.LoginPage }
})

function RouteFallback() {
  return (
    <div className="mx-auto flex w-full max-w-[60rem] items-center justify-center px-4 py-24 text-sm text-muted-foreground sm:px-6 lg:px-8">
      正在加载页面...
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteFallback />}>
            <NavigationPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: 'panels/:panelId',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <PanelPage />
          </Suspense>
        ),
      },
    ],
  },
])
