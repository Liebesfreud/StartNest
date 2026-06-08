import { z } from 'zod'

const userSchema = z.object({
  email: z.string().min(1),
  subject: z.string().min(1),
  name: z.string().nullable(),
  displayName: z.string().nullable(),
})

export const updateUserSchema = z.object({
  displayName: z.string().trim().max(80),
})

export const groupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const linkSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  title: z.string().min(1),
  url: z.string().url(),
  icon: z.string().nullable(),
  iconMode: z.enum(['favicon', 'material', 'image', 'text']),
  iconImageUrl: z.string().url().nullable(),
  iconText: z.string().nullable(),
  description: z.string().nullable(),
  tileSize: z.enum(['1x1', '1x3']),
  openMode: z.enum(['global', 'same-tab', 'new-tab']),
  backgroundColor: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const webPanelSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  url: z.string().url(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  openMode: z.enum(['iframe', 'external']),
  enabled: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const searchEngineSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  urlTemplate: z.string().min(1),
  icon: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const wallpaperUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  })
  .nullable()

const wallpaperBlurSchema = z.number().min(0).max(100)
const wallpaperOverlayOpacitySchema = z.number().min(0).max(100)

export const settingsSchema = z.object({
  themeMode: z.enum(['light', 'dark', 'system']),
  cardDensity: z.enum(['compact', 'comfortable']),
  openInNewTab: z.boolean(),
  showGroupIcons: z.boolean(),
  searchEngine: z.string().default('bing'),
  weatherEnabled: z.boolean().default(true),
  weatherAutoLocate: z.boolean().default(false),
  temperatureUnit: z.enum(['system', 'c', 'f']).default('system'),
  wallpaperUrl: wallpaperUrlSchema.default(null),
  wallpaperOverlayOpacity: wallpaperOverlayOpacitySchema.default(78),
  wallpaperBlur: wallpaperBlurSchema.default(0),
  updatedAt: z.string(),
})

export const bootstrapSchema = z.object({
  user: userSchema,
  groups: z.array(groupSchema),
  links: z.array(linkSchema),
  settings: settingsSchema,
  panels: z.array(webPanelSchema),
  searchEngines: z.array(searchEngineSchema).default([]),
})

export const exportPayloadSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  groups: z.array(groupSchema),
  links: z.array(linkSchema),
  settings: settingsSchema,
  panels: z.array(webPanelSchema).default([]),
  searchEngines: z.array(searchEngineSchema).default([]),
})

export const weatherResponseSchema = z.object({
  temperature: z.number(),
  unit: z.enum(['C', 'F']),
  condition: z.string().min(1),
  icon: z.string().min(1),
  locationName: z.string().nullable(),
  fetchedAt: z.string(),
})
