# shadcn/ui 全量替换计划

## 目标

将 StartNest 的前端 UI 标准统一到 shadcn/ui：

- 通用 UI 原语统一来自 `src/components/ui/*`。
- 页面和业务组件只组合 UI 原语，不再在业务文件里重复手写按钮、输入框、开关、弹窗样式。
- 主题颜色、圆角、边框、焦点态统一使用 shadcn 的 CSS variables 和 Tailwind token。
- 保留现有业务功能、数据结构、路由和交互语义，不把 UI 替换和业务重构混在一起。

这次是全量替换，但不建议一次性大改所有文件。推荐做成多阶段迁移：先接入标准，再用兼容层降低风险，最后清理旧组件和旧 token。

## 现状判断

当前项目已经具备接入 shadcn 的基础：

- 框架是 Vite + React + TypeScript。
- 样式是 Tailwind CSS。
- 项目已经使用 Radix：
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-select`
  - `@radix-ui/react-switch` 目前在依赖里，但源码里还没有实际使用。
- 图标目前主要来自 `@tabler/icons-react`，通过 `src/components/AppIcon.tsx` 做了一层业务图标映射。

当前 UI 的主要问题：

- `Button`、`Input`、`SearchBar`、开关、分段按钮等是项目内手写样式。
- 颜色 token 使用 `background`、`surface`、`on-background`、`on-surface-variant`、`dark.surface` 等自定义命名，和 shadcn token 不一致。
- 弹窗和下拉框虽然用了 Radix 行为，但外观仍是项目自写 Tailwind class。
- 大量页面直接写 `rounded-xl border border-outline bg-surface ...`，后续统一风格会比较吃力。
- 当前还没有 `@/*` 路径别名，shadcn 默认结构需要补齐。

## 目标 UI 标准

推荐采用：

- shadcn `new-york` 风格。
- base color 使用 `neutral` 或 `zinc`，以更接近 shadcn 默认观感。
- UI 控件图标使用 `lucide-react`。
- 业务图标、用户自定义链接图标、favicon 逻辑暂时继续使用 `AppIcon` / `NamedIcon`，避免 UI 替换影响业务图标解析。

最终代码约定：

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
```

通用 class 合并统一使用：

```ts
import { cn } from '@/lib/utils'
```

除以下情况外，不再直接手写裸 `<button>` 样式：

- 链接磁贴这种业务专属交互容器。
- 原生文件上传 input。
- 原生颜色选择器 input。
- 需要特殊 HTML 语义的 anchor/link。

即使保留裸元素，也应使用 shadcn token，例如 `bg-card`、`text-foreground`、`border-border`、`text-muted-foreground`，不再使用旧的 `bg-surface`、`text-on-background`、`dark:bg-dark-surface`。

## 需要新增或调整的依赖

项目目前使用 `package-lock.json`，后续命令建议用 npm。

建议依赖：

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react
```

按 shadcn CLI 输出决定是否还需要：

```bash
npm install tailwindcss-animate
```

初始化：

```bash
npx shadcn@latest init
```

优先添加这些组件：

```bash
npx shadcn@latest add button input label textarea select dialog sheet alert-dialog card separator tabs switch dropdown-menu tooltip toggle-group badge skeleton scroll-area
```

后续如需要表单校验 UI，再添加：

```bash
npx shadcn@latest add form
```

当前项目没有 `react-hook-form`，所以第一轮不建议引入 `form`。现有表单逻辑大多是本地 state 和手写校验，直接使用 `Label`、`Input`、错误文本即可。

## 配置改造

### 1. 路径别名

需要给 Vite 和 TypeScript 增加 `@/*`。

`vite.config.ts`：

```ts
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

`tsconfig.app.json`：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2. shadcn 配置

新增 `components.json`，目标结构：

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 3. `src/lib/utils.ts`

新增：

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 4. Tailwind 和 CSS token

shadcn 标准 token 应成为主 token：

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`

当前 `applyTheme()` 已经把 `dark` class 加在 `document.documentElement` 上，和 shadcn 的 `.dark` 方案兼容。

迁移期间可以短期保留旧 token，避免所有页面必须同一提交改完。最终清理时应移除：

- `on-background`
- `on-surface`
- `on-surface-variant`
- `surface`
- `surface-container`
- `surface-container-low`
- `dark.background`
- `dark.surface`
- `dark.outline`
- `card-panel`
- `paper-card`
- `elegant-border`
- `soft-shadow`

旧 token 到新 token 的推荐映射：

| 旧写法 | 新写法 |
| --- | --- |
| `bg-background` | `bg-background`，但改为 CSS variable 驱动 |
| `text-on-background` | `text-foreground` |
| `text-on-surface` | `text-foreground` |
| `text-on-surface-variant` | `text-muted-foreground` |
| `bg-surface` | `bg-card` 或 `bg-background` |
| `bg-surface-container` | `bg-muted` |
| `bg-surface-container-low` | `bg-muted/60` 或 `bg-secondary` |
| `border-outline` | `border-border` |
| `bg-on-background` | `bg-primary` |
| `dark:*` 显式颜色 | 删除，交给 CSS variables |
| `focus:ring-[#99462a]/20` | `focus-visible:ring-ring/50` |

字体策略：

- shadcn 默认更偏系统 sans-serif。
- 当前大量 `font-headline` 使用 Georgia，视觉上会和 shadcn 风格冲突。
- 建议第一轮保留品牌标题里的少量 `font-headline`，普通控件、卡片标题、表单 label 改回 `font-sans`。
- 最终如果要完全 shadcn 化，应删除 `font-headline` / `font-label` 在 UI 控件里的使用。

圆角策略：

- 当前 Tailwind 配置把 `rounded-xl`、`rounded-2xl` 都压到 `1rem`。
- shadcn 使用 `--radius` 派生 `rounded-lg`、`rounded-md`、`rounded-sm`。
- 替换时不要继续全局强行把所有圆角设为 `1rem`，否则 shadcn 的层次会失真。

## 组件映射

| 当前组件/模式 | 目标 shadcn 组件 | 处理方式 |
| --- | --- | --- |
| `src/components/Button.tsx` | `src/components/ui/button.tsx` | 先做兼容包装，最终所有业务文件直接导入 UI Button |
| `variant="primary"` | `variant="default"` | 批量替换 |
| `variant="danger"` | `variant="destructive"` | 批量替换 |
| `variant="secondary"` | `variant="secondary"` | 保留 |
| `variant="ghost"` | `variant="ghost"` | 保留 |
| `src/components/Input.tsx` | `src/components/ui/input.tsx` | 先 re-export，最终直接导入 |
| 手写 `<label>` | `Label` | 表单区域统一替换 |
| `src/components/Select.tsx` | shadcn `Select` primitives | 先做 options 兼容包装，复杂页面再改为 primitives |
| `src/components/Drawer.tsx` | `Sheet` 或 `Dialog` | 编辑表单用 `Sheet`，普通居中弹窗用 `Dialog` |
| `src/components/ConfirmDialog.tsx` | `AlertDialog` | 删除旧 ConfirmDialog |
| `SettingToggleCard` | `Card` + `Switch` | 改成标准设置行组件 |
| `SegmentedControl` | `ToggleGroup` 或 `Tabs` | 设置项用 `ToggleGroup`，页面分区用 `Tabs` |
| `NumberControl` | `Card` + `Label` + `Input type="number"` | 保留数值归一化逻辑 |
| `SearchBar` / 导航搜索 | `Input` + `Select` + lucide `Search` | 删除手写 SVG |
| 侧边栏 icon button | `Button size="icon"` + `Tooltip` | Link 可用 `buttonVariants` 组合 |
| 空状态卡片 | `Card` 或 `Alert` 风格容器 | 用 shadcn token 重写 |
| 面板加载/错误 | `Card` + `Skeleton` + `Button` | 统一反馈状态 |

## 分阶段执行计划

### 阶段 0：准备和基线记录

目标：确认当前状态，避免 UI 替换时误伤业务逻辑。

任务：

- 新建迁移分支。
- 记录当前页面截图：
  - 登录页 `/login`
  - 导航首页 `/`
  - 设置页 `/settings`
  - 面板页 `/panels/:id`
- 运行：

```bash
npm run typecheck
npm run build
```

验收：

- 当前项目在迁移前可构建。
- 有迁移前截图作为对照。

### 阶段 1：接入 shadcn 基础设施

目标：只增加标准能力，不大面积改变页面。

任务：

- 添加 shadcn 依赖。
- 运行 `npx shadcn@latest init`。
- 添加第一批 UI 组件：
  - `button`
  - `input`
  - `label`
  - `textarea`
  - `select`
  - `dialog`
  - `sheet`
  - `alert-dialog`
  - `card`
  - `separator`
  - `tabs`
  - `switch`
  - `dropdown-menu`
  - `tooltip`
  - `toggle-group`
  - `badge`
  - `skeleton`
  - `scroll-area`
- 新增 `src/lib/utils.ts`。
- 增加 `@/*` alias。
- 调整 `tailwind.config.js` 和 `src/styles.css`，加入 shadcn token。
- 暂时保留旧 token，保证未迁移页面不崩。

验收：

```bash
npm run typecheck
npm run build
```

通过后进入下一阶段。

### 阶段 2：建立临时兼容层

目标：让全项目可以逐步替换，不需要同一提交改完所有引用。

任务：

- 把 `src/components/Button.tsx` 改为包装 shadcn Button。
  - `primary` 映射到 `default`。
  - `danger` 映射到 `destructive`。
  - `secondary`、`ghost` 直接映射。
- 把 `src/components/Input.tsx` 改为 re-export shadcn Input。
- 把 `src/components/Select.tsx` 改为基于 shadcn Select primitives 的 options 包装。
- 把 `src/components/ConfirmDialog.tsx` 改为基于 shadcn AlertDialog 的兼容组件。
- `Drawer.tsx` 先改为 shadcn Dialog 风格兼容组件，后续具体页面再决定是否换 Sheet。

验收：

- 页面行为不变。
- 按钮、输入框、下拉框、确认弹窗已经开始呈现 shadcn 风格。
- 旧业务文件暂时不用全部改 import。

### 阶段 3：登录页迁移

目标：用小范围页面验证新的 UI 标准。

涉及文件：

- `src/features/auth/LoginPage.tsx`
- `src/components/EmptyState.tsx` 如登录错误状态共用

任务：

- 登录面板改用 `Card`、`CardHeader`、`CardContent`。
- 用户名和密码字段使用 `Label` + `Input`。
- 登录按钮使用 shadcn `Button`。
- 密码显示/隐藏按钮使用 `Button variant="ghost" size="icon"`。
- 错误提示用 `Alert` 风格或标准 `text-destructive`。
- 移除登录页里和 shadcn 风格冲突的过强装饰背景。

验收：

- 登录成功/失败流程正常。
- 移动端输入框和按钮不溢出。
- 明暗主题下对比度正常。

### 阶段 4：设置页迁移

目标：优先统一表单密集区域，这是收益最高的区域。

涉及文件：

- `src/features/settings/SettingsPage.tsx`
- `src/features/settings/settingsControls.tsx`
- `src/features/settings/SettingsGeneralTab.tsx`
- `src/features/settings/SettingsAppearanceTab.tsx`
- `src/features/settings/SettingsDataTab.tsx`
- `src/features/settings/SettingsAdminTab.tsx`
- `src/features/settings/SettingsPanelsTab.tsx`

任务：

- `SettingsPage`：
  - 手写 tab strip 改为 `Tabs`。
  - section 分隔改为 `Separator`。
  - 标题和描述改用 `text-foreground` / `text-muted-foreground`。
- `settingsControls.tsx`：
  - `SettingToggleCard` 改为 `Card` + `Switch`。
  - `SegmentedControl` 改为 `ToggleGroup`。
  - `NumberControl` 改为 `Card` + `Label` + `Input`。
- `SettingsAppearanceTab`：
  - 壁纸 URL 区域改为 `Card`。
  - 数值设置保留 `normalizeNumberSetting()`。
- `SettingsDataTab`：
  - 导出/导入区块改为 `Card`。
  - 文件 input 继续隐藏，触发按钮用 shadcn `Button`。
- `SettingsAdminTab`：
  - 用户信息、显示名称、密码、退出登录区域改为 `Card`。
- `SettingsPanelsTab`：
  - 面板列表项改为 `Card`。
  - 启用开关改为 `Switch`。
  - 上移/下移/编辑/删除按钮改为 `Button size="icon"`。
  - 删除确认改为 `AlertDialog`。
  - 添加/编辑面板表单建议改为 `Sheet`。

注意点：

- Radix Select 不建议使用空字符串作为有效 item value。`groupId` 这类没有数据时，应禁用 Select 或使用明确 sentinel value。
- `Switch` 的语义是 `checked` / `onCheckedChange`，不要继续使用 `aria-pressed`。
- 设置项自动保存逻辑不变。

验收：

- 设置页每个 tab 都能正常切换。
- 修改主题、打开方式、天气、壁纸、数据导入导出、面板增删改都正常。
- 所有表单控件明暗主题一致。

### 阶段 5：导航首页和链接管理迁移

目标：统一用户最常用页面的控件和卡片语言，同时保留链接网格的业务布局。

涉及文件：

- `src/features/navigation/NavigationPage.tsx`
- `src/features/navigation/NavigationSearch.tsx`
- `src/features/navigation/NavigationHero.tsx`
- `src/features/navigation/LinkGrid.tsx`
- `src/features/navigation/CreateLinkDrawer.tsx`
- `src/features/navigation/GroupDrawer.tsx`
- `src/features/navigation/DeleteLinkDialog.tsx`

任务：

- `NavigationSearch`：
  - 搜索框容器改为 shadcn token。
  - 搜索图标改用 lucide `Search`。
  - 搜索引擎 Select 改用 shadcn Select。
- `CreateLinkDrawer`：
  - 改为 `Sheet`。
  - 基础信息用 `Label` + `Input`。
  - 图标模式、卡片尺寸、打开方式用 `ToggleGroup`。
  - 分隔线用 `Separator`。
  - 预览卡片用 `Card` token，但保留业务预览布局。
- `GroupDrawer`：
  - 改为 `Sheet` 或 `Dialog`，表单控件改为 shadcn。
- `DeleteLinkDialog`：
  - 改为 `AlertDialog`。
- `LinkGrid`：
  - 分组操作按钮改为 shadcn Button。
  - 编辑模式下链接 tile 仍可保留自定义布局，但颜色、边框、hover、focus 改用 shadcn token。
  - 空状态改为 `Card`。

验收：

- 搜索、切换搜索引擎、编辑模式、拖动排序、创建/编辑/删除分组、创建/编辑/删除链接全部正常。
- 链接卡片在 compact / comfortable 密度下尺寸不跳动。
- 自定义背景色链接仍能覆盖卡片背景。

### 阶段 6：布局和导航迁移

目标：把全局框架也纳入 shadcn 标准。

涉及文件：

- `src/components/layout/Layout.tsx`
- `src/components/layout/SideNavBar.tsx`
- `src/components/layout/TopNavBar.tsx`
- `src/components/layout/PageContainer.tsx`
- `src/components/PageShell.tsx`

任务：

- 侧边栏按钮改为 `Button size="icon"` 或 `buttonVariants()`。
- 给图标按钮补 `Tooltip`。
- 分隔线改用 `Separator`。
- 错误状态和加载失败卡片改为 `Card`。
- 全局背景和文字色改为 `bg-background text-foreground`。
- 删除显式 `dark:bg-dark-*` class。

验收：

- 桌面侧边栏显示/隐藏正常。
- 移动端顶部导航正常。
- 主题切换按钮、编辑模式按钮、登出按钮正常。

### 阶段 7：面板页迁移

目标：统一最后一批页面反馈状态和头部控制。

涉及文件：

- `src/features/panels/PanelPage.tsx`
- `src/features/panels/PanelKeepAliveHost.tsx`

任务：

- 面板头部按钮改为 shadcn Button。
- 外链、刷新、编辑、关闭按钮使用 `Button size="sm"` 或 `size="icon"`。
- iframe 禁止嵌入错误态改为 `Card`。
- 加载状态可使用 `Skeleton`。
- 面板不存在状态改为 `Card` + `Button`。

验收：

- iframe 面板、外链面板、刷新、关闭、编辑入口全部正常。
- keep-alive 行为不变。

### 阶段 8：图标策略收口

目标：避免 UI 控件图标和业务图标混用导致风格混乱。

任务：

- UI action icons 使用 lucide：
  - 搜索
  - 关闭
  - 编辑
  - 删除
  - 上移/下移
  - 下载/上传
  - 外链
  - 菜单
  - 主题切换
- 用户可配置的链接图标继续走 `AppIcon`。
- 如果后续决定彻底移除 Tabler，需要单独做一次业务图标迁移：
  - 扩充 lucide name map。
  - 确认历史数据里的 icon name 还能解析。
  - 再删除 `@tabler/icons-react`。

第一轮不建议删除 `AppIcon`，否则会把 UI 替换扩展成数据兼容问题。

### 阶段 9：清理旧组件和旧样式

目标：完成全量替换。

任务：

- 删除或停用旧组件：
  - `src/components/Button.tsx`
  - `src/components/Input.tsx`
  - `src/components/Select.tsx`
  - `src/components/Drawer.tsx`
  - `src/components/ConfirmDialog.tsx`
  - `src/components/SearchBar.tsx`，如果没有业务使用
- 全项目搜索旧 token：

```bash
rg -n "on-background|on-surface|on-surface-variant|surface-container|dark:(bg|text|border)-dark|border-outline|bg-surface|font-headline|font-label|card-panel|paper-card|soft-shadow" src tailwind.config.js src/styles.css
```

- 删除旧 Tailwind color token。
- 删除旧 CSS helper class。
- 清理不再使用的依赖。

验收：

- 业务文件不再从 `../../components/Button`、`../../components/Input`、`../../components/Select` 等旧路径导入。
- 大部分 UI class 使用 shadcn token。
- `npm run typecheck` 和 `npm run build` 通过。

## 建议的提交顺序

1. `chore(ui): add shadcn foundation`
2. `refactor(ui): bridge legacy controls to shadcn`
3. `refactor(auth): migrate login page to shadcn`
4. `refactor(settings): migrate settings controls`
5. `refactor(settings): migrate panels management`
6. `refactor(navigation): migrate search and dialogs`
7. `refactor(navigation): migrate link grid tokens`
8. `refactor(layout): migrate app shell controls`
9. `refactor(panels): migrate panel host states`
10. `chore(ui): remove legacy ui tokens and wrappers`

每个提交都应该能独立通过 typecheck 和 build。

## 关键风险

### Radix Select 空值

当前部分 Select 可能用 `''` 表示无分组或占位。shadcn Select 基于 Radix，空字符串容易和 placeholder/clear 语义冲突。迁移时应：

- 没有选项时禁用 Select。
- 或使用明确 sentinel value，例如 `__none__`，提交前再转换为 `null` / `''`。

### Button variant 类型变化

旧项目有 `primary` 和 `danger`，shadcn 默认是 `default` 和 `destructive`。需要先用兼容层过渡，否则一次性改所有调用容易漏。

### Sheet 与当前 Drawer 行为不同

当前 `Drawer` 实际上是居中的 Dialog，不是侧边抽屉。改成 Sheet 后：

- 可用空间更大，适合编辑链接/面板。
- 移动端表现更接近抽屉。
- 但视觉和焦点行为会变，需要重点测试关闭、提交、删除确认的交互。

### 旧 `dark:*` class 会抵消 shadcn token

如果迁移后仍保留大量 `dark:bg-dark-surface`，视觉会混杂。每迁移一个文件，应同步删除该文件内的旧暗色 class。

### 链接磁贴不能简单替换为 Card

`LinkGrid` 的 tile 有固定网格、拖拽、anchor/button 双语义、自定义背景色。这里应保留业务组件，只替换 token 和操作按钮，不要强行套标准 Card 导致布局抖动。

### 图标迁移不要和 UI 迁移绑死

`AppIcon` 还承担业务 icon name 解析、favicon fallback、用户自定义图标显示。第一轮只把 UI 控件图标换到 lucide，不删除业务图标层。

## 验证清单

每个阶段至少运行：

```bash
npm run typecheck
npm run build
```

页面级检查：

- `/login`
  - 登录成功
  - 登录失败
  - 密码显示/隐藏
- `/`
  - 搜索
  - 搜索引擎切换
  - 编辑模式开关
  - 链接打开方式
  - 链接拖拽排序
- `/settings`
  - tab 切换
  - 主题切换
  - 导航行为设置
  - 壁纸 URL 保存和清除
  - 数据导出/导入
  - 面板增删改和排序
  - 退出登录
- `/panels/:id`
  - iframe 面板
  - external 面板
  - 禁止嵌入提示
  - 刷新、外链、编辑、关闭

视口检查：

- 375 x 667
- 768 x 1024
- 1440 x 900
- 深色模式
- 浅色模式

可访问性检查：

- 所有 Dialog / Sheet 打开后焦点进入弹层。
- Esc 可以关闭可关闭弹层。
- AlertDialog 删除操作有明确取消按钮。
- icon-only button 有 `aria-label` 或 Tooltip。
- 表单控件有 Label 或 `aria-label`。

## 完成标准

全量替换完成时，应满足：

- `src/components/ui/*` 是唯一的通用 UI 基础层。
- 业务页面不再导入旧的 `Button`、`Input`、`Select`、`Drawer`、`ConfirmDialog`。
- 旧 Tailwind token 基本从 `src` 中消失。
- 明暗主题只依赖 shadcn CSS variables，不依赖成批 `dark:bg-dark-*` class。
- UI action icons 使用 lucide。
- 业务图标仍可正常显示。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- 登录、导航、设置、面板四条主流程手动验证通过。
