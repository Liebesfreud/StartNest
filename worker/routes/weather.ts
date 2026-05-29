import { ApiError, jsonSuccess } from '../auth/access'

const WTTR_TIMEOUT_MS = 2500

const wttrWeatherCodes: Record<string, string> = {
  '113': 'sunny',
  '116': 'partly_cloudy_day',
  '119': 'cloud',
  '122': 'cloud',
  '143': 'foggy',
  '176': 'rainy',
  '179': 'weather_mix',
  '182': 'weather_mix',
  '185': 'weather_mix',
  '200': 'thunderstorm',
  '227': 'weather_snowy',
  '230': 'snowing',
  '248': 'foggy',
  '260': 'foggy',
  '263': 'rainy',
  '266': 'rainy',
  '281': 'weather_mix',
  '284': 'weather_mix',
  '293': 'rainy',
  '296': 'rainy',
  '299': 'rainy',
  '302': 'rainy_heavy',
  '305': 'rainy_heavy',
  '308': 'rainy_heavy',
  '311': 'weather_mix',
  '314': 'weather_mix',
  '317': 'weather_mix',
  '320': 'weather_snowy',
  '323': 'weather_snowy',
  '326': 'weather_snowy',
  '329': 'snowing',
  '332': 'snowing',
  '335': 'snowing',
  '338': 'snowing',
  '350': 'weather_mix',
  '353': 'rainy',
  '356': 'rainy_heavy',
  '359': 'rainy_heavy',
  '362': 'weather_mix',
  '365': 'weather_mix',
  '368': 'weather_snowy',
  '371': 'snowing',
  '374': 'weather_mix',
  '377': 'weather_mix',
  '386': 'thunderstorm',
  '389': 'thunderstorm',
  '392': 'thunderstorm',
  '395': 'snowing',
}

const wttrSchema = {
  isWeatherResponse(value: unknown): value is {
    current_condition: Array<{
      temp_C: string
      temp_F: string
      weatherCode: string
      weatherDesc: Array<{ value: string }>
      localObsDateTime?: string
      observation_time?: string
    }>
    nearest_area?: Array<{
      areaName?: Array<{ value: string }>
      region?: Array<{ value: string }>
      country?: Array<{ value: string }>
    }>
  } {
    if (typeof value !== 'object' || value === null) return false
    const response = value as { current_condition?: unknown }
    if (!Array.isArray(response.current_condition) || response.current_condition.length === 0) return false
    const current = response.current_condition[0] as { temp_C?: unknown; temp_F?: unknown; weatherCode?: unknown; weatherDesc?: unknown }
    return typeof current.temp_C === 'string'
      && typeof current.temp_F === 'string'
      && typeof current.weatherCode === 'string'
      && Array.isArray(current.weatherDesc)
  },
}

function outputUnit(unit: string | null) {
  return unit === 'f' ? 'F' : 'C'
}

function getTemperature(current: { temp_C: string; temp_F: string }, unit: string | null) {
  return Number(unit === 'f' ? current.temp_F : current.temp_C)
}

function getCondition(current: { weatherDesc: Array<{ value: string }> }) {
  return current.weatherDesc[0]?.value || '天气未知'
}

function getLocationName(response: {
  nearest_area?: Array<{
    areaName?: Array<{ value: string }>
    region?: Array<{ value: string }>
    country?: Array<{ value: string }>
  }>
}) {
  const area = response.nearest_area?.[0]
  if (!area) return null
  const parts = [area.areaName?.[0]?.value, area.region?.[0]?.value, area.country?.[0]?.value]
    .filter((value): value is string => Boolean(value))
  return parts.length > 0 ? parts.join(' / ') : null
}

function mapWttrIcon(code: string, text: string) {
  const mapped = wttrWeatherCodes[code]
  if (mapped) return mapped
  if (text.includes('雷') || text.toLowerCase().includes('thunder')) return 'thunderstorm'
  if (text.includes('雪') || text.toLowerCase().includes('snow')) return 'weather_snowy'
  if (text.includes('雨') || text.toLowerCase().includes('rain') || text.toLowerCase().includes('drizzle')) {
    return text.includes('大') || text.includes('暴') || text.toLowerCase().includes('heavy') ? 'rainy_heavy' : 'rainy'
  }
  if (text.includes('雾') || text.includes('霾') || text.toLowerCase().includes('fog') || text.toLowerCase().includes('mist')) return 'foggy'
  if (text.includes('阴') || text.includes('云') || text.toLowerCase().includes('cloud') || text.toLowerCase().includes('overcast')) return 'cloud'
  if (text.includes('晴') || text.toLowerCase().includes('sunny') || text.toLowerCase().includes('clear')) return 'sunny'
  return 'cloud'
}

export async function getWeather(request: Request) {
  const url = new URL(request.url)
  const lat = Number(url.searchParams.get('lat'))
  const lon = Number(url.searchParams.get('lon'))
  const unit = url.searchParams.get('unit')

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new ApiError(400, 'INVALID_COORDINATES', '无效的经纬度参数。')
  }

  if (unit !== null && unit !== 'system' && unit !== 'c' && unit !== 'f') {
    throw new ApiError(400, 'INVALID_TEMPERATURE_UNIT', '无效的温度单位参数。')
  }

  const weatherUrl = new URL(`https://wttr.in/${lat.toFixed(2)},${lon.toFixed(2)}`)
  weatherUrl.searchParams.set('format', 'j1')
  weatherUrl.searchParams.set('lang', 'zh')

  const weatherResponse = await fetch(weatherUrl.toString(), {
    signal: AbortSignal.timeout(WTTR_TIMEOUT_MS),
    headers: { 'User-Agent': 'StartNest weather proxy' },
  })

  if (!weatherResponse.ok) {
    throw new ApiError(502, 'WEATHER_PROVIDER_ERROR', '天气服务暂时不可用。')
  }

  const weatherJson: unknown = await weatherResponse.json()
  if (!wttrSchema.isWeatherResponse(weatherJson)) {
    throw new ApiError(502, 'WEATHER_PROVIDER_INVALID_RESPONSE', '天气服务返回了无法识别的数据。')
  }

  const current = weatherJson.current_condition[0]
  const temperature = getTemperature(current, unit)
  if (!Number.isFinite(temperature)) {
    throw new ApiError(502, 'WEATHER_PROVIDER_INVALID_RESPONSE', '天气服务返回了无法识别的数据。')
  }

  const condition = getCondition(current)

  return jsonSuccess({
    temperature,
    unit: outputUnit(unit),
    condition,
    icon: mapWttrIcon(current.weatherCode, condition),
    locationName: getLocationName(weatherJson),
    fetchedAt: current.localObsDateTime || current.observation_time || new Date().toISOString(),
  })
}
