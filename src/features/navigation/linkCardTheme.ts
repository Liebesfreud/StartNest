import type { CSSProperties } from 'react'

const darkText = '#0f172a'
const lightText = '#f8fafc'

function parseHexColor(value: string) {
  const match = /^#([0-9a-fA-F]{6})$/.exec(value.trim())
  if (!match) return null

  const hex = match[1]
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  }
}

function toLinearColorChannel(value: number) {
  const normalized = value / 255
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

function getRelativeLuminance(color: { r: number; g: number; b: number }) {
  return (
    0.2126 * toLinearColorChannel(color.r) +
    0.7152 * toLinearColorChannel(color.g) +
    0.0722 * toLinearColorChannel(color.b)
  )
}

function getReadableCardColors(backgroundColor: string) {
  const color = parseHexColor(backgroundColor)
  if (!color) return null

  const useDarkText = getRelativeLuminance(color) > 0.46
  return useDarkText
    ? {
        foreground: darkText,
        mutedForeground: 'rgba(15, 23, 42, 0.68)',
        iconBackground: 'rgba(15, 23, 42, 0.08)',
        iconBorder: 'rgba(15, 23, 42, 0.12)',
      }
    : {
        foreground: lightText,
        mutedForeground: 'rgba(248, 250, 252, 0.72)',
        iconBackground: 'rgba(248, 250, 252, 0.14)',
        iconBorder: 'rgba(248, 250, 252, 0.18)',
      }
}

export function hasCustomLinkCardBackground(backgroundColor: string | null | undefined) {
  return Boolean(backgroundColor?.trim())
}

export function getLinkCardStyle(backgroundColor: string | null | undefined): CSSProperties | undefined {
  const trimmed = backgroundColor?.trim()
  if (!trimmed) return undefined

  const colors = getReadableCardColors(trimmed)
  if (!colors) return { backgroundColor: trimmed }

  return {
    backgroundColor: trimmed,
    color: colors.foreground,
    ['--link-card-foreground' as string]: colors.foreground,
    ['--link-card-muted-foreground' as string]: colors.mutedForeground,
    ['--link-card-icon-background' as string]: colors.iconBackground,
    ['--link-card-icon-border' as string]: colors.iconBorder,
  } as CSSProperties
}

export const customLinkCardTextClassName = 'text-[color:var(--link-card-foreground)]'
export const customLinkCardMutedTextClassName = 'text-[color:var(--link-card-muted-foreground)]'
export const customLinkCardIconBackgroundClassName = 'bg-[var(--link-card-icon-background)]'
export const customLinkCardIconBorderClassName = 'border-[color:var(--link-card-icon-border)]'
