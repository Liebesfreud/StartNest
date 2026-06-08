import { forwardRef } from 'react'
import { Search } from 'lucide-react'
import type { SearchEngineOption } from '../../lib/searchEngines'
import { AppIcon } from '../../components/AppIcon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function SearchEngineLogo({ engine }: { engine: SearchEngineOption }) {
  if (engine.value === 'google') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.67Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3.01c-1.08.72-2.46 1.15-4.07 1.15-3.12 0-5.76-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28v-3.1H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38l4-3.1Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l4 3.1c.95-2.84 3.59-4.95 6.71-4.95Z"
        />
      </svg>
    )
  }

  if (engine.value === 'bing') {
    return (
      <div
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[#008373] text-[11px] font-bold leading-none text-primary-foreground"
      >
        b
      </div>
    )
  }

  return engine.icon ? (
    <AppIcon name={engine.icon} className="h-5 w-5 shrink-0 text-muted-foreground" />
  ) : (
    <div
      aria-hidden="true"
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-muted text-[11px] font-bold leading-none text-muted-foreground"
    >
      {engine.name.slice(0, 1).toUpperCase()}
    </div>
  )
}

export const NavigationSearch = forwardRef<
  HTMLInputElement,
  {
    value: string
    searchEngine: SearchEngineOption
    searchEngines: SearchEngineOption[]
    onChange: (value: string) => void
    onSearchEngineChange: (value: string) => void
    onSearchWeb: () => void
  }
>(function NavigationSearch({ value, searchEngine, searchEngines, onChange, onSearchEngineChange, onSearchWeb }, ref) {
  return (
    <div className="mx-auto w-full max-w-[60rem]">
      <div className="flex items-center rounded-xl border bg-card/90 px-2.5 py-1.5 shadow-sm backdrop-blur transition-all duration-300 focus-within:ring-2 focus-within:ring-ring/20 sm:px-3">
        <div className="flex shrink-0 items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-muted-foreground">
          <SearchEngineLogo engine={searchEngine} />
          <Select value={searchEngine.value} onValueChange={onSearchEngineChange}>
            <SelectTrigger
              aria-label="选择搜索引擎"
              className="h-auto min-h-0 w-auto min-w-14 max-w-28 gap-1 border-none bg-transparent px-0 py-0 text-[11px] font-semibold text-muted-foreground shadow-none focus:ring-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-32">
              {searchEngines.map((engine) => (
                <SelectItem key={engine.value} value={engine.value}>
                  {engine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onSearchWeb()
            }
          }}
          className="min-w-0 w-full border-none bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:ring-0 sm:px-4 sm:text-base"
          placeholder="搜索内容"
          type="text"
          aria-label="搜索链接或互联网"
        />
      </div>
    </div>
  )
})
