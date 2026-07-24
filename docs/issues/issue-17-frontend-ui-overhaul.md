# Issue #17: Frontend UI/UX overhaul — professional design for Landing + Admin

## Problem

Both frontends (landing + admin-dashboard) use raw Tailwind defaults without brand identity, custom colors, proper spacing, or polished UX patterns. The result looks like an unfinished template rather than a professional platform for selling furniture and arches.

## Scope

### Landing (public storefront)

#### Must fix

1. **Brand identity & theme**
   - Custom color palette in `tailwind.config.js` (primary, secondary, accent, neutrals)
   - Custom font pairing (e.g., Inter for body, Playfair Display for headings)
   - Brand gradients and subtle textures for hero/sections
   - Consistent spacing scale

2. **Hero section**
   - Full-width hero with background image/gradient
   - Headline + subheadline + CTA button ("Browse Catalog" / "Request Custom Quote")
   - Trust badges (PayPal secure, custom furniture, fast delivery)

3. **Navigation redesign**
   - Logo (text or SVG)
   - Icons alongside text labels
   - Highlighted CTA ("Request Quote" as accent button)
   - Mobile hamburger with slide-in menu
   - Language selector integrated cleanly

4. **Footer**
   - Contact info, social links
   - Quick links (Catalog, Custom Quote, Complaints)
   - Payment methods badge (PayPal)
   - Copyright + legal

5. **Product cards polish**
   - Subtle shadow elevation on hover
   - Price badge with accent color
   - "Add to cart" style CTA visible on hover
   - Stock status with colored indicators (green dot = available, orange = on-demand, red = out)

6. **Empty states**
   - Illustrations or icons when no results
   - Clear call to action ("Try different filters" or "Request a custom quote instead")

7. **Page transitions**
   - Fade-in on route change
   - Smooth scroll behavior

#### Nice to have

- Testimonials/social proof section
- "How it works" 3-step section (Browse → Pay → Receive)
- "Featured" or "New" badges on products
- Breadcrumbs in detail page

---

### Admin Dashboard

#### Must fix

1. **Sidebar with icons**
   - FontAwesome icons for each section (as per project context)
   - Active state with left border accent + background
   - User info at bottom (avatar/initials + email + logout)
   - Collapsible labels (icon-only mode on small screens)

2. **Overview/Dashboard page**
   - Summary cards: total orders today, pending quotes, low stock alerts, revenue
   - Quick actions: "Review pending orders", "Check stock alerts"
   - Recent activity feed

3. **Visual improvements**
   - Status badges with distinct colors (not just blue/gray)
   - Toast notifications on actions (success/error)
   - Confirmation dialogs before destructive actions
   - Pagination controls (prev/next with page numbers)
   - Breadcrumbs on each page

4. **Admin help/documentation**
   - "?" button or sidebar link → opens a help panel/modal
   - Per-section tooltips explaining the workflow
   - Link to external documentation (e.g., Notion or rendered markdown)
   - Or: embedded `/admin/help` page with key workflows explained

5. **Session info**
   - Logged-in user name/email visible
   - Session timeout indicator
   - Last login time

#### Nice to have

- Dark mode toggle
- Keyboard shortcuts (Ctrl+K search)
- Export data buttons (CSV/Excel) on tables
- Activity log (who did what, when)

---

## Design tokens (proposed)

```js
// tailwind.config.js — shared across both apps
colors: {
  brand: {
    50: '#f0f7ff',
    100: '#e0efff',
    500: '#3b82f6',  // primary blue
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a5f',
  },
  accent: {
    400: '#f59e0b',  // amber — CTAs, highlights
    500: '#d97706',
  },
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
}
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['Playfair Display', 'serif'],
}
```

## Priority

- **High**: Brand identity (tailwind theme), Hero section, Sidebar icons, Dashboard overview
- **Medium**: Footer, Empty states, Toasts, Confirmations, Pagination
- **Low**: Transitions, Dark mode, Keyboard shortcuts

## Acceptance criteria

- Landing looks professional enough to show to a client (not a developer template)
- Admin dashboard is usable without a manual (self-explanatory navigation)
- Both apps share the same color palette (visual consistency)
- Mobile experience is polished (not just "it works", but "it looks good")
- Admin can find basic help within the dashboard without leaving it
