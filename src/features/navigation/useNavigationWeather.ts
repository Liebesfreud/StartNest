import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type Settings, type WeatherResponse } from '../../lib/api'

export type NavigationWeatherState =
  | { mode: 'hidden' }
  | { mode: 'idle' | 'loading' | 'error'; message: string }
  | { mode: 'ready'; data: WeatherResponse }

type LocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unsupported' | 'error'

function roundCoordinate(value: number) {
  return Math.round(value * 1000) / 1000
}

export function useNavigationWeather(settings: Settings | undefined): NavigationWeatherState {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')

  const weatherEnabled = settings?.weatherEnabled ?? true
  const weatherAutoLocate = settings?.weatherAutoLocate ?? false
  const temperatureUnit = settings?.temperatureUnit ?? 'system'
  const roundedCoords = coords
    ? { latitude: roundCoordinate(coords.latitude), longitude: roundCoordinate(coords.longitude) }
    : null

  useEffect(() => {
    if (!weatherEnabled || !weatherAutoLocate) {
      setCoords(null)
      setLocationStatus('idle')
      return
    }

    if (!('geolocation' in navigator)) {
      setCoords(null)
      setLocationStatus('unsupported')
      return
    }

    let cancelled = false
    setLocationStatus('locating')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationStatus('ready')
      },
      (error) => {
        if (cancelled) return
        setCoords(null)
        setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 10 * 60 * 1000,
      },
    )

    return () => {
      cancelled = true
    }
  }, [weatherAutoLocate, weatherEnabled])

  const weatherQuery = useQuery({
    queryKey: ['weather', roundedCoords?.latitude, roundedCoords?.longitude, temperatureUnit],
    queryFn: () =>
      api.getWeather({
        latitude: roundedCoords!.latitude,
        longitude: roundedCoords!.longitude,
        temperatureUnit,
      }),
    enabled: weatherEnabled && locationStatus === 'ready' && roundedCoords !== null,
    staleTime: 15 * 60 * 1000,
    retry: 1,
  })

  if (!weatherEnabled) return { mode: 'hidden' }
  if (!weatherAutoLocate) return { mode: 'idle', message: '开启自动定位后显示天气' }
  if (locationStatus === 'locating') return { mode: 'loading', message: '正在获取天气...' }
  if (locationStatus === 'unsupported') return { mode: 'error', message: '当前浏览器不支持定位' }
  if (locationStatus === 'denied') return { mode: 'error', message: '定位权限被拒绝' }
  if (locationStatus === 'error') return { mode: 'error', message: '定位失败，请稍后重试' }
  if (weatherQuery.isPending) return { mode: 'loading', message: '正在获取天气...' }
  if (weatherQuery.isError) {
    return {
      mode: 'error',
      message: weatherQuery.error instanceof Error ? weatherQuery.error.message : '天气暂时不可用',
    }
  }
  if (weatherQuery.data) return { mode: 'ready', data: weatherQuery.data }
  return { mode: 'idle', message: '天气数据暂不可用' }
}
