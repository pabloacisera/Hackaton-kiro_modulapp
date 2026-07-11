# Admin UI conventions

This document defines UI patterns and conventions for the admin dashboard.

## Component structure

Follow MVC architecture (see `05-architecture-conventions.md`):
- `src/models/` — data fetching and API calls
- `src/views/` — presentation components
- `src/controllers/` — orchestration hooks (Model ↔ View)

## Design tokens

- Primary color: defined in Tailwind config
- Spacing: follows Tailwind default scale
- Border radius: consistent across all components
- Shadows: subtle, layered for depth

## Form patterns

- All forms use controlled components
- Validation happens on blur and on submit
- Error messages appear below the field
- Loading states for async operations

## Table patterns

- Sortable columns with visual indicators
- Pagination (server-side for large datasets)
- Row actions via dropdown menu
- Bulk selection for batch operations

## Modal patterns

- Confirmation dialogs for destructive actions
- Focus trap inside modal
- Close on Escape key and backdrop click
- Accessible via keyboard navigation

## Notification patterns

- Toast notifications for success/error feedback
- WebSocket-driven real-time updates
- Non-intrusive sound for critical alerts
- Notification center for history

## Responsive behavior

- Mobile-first approach (360-390px viewport)
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible sidebar on mobile
- Stack layout on small screens, grid on large
