# IPTV Server Design Guidelines

## Project Analysis

This is a **utility-focused backend service** with minimal frontend needs. The primary interface is programmatic (API endpoints), but the root endpoint (`/`) presents an opportunity for a clean status/documentation page.

## Design Approach: Minimal System Design

**Selected Approach:** Functional design system approach using **Tailwind CSS** with a focus on clarity and developer-friendly documentation.

**Justification:** This is a technical service requiring clear communication of endpoints and status. Design should emphasize readability and quick comprehension over visual flourish.

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: `220 20% 12%` (deep charcoal)
- Surface: `220 18% 18%` (elevated surfaces)
- Primary: `142 76% 45%` (vibrant green - "server active" indicator)
- Text Primary: `220 10% 95%`
- Text Secondary: `220 10% 65%`
- Border: `220 15% 25%`

**Accent:**
- Success/Active: `142 76% 45%` (green)
- Code blocks: `220 18% 20%` with `220 10% 85%` text

### B. Typography

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - clean, technical aesthetic
- Code: 'JetBrains Mono' (Google Fonts) - for endpoints and code snippets

**Hierarchy:**
- H1: 2.5rem (40px), font-weight: 700
- Body: 1rem (16px), font-weight: 400
- Code: 0.875rem (14px), font-weight: 500

### C. Layout System

**Spacing Units:** Tailwind units of **4, 6, 8, 12, 16**
- Component padding: `p-6` or `p-8`
- Section spacing: `gap-8` or `gap-12`
- Page margins: `px-4 md:px-8`

**Container:**
- Max-width: `max-w-4xl` centered
- Single column layout

### D. Component Library

**Status Dashboard Components:**

1. **Server Status Card**
   - Large green dot indicator with pulse animation
   - "Server Running" headline
   - Port information display
   - Uptime counter (if applicable)

2. **Endpoint Documentation Cards**
   - Dark surface background (`220 18% 18%`)
   - Method badge (GET in green)
   - Endpoint path in monospace font
   - Description text
   - Copy button for URL
   - Response type indicator

3. **Quick Start Section**
   - Numbered steps (1, 2, 3)
   - Code snippets with syntax highlighting
   - Copy-to-clipboard functionality

4. **Technical Specs Display**
   - Grid layout: 2 columns on desktop, 1 on mobile
   - Icon + Label + Value format
   - Specs: Port, Source, Content-Type, Status

### E. Page Structure

**Single Page Layout:**
1. **Header** - Minimal with logo/title and status indicator
2. **Hero Section** - Server status with primary endpoint
3. **Endpoints Section** - Documentation cards for `/` and `/playlist.m3u`
4. **Quick Start Guide** - 3-step integration instructions
5. **Footer** - Credits and source link

## Images

**No hero images needed.** This is a technical documentation page. Use:
- SVG icons from **Heroicons** (server, play, code, check-circle, clipboard)
- Status indicators (pulse animations for "live" status)
- Code snippets styled as visual blocks

## Accessibility & Technical Notes

- Maintain dark mode throughout (developer preference)
- Ensure code blocks have sufficient contrast
- All interactive elements (copy buttons) have clear hover states
- Responsive: Stack endpoint cards on mobile
- Use semantic HTML5 elements (`<main>`, `<section>`, `<article>`)

## Animation Guidelines

**Minimal, purposeful animations:**
- Status indicator: Subtle pulse (animate-pulse)
- Copy confirmation: Brief fade-in toast notification
- No page transitions or scroll effects

## Visual Identity

**Aesthetic:** Technical, clean, developer-focused - similar to Railway.app or Render.com status pages. Prioritize **clarity and usability** over visual complexity.