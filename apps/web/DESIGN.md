# Design — 项目过程管控平台

<!-- impeccable:design-schema 1 -->

## Visual world

**Governance Line / 治理航线.** The shell borrows its logic from an institutional transit system: a dark jade route rail, station markers, platform-grade signage, and a single continuous workspace instead of a stack of floating cards. The reference is wayfinding — not decoration. Every line, marker, and label exists to answer one of three questions: _where am I, what is reachable, what needs attention?_

The world is deliberately restrained because the product is used for long, dense, repeated work. Brand presence comes from material, typography, and spatial discipline rather than illustration, gradients, or motion.

## Principles

1. **The rail is the map.** Navigation is stable. Active location is unmistakable, and collapsing the rail never changes the meaning of an icon.
2. **One workspace, not a card wall.** The content area is a framed sheet; panels inside it are separated by hairlines and spacing, not by nested elevation.
3. **Signage, not decoration.** Headings are labels for work. No eyebrow labels, ornamental numerals, gradient text, or icon tiles standing in for content.
4. **Attention is amber.** Teal means brand and current location. Amber means a real exception or missing permission. Both are used sparingly.
5. **Consistent motion, legible data.** Navigation, page entry and controls share a short motion rhythm; dense tables remain stable.

## Palette

| Token                 | Value     | Role                                |
| --------------------- | --------- | ----------------------------------- |
| `--ds-jade-900`       | `#082a25` | route rail, brand field             |
| `--ds-jade-700`       | `#0b5a51` | deep brand surfaces                 |
| `--ds-jade-600`       | `#00706b` | primary action, current nav, links  |
| `--ds-jade-500`       | `#138f82` | focus, meter fill, secondary accent |
| `--ds-jade-100`       | `#dcefea` | soft selection, icon wells          |
| `--ds-paper`          | `#f2f5f2` | application ground                  |
| `--ds-surface`        | `#ffffff` | workspace sheet                     |
| `--ds-surface-subtle` | `#f8faf8` | tabs strip, panel heads             |
| `--ds-line`           | `#e1e8e3` | hairlines                           |
| `--ds-ink`            | `#17231f` | primary text                        |
| `--ds-ink-secondary`  | `#5d6d66` | supporting text                     |
| `--ds-ink-tertiary`   | `#61716a` | metadata                            |
| `--ds-warning`        | `#975d16` | attention / permission gap          |
| `--ds-danger`         | `#b3453d` | failure / destructive action        |

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
- The rail sets its menu on card surfaces: a 48px top-level card, 42px second-level rows, and 40px deeper rows, with 12px card radius and 8px row radius. Nested items step 18px per level so a plain row and an icon row stay aligned.
- Every row keeps the same 18px icon well and glyph size at any depth; only the well's colour and ring change with level, so state is read from colour rather than from resizing icons. The active row is a jade gradient pill with a white glyph.
- Top and mixed navigation reuse the same menu grammar in a horizontal 64px shelf. Overflow folds into a "更多" submenu.
- The rail is resizable with pointer and keyboard (`ArrowLeft` / `ArrowRight` / `Home` / `End`); width is persisted per user. Double-click restores 248px.
- Below 960px the rail becomes a left drawer; the workspace loses only its outer margin, never its content.

## Components

### Brand lockup

A drawn SVG route mark: two station nodes connected by a bent line, with a secondary tick. It is never replaced by a generic letter tile or emoji. Lockup exists in default, compact (collapsed rail), and hero (sign-in) scales.

### Navigation

Element Plus `el-menu` is retained for keyboard and router integration, but its surface is fully re-skinned. The vertical rail mirrors the 云卡悬浮 reference in `core-admin/src/assets/css/sidebar-nav.less`: top-level groups are cards that only lift while open, and the active leaf is a jade gradient pill with white text and glyph. No colored left border or station dot marks the current row; horizontal active state keeps its 2px underline.

Icons are a function of depth, never of the server-supplied icon: L1 is a layered mark in a 30px solid jade well, L2 a folder in a 24px mist well, L3 a file in a 22px outlined well, and L4 and deeper a 5px dot with no well. Row height steps down 48 → 42 → 40 → 38px, and each level adds 14px of indent on top of a 10px row inset. State only recolors these wells; it never resizes them. Horizontal navigation keeps the configured SVG icons, since depth carries no meaning there.

Light and dark rails are both supported. The light rail is a white surface with white cards and a hairline; the dark rail uses the `#263238` field with `#212c31` cards. Both read from the same `--nav-*` variables, so the brand colour switch moves them together.

The rail carries the reference's tool row above the tree: an inline menu filter, a favourites-only toggle and a collapse-all button. Filtering narrows the rendered tree, keeps every matched leaf's ancestor path and expands it automatically; `unique-opened` is suspended while a filter is active so a deep match is not collapsed by a sibling, and the previous expanded trail is restored when the filter ends. The favourites toggle reads `useFavoritesStore`, so the rail stars and the workbench quick entries stay in sync. `/` focuses the filter when focus is idle or already inside the rail, and Escape clears it.

The rail and the workbench share availability rules. Hidden routes, unavailable leaves and empty groups are omitted. Internal and external entry links share `NavigationLink` so both keep a real href and keyboard behavior.

### Tabs

A custom semantic tablist with roving tabindex and arrow-key navigation. Each tab supports click, middle-click close, visible close on hover/focus, and a dropdown for close-current/others/left/right/all. The tab style preference is honoured through `ds-tabs--default|dot|card`.

### Header actions

Icon buttons are 34px, Lucide line icons at 16–18px, 1.8 stroke. A user avatar uses initials on a jade tint. Support links reduce to icons before the username disappears on narrower screens.

### Page header

`design-system/components/PageHeader.vue` owns the title, description, metadata, and action slot. It is separated from content by one hairline and uses no kicker/eyebrow.

### Panels and states

Panels use one border and no shadow. Empty states teach the next move and are never just "暂无数据". Loading uses quiet skeletons; route loading is a translucent sheet with a small spinner, and it never appears for the login route.

The boot lockup ("正在载入工作区") owns the first frame: its ground is `--ds-jade-950`, its glows and route line come from the same brand ramp, and the browser `theme-color` is kept in step. Never hardcode a jade hex there, or the overlay will stay dark green after the brand colour is switched.

`EmptyState` provides a reusable title, explanation, icon and recovery action. Tables expose their loading state and keep search, refresh and help controls identifiable. Search forms use native submit behavior, including Enter.

### Home

`/home` opens on the dashboard: a welcome band followed by four panels — favourite quick entries, user manuals, system notices, and pending work. Quick entries are whatever the user starred in the rail; the dashboard never invents shortcuts. Each panel owns its loading, failure and empty state, and an empty panel explains the next move ("在左侧菜单点击星标收藏后…") instead of showing placeholder rows. Pending work is a server-paged VXE table that opens its handling page in a modal iframe.

Panels are separated by hairlines and spacing inside the single workspace sheet; the dashboard adds no second elevation layer and no gradients as decoration. The welcome band compresses first on short viewports so the whole page stays on one screen. The local workbench at `/baseHome` remains the fallback when the server points `/home` back to itself.

### Workbench

The local fallback workbench starts with the reachable business directory. Its entries come from server menus; there are no invented portfolio metrics or task counts. Search and group filters narrow the directory, twelve entries appear initially, and "显示更多" reveals the next batch. "继续工作" restores open tabs; account information stays beside the directory when space permits.

The workbench responds to its content container width, allowing the same page to adapt when the navigation rail expands, collapses or changes mode. At smaller widths, the directory takes the full row and supporting information moves below it. The page header retains its height inside the scrollable workspace.

"平台状态" opens a drawer and requests runtime information on demand. Loading, unavailable data, retry and stale data after refresh failure have explicit states. Runtime data is an operational aid rather than the page's main content.

### Sign-in

A two-field composition: a dark jade story panel with the lifecycle rail, and a paper entry sheet with live phase progress (identity → permission → workspace). The page never presents credentials and never fabricates an SSO form.

Permission refusal offers "重新验证权限". Workspace initialization failure offers "重新加载", which re-enters the workspace and requests its menu again. State changes follow actual requests without artificial waits.

## Motion

- 140–200ms for controls, menu panels and tabs; 280ms for page entry; 320ms for drawers.
- Ease-out `cubic-bezier(0.16, 1, 0.3, 1)` for spatial changes.
- One authored loading moment: the route-line scan under the boot lockup and the phase pulse on sign-in.
- Both admin and fullscreen outlets use `usePageMotion`: an 8px fade-in on the existing container without remounting views or iframe documents. Rapid navigation cancels the previous animation; refresh waits for the new content to render.
- System management keeps one expanded branch: opening a sibling closes the previous branch and its descendants while retaining the ancestors. Reopening the panel expands the current page's branch. Groups animate their natural height and stagger rows by 25ms, capped at 75ms. Home sections use the same bounded stagger; table rows are never staggered.
- Tabs animate insertion, removal and movement without changing their keys or keyboard controls. Buttons, navigation icons, input focus and row highlights share the motion tokens in `styles/tokens.css` and `styles/motion.less`.
- `prefers-reduced-motion: reduce` removes CSS delays and durations and cancels active page animations, including when the preference changes while the app is open.
- The sidebar resizer uses rAF and suppresses transitions while dragging.

## Accessibility

- Semantic landmarks: header, aside with label, main, nav with label.
- Icon-only buttons carry `aria-label` and `title`.
- Focus rings are visible at 2px jade with 3px offset.
- Custom tabs implement `role="tablist"`, `role="tab"`, `aria-selected`, and keyboard arrow/Home/End handling.
- The skip link focuses the main workspace without modifying the hash route; tab navigation only scrolls its own strip.
- Status regions use `role="status"` / `aria-live="polite"` for login and boot.
- Body text contrast ≥ 4.5:1; metadata is never used for essential instructions alone.
- View remains usable at 200% zoom and 390px width; no horizontal document scroll.

## Content voice

Direct, calm, and specific. Controls name the action ("刷新当前页面", "关闭其他标签页"); errors name the problem and the recovery. Avoid exclamation marks, hype, and decorative labels. English is used only for small system codes and the brand descriptor.

## Implementation map

| Concern                                   | Source                                        |
| ----------------------------------------- | --------------------------------------------- |
| Tokens                                    | `src/styles/tokens.css`                       |
| Base and library CSS                      | `src/styles/`                                 |
| Shell CSS by responsibility               | `src/styles/shell/`, imported by `shell.less` |
| Brand, header, empty state, links         | `src/design-system/components/`               |
| Shell and navigation                      | `src/layouts/admin/`                          |
| Sign-in                                   | `src/features/auth/LoginPage.vue`             |
| Home dashboard and home resolver          | `src/features/home/`                          |
| Workbench and directory/status components | `src/features/workbench/`                     |
| Error surfaces                            | `src/features/errors/ErrorPage.vue`           |

## Do not

- Do not add a second card layer inside the workspace sheet.
- Do not use gradients as decoration, gradient text, glass panels, or colored side borders on content.
- Do not introduce a display typeface, serif, or monospace costume for UI labels.
- Do not use the amber accent for ordinary emphasis.
- Do not animate page entry or use scroll-triggered spectacle.
- Do not remove the path-based view convention: server menus still resolve through `/src/views/**`.
