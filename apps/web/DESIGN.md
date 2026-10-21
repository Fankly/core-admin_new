# Design — 项目过程管控平台

<!-- impeccable:design-schema 1 -->

## Visual world

**Governance Line / 治理航线.** The shell borrows its logic from an institutional transit system: a dark jade route rail, station markers, platform-grade signage, and a single continuous workspace instead of a stack of floating cards. The reference is wayfinding — not decoration. Every line, marker, and label exists to answer one of three questions: *where am I, what is reachable, what needs attention?*

The world is deliberately restrained because the product is used for long, dense, repeated work. Brand presence comes from material, typography, and spatial discipline rather than illustration, gradients, or motion.

## Principles

1. **The rail is the map.** Navigation is stable. Active location is unmistakable, and collapsing the rail never changes the meaning of an icon.
2. **One workspace, not a card wall.** The content area is a framed sheet; panels inside it are separated by hairlines and spacing, not by nested elevation.
3. **Signage, not decoration.** Headings are labels for work. No eyebrow labels, ornamental numerals, gradient text, or icon tiles standing in for content.
4. **Attention is amber.** Teal means brand and current location. Amber means a real exception or missing permission. Both are used sparingly.
5. **Quiet by default, precise on demand.** Dense data remains legible; transitions explain state and never choreograph page entry.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| `--ds-jade-900` | `#082a25` | route rail, brand field |
| `--ds-jade-700` | `#0b5a51` | deep brand surfaces |
| `--ds-jade-600` | `#00706b` | primary action, current nav, links |
| `--ds-jade-500` | `#138f82` | focus, meter fill, secondary accent |
| `--ds-jade-100` | `#dcefea` | soft selection, icon wells |
| `--ds-paper` | `#f2f5f2` | application ground |
| `--ds-surface` | `#ffffff` | workspace sheet |
| `--ds-surface-subtle` | `#f8faf8` | tabs strip, panel heads |
| `--ds-line` | `#e1e8e3` | hairlines |
| `--ds-ink` | `#17231f` | primary text |
| `--ds-ink-secondary` | `#5d6d66` | supporting text |
| `--ds-ink-tertiary` | `#61716a` | metadata |
| `--ds-warning` | `#975d16` | attention / permission gap |
| `--ds-danger` | `#b3453d` | failure / destructive action |

Color strategy: **Restrained.** Neutral paper and ink carry most of the surface; jade owns navigation, primary action, and current location. Semantic colors appear only as state. Body text and placeholders meet 4.5:1 against their surfaces; large display text meets 3:1.

The brand color remains user-configurable. Runtime theme colors are written to Element Plus' `--el-color-primary` family and to the project aliases by `utils/theme.ts`; layout choices are still expressed through `ui-sidebar-*` and `ui-topHeader-*` classes, now mapped onto shell tokens.

## Typography

One family: the platform UI sans stack (`PingFang SC`, `Noto Sans SC`, `Microsoft YaHei`, then system sans). It is a working interface, not an editorial surface.

- Page title: 26px / 650, tracking −0.025em.
- Panel title: 14px / 600.
- Body and table: 14px / 1.65.
- Supporting copy: 13px, secondary ink.
- Metadata and rail codes: 10–11px; tracked uppercase only for short Latin codes.
- Numerals in metrics and tables use tabular figures. A mono face is reserved for paths, versions, and codes.

Type scale is fixed; headings do not fluidly shrink with viewport width. Responsive change is structural.

## Shell anatomy

```
┌────────────────────────────────────────────────────────────┐
│ brand lockup (rail width) │ breadcrumb / nav │ actions    │ 64px
├───────────────┬────────────────────────────────────────────┤
│ route rail    │ workspace sheet                            │
│ 248px         │  ┌ tabs (48px, inside sheet)             │
│ resizable     │  ├ viewport (page content)               │
│ 196–380px     │  └                                        │
│ 76px collapsed│                                           │
└───────────────┴────────────────────────────────────────────┘
```

- The masthead is fixed; the rail and workspace form the body below it.
- The workspace is one white sheet with a 14px radius, one hairline, and a single low shadow. Pages do not add another outer card.
- Tabs live inside the sheet and inherit its surface. Active tabs connect visually to the content; inactive tabs recede.
- The rail uses a deep jade field with 41px rows, 6px radius, and a station-dot marker for the active item. Nested items indent by 14px per level.
- Top and mixed navigation reuse the same menu grammar in a horizontal 64px shelf. Overflow folds into a "更多" submenu.
- The rail is resizable with pointer and keyboard (`ArrowLeft` / `ArrowRight` / `Home` / `End`); width is persisted per user. Double-click restores 248px.
- Below 960px the rail becomes a left drawer; the workspace loses only its outer margin, never its content.

## Components

### Brand lockup

A drawn SVG route mark: two station nodes connected by a bent line, with a secondary tick. It is never replaced by a generic letter tile or emoji. Lockup exists in default, compact (collapsed rail), and hero (sign-in) scales.

### Navigation

Element Plus `el-menu` is retained for keyboard and router integration, but its surface is fully re-skinned. Active state uses a soft jade field plus a station dot. No colored left border is used. Horizontal active state uses a 2px underline.

### Tabs

A custom semantic tablist with roving tabindex and arrow-key navigation. Each tab supports click, middle-click close, visible close on hover/focus, and a dropdown for close-current/others/left/right/all. The tab style preference is honoured through `ds-tabs--default|dot|card`.

### Header actions

Icon buttons are 34px, Lucide line icons at 16–18px, 1.8 stroke. A user avatar uses initials on a jade tint. Support links reduce to icons before the username disappears on narrower screens.

### Page header

`design-system/components/PageHeader.vue` owns the title, description, metadata, and action slot. It is separated from content by one hairline and uses no kicker/eyebrow.

### Panels and states

Panels use one border and no shadow. Empty states teach the next move and are never just "暂无数据". Loading uses quiet skeletons; route loading is a translucent sheet with a small spinner, and it never appears for the login route.

### Sign-in

A two-field composition: a dark jade story panel with the lifecycle rail, and a paper entry sheet with live phase progress (identity → permission → workspace). The page never presents credentials and never fabricates an SSO form.

## Motion

- 140–200ms for state changes; 320ms for the rail collapsing.
- Ease-out `cubic-bezier(0.16, 1, 0.3, 1)` for spatial changes.
- One authored loading moment: the route-line scan under the boot lockup and the phase pulse on sign-in.
- No page-entry choreography. `prefers-reduced-motion: reduce` removes animation durations and iteration.
- The sidebar resizer uses rAF and suppresses transitions while dragging.

## Accessibility

- Semantic landmarks: header, aside with label, main, nav with label.
- Icon-only buttons carry `aria-label` and `title`.
- Focus rings are visible at 2px jade with 3px offset.
- Custom tabs implement `role="tablist"`, `role="tab"`, `aria-selected`, and keyboard arrow/Home/End handling.
- Status regions use `role="status"` / `aria-live="polite"` for login and boot.
- Body text contrast ≥ 4.5:1; metadata is never used for essential instructions alone.
- View remains usable at 200% zoom and 390px width; no horizontal document scroll.

## Content voice

Direct, calm, and specific. Controls name the action ("刷新当前页面", "关闭其他标签页"); errors name the problem and the recovery. Avoid exclamation marks, hype, and decorative labels. English is used only for small system codes and the brand descriptor.

## Implementation map

| Concern | Source |
| --- | --- |
| Tokens | `src/styles/tokens.css` |
| Base, library and shell CSS | `src/styles/` |
| Brand, page header | `src/design-system/components/` |
| Shell and navigation | `src/layouts/admin/` |
| Sign-in | `src/features/auth/LoginPage.vue` |
| Workbench | `src/features/workbench/WorkbenchPage.vue` |
| Error surfaces | `src/features/errors/ErrorPage.vue` |

## Do not

- Do not add a second card layer inside the workspace sheet.
- Do not use gradients as decoration, gradient text, glass panels, or colored side borders on content.
- Do not introduce a display typeface, serif, or monospace costume for UI labels.
- Do not use the amber accent for ordinary emphasis.
- Do not animate page entry or use scroll-triggered spectacle.
- Do not remove the path-based view convention: server menus still resolve through `/src/views/**`.
