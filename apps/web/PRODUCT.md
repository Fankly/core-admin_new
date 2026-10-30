# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary (confirmed):** project and plan managers in an enterprise project-governance organization. They work at a desk, in long sessions, moving between project portfolios, progress tracking, approvals, exceptions, and reporting.
- **Secondary (from existing modules):** budget/finance staff who prepare and reconcile budget and settlement data; department leads who review aggregate progress and risk; system administrators who manage menus and access.
- **Access model:** authenticated enterprise users. The visible capabilities depend on server-issued menu permissions and role selection.

## Product Purpose

项目过程管控平台 is the internal control surface for planning and executing enterprise projects. It gives managers one reliable place to find the projects they own, understand process state, complete recurring governance work, and move into specialized budget and reporting tools without losing context.

Success means a manager can answer "what needs my attention now, and where do I go next?" within the first screen, and can return to a task later without re-learning the interface.

## Positioning

The product is not a generic project-management suite. Its mechanism is a **server-governed process model**: menus, roles, views, and permissions come from the enterprise back office, while the frontend presents one coherent, auditable workspace across many legacy business modules. The interface must make a large, federated system feel singular and calm.

## Operating Context

- Desktop daily use on corporate networks; the application provides desktop layouts and accordion navigation.
- Chinese-language interface, enterprise terminology, dense tabular data, and frequent cross-module navigation.
- The application is commonly opened at `/home`; the actual home module can be configured by the server, with a local dashboard fallback. Favourite menu entries feed the dashboard quick-entry card, and the workbench remains reachable at `/baseHome`.
- Legacy systems are sometimes embedded through iframes or opened in popup windows.
- Session entry is automatic through the enterprise identity flow; there is no public sign-up or marketing funnel.
- Server menus and runtime information can be read through the local proxy when the backend is running. Repeatable browser regression uses controlled API responses; production business workflows are not validated by those fixtures.

## Capabilities and Constraints

- Server-driven menus and dynamic routes; the path-to-view convention must remain compatible with `/src/views/**`.
- Role and button-level permissions.
- Multi-tab navigation, keep-alive pages, page refresh, resizable/collapsible sidebar, top/left/mixed navigation modes.
- Configurable brand color, sidebar/header themes, and content-density preferences.
- Element Plus, VXE Table, ECharts, and file preview are part of the existing stack.
- Must preserve the existing login, signature, HTTP, and business API contracts.
- Must pass `lint`, `typecheck`, `test`, and `build` on Node 24.

## Brand Commitments

- Product name: 项目过程管控平台.
- Existing identity color is teal-green (`#00706b`); the user explicitly asked to continue the brand rather than replace it.
- The visual register should be restrained, institutional, and precise ("政企高级感"), not playful or consumer-SaaS.
- No external logos, photography, customer names, or commercial claims are available.

## Evidence on Hand

- A runnable skeleton with login, shell, tabs, permission, table, and request layers.
- A menu-derived fallback directory with search, group filters and open-page restoration; no business task feed is available here.
- Real system information can be read from `/sys/info`; menus come from `/sys/menu/nav`; user identity from `/sys/getUserInfo`.
- No real project portfolio data, business metrics, testimonials, or production screenshots are available in this repository. Any illustrative numbers or project names must be clearly labelled as synthetic and easy to replace.

## Product Principles

1. **Start with an actionable entry.** The current fallback workbench helps users locate a reachable module and return to open work. A future attention feed requires real task data and a defined business contract.
2. **Institutional calm.** Dense information is organized with clear rules, stable placement, and sparing emphasis; urgency is reserved for real exceptions.
3. **One continuous workspace.** Navigation, tabs, and content should feel like one tool, not a stack of embedded legacy pages.
4. **Permission is visible.** Never show a door the user cannot open; explain absence instead of failing later.
5. **Speed is respect.** Common moves are one click, loading is quiet, and the shell never makes users wait for choreography.

## Accessibility & Inclusion

- WCAG 2.1 AA intent for the shell: visible keyboard focus, semantic landmarks, labelled icon buttons, reduced-motion support, and body text contrast ≥ 4.5:1.
- The interface must remain legible at 1280×720 and usable with browser zoom at 200%.
