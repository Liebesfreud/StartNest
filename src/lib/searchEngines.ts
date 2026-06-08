import type { SearchEngine } from './api'

export type SearchEngineOption = {
  value: string
  id: string
  name: string
  urlTemplate: string
  icon: string | null
  source: 'built-in' | 'custom'
}

export const builtInSearchEngines: SearchEngineOption[] = [
  {
    value: 'bing',
    id: 'bing',
    name: '必应',
    urlTemplate: 'https://www.bing.com/search?q={query}',
    icon: null,
    source: 'built-in',
  },
  {
    value: 'google',
    id: 'google',
    name: '谷歌',
    urlTemplate: 'https://www.google.com/search?q={query}',
    icon: null,
    source: 'built-in',
  },
]

export function getCustomSearchEngineValue(id: string) {
  return `custom:${id}`
}

export function getSearchEngineOptions(searchEngines: SearchEngine[]): SearchEngineOption[] {
  return [
    ...builtInSearchEngines,
    ...searchEngines.map((engine) => ({
      value: getCustomSearchEngineValue(engine.id),
      id: engine.id,
      name: engine.name,
      urlTemplate: engine.urlTemplate,
      icon: engine.icon,
      source: 'custom' as const,
    })),
  ]
}

export function getSelectedSearchEngine(value: string | null | undefined, searchEngines: SearchEngine[]) {
  const options = getSearchEngineOptions(searchEngines)
  return options.find((engine) => engine.value === value) ?? builtInSearchEngines[0]
}

export function buildSearchUrl(urlTemplate: string, query: string) {
  return urlTemplate.replaceAll('{query}', encodeURIComponent(query))
}

export function validateSearchUrlTemplate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return '搜索 URL 不能为空。'
  if (trimmed.length > 2048) return '搜索 URL 不能超过 2048 个字符。'
  if (!trimmed.includes('{query}')) return '搜索 URL 需要包含 {query}。'

  try {
    const url = new URL(trimmed.replaceAll('{query}', 'startnest'))
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '仅支持 http 或 https 地址。'
    }
    return null
  } catch {
    return '请输入有效的搜索 URL。'
  }
}
