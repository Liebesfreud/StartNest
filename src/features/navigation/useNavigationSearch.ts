import { useEffect, useMemo, useRef, useState } from 'react'
import { buildSearchUrl, getSearchEngineOptions, getSelectedSearchEngine } from '../../lib/searchEngines'
import type { Group, LinkItem, SearchEngine, Settings } from '../../lib/api'

export function useNavigationSearch({
  groups,
  links,
  searchEngines,
  settings,
}: {
  groups: Group[]
  links: LinkItem[]
  searchEngines: SearchEngine[]
  settings: Settings | undefined
}) {
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement !== searchRef.current) {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const searchEngineOptions = useMemo(() => getSearchEngineOptions(searchEngines), [searchEngines])
  const searchEngine = useMemo(
    () => getSelectedSearchEngine(settings?.searchEngine, searchEngines),
    [searchEngines, settings?.searchEngine],
  )
  const rawQuery = search.trim()
  const query = rawQuery.toLowerCase()
  const visibleLinks = useMemo(() => {
    if (!query) return links
    return links.filter((link) =>
      [link.title, link.url, link.description ?? ''].some((value) => value.toLowerCase().includes(query)),
    )
  }, [links, query])

  const sections = useMemo(() => {
    const nextSections = groups.map((group) => ({
      group,
      links: visibleLinks.filter((link) => link.groupId === group.id),
    }))

    return query ? nextSections.filter((section) => section.links.length > 0) : nextSections
  }, [groups, query, visibleLinks])

  const hasSearchResults = sections.some((section) => section.links.length > 0)

  const handleSearchWeb = () => {
    if (!rawQuery) return
    const url = buildSearchUrl(searchEngine.urlTemplate, rawQuery)
    if (settings?.openInNewTab ?? true) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    window.location.href = url
  }

  return {
    search,
    searchRef,
    setSearch,
    query,
    sections,
    hasSearchResults,
    searchEngine,
    searchEngineOptions,
    handleSearchWeb,
  }
}
