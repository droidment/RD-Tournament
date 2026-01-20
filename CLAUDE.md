# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Republic Day Tournament 2026 is a volleyball/throwball tournament management system with digital waiver collection, player registration, and team management. Built as a single-page application using vanilla JavaScript with Firebase backend.

**Tournament Date:** January 24, 2026

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6 modules), Tailwind CSS (CDN)
- **Backend:** Firebase Realtime Database, Firebase Authentication
- **Deployment:** Firebase Hosting with GitHub Actions auto-deploy
- **File Structure:** Monolithic design - all logic in single JS files (~3,800 lines)

## Development Commands

### Firebase Deployment

```bash
# Install Firebase CLI (first time only)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to production
firebase deploy --only hosting

# Deploy with preview channel
firebase hosting:channel:deploy preview-name
```

### GitHub Actions

- **Auto-deploy to production:** Push to `main` branch triggers deployment
- **Preview deploys:** Pull requests create preview channels automatically
- **Note:** Build step in workflows is placeholder (`run: Y`)

## Architecture

### File Organization

```
RD-Tournament/
├── index.html          # Main entry point (loads app-v2.js)
├── app.js              # Original version (3,784 lines)
├── app-v2.js           # Current production version (3,857 lines)
├── public/index.html   # Unused Firebase template (ignored by rewrites)
├── firebase.json       # Hosting config with catch-all rewrite
└── .firebaserc         # Project: rdtournament2026
```

**Important:** The root [index.html](index.html) is the active entry point. All requests are rewritten to it via Firebase Hosting rules. The `public/index.html` is dead code from Firebase setup.

### App Versions

- **[app.js](app.js):** Original single-team version
- **[app-v2.js](app-v2.js):** Active version with multi-team captain support

**Current Status:** [index.html:13](index.html#L13) loads `app-v2.js` as the production version.

**Key Difference:** app-v2.js supports captains managing multiple teams via `userTeamIds[]` array instead of single `userTeamId`.

### User Roles & Access Control

**Three role types:**

1. **Organizer** - Hardcoded email whitelist in [app-v2.js:5-9](app-v2.js#L5-L9):
   ```javascript
   const AUTHORIZED_ORGANIZERS = [
       "qpinme@gmail.com",
       "rbalakr@gmail.com",
       "droidment@gmail.com"
   ];
   ```
   - Tournament setup and management
   - Full dashboard with statistics
   - Team/player management across all teams
   - CSV export capabilities
   - Can also have captain role simultaneously

2. **Captain** - Registered during tournament setup:
   - Manage their own team's players
   - Track waivers and lunch preferences
   - Share player registration links
   - Can manage multiple teams (in v2)
   - Can also be organizer

3. **Player** - No authentication required:
   - Access via URL with player ID (`?player=<playerId>`)
   - Fill waiver form with digital signature
   - Select lunch preference

### Firebase Database Structure

```
/users/{uid}
  ├─ email: string
  ├─ role: "captain" | "organizer"
  ├─ teamId: string (primary team)
  └─ createdAt: ISO timestamp

/teams/{teamId}
  ├─ name: string
  ├─ leagueId: "pro-volleyball" | "regular-volleyball" | "masters-volleyball" | "women-throwball"
  ├─ captain: { name, email, phone }
  ├─ playerCount: number
  └─ players/{playerId}
      ├─ name, email, phone
      ├─ waiverSigned: boolean
      ├─ waiverSignedAt: ISO timestamp
      ├─ waiverFullName: string
      ├─ waiverSignature: base64 PNG
      ├─ ageVerified: boolean (45+ league only)
      └─ lunchChoice: "veg" | "nonveg" | "none"

/captains/{captainId}
  ├─ name, email, phone
  ├─ teamId: string
  └─ leagueId: string

/organizers/{organizerId}
  ├─ email: string
  └─ name: string
```

### State Management

Global variables in [app-v2.js:31-35](app-v2.js#L31-L35):
```javascript
let currentUser = null;      // Firebase Auth user object
let userRole = null;         // 'organizer' or 'captain'
let userTeamId = null;       // Current active team ID
let userTeamIds = [];        // All teams user captains (v2 feature)
```

**No centralized state management** - direct DOM manipulation via `innerHTML`.

### Authentication Flow

```
Page Load
  ↓
Check for ?player= parameter
  ├─ YES → Show player waiver form (unauthenticated)
  └─ NO → Check Firebase auth state
      ├─ Authenticated → handleAuthUser()
      │   ├─ Check if organizer (email whitelist + DB)
      │   ├─ Find all teams user captains
      │   ├─ Set role and teamIds
      │   └─ Show appropriate view
      └─ Not authenticated → Show login screen
```

**Methods:**
- Google OAuth: `signInWithPopup()`
- Email/Password: Auto-creates account if email matches captain/organizer in DB
- Player access: No auth required, accessed via `?player={playerId}` URL

### Core Features

**Digital Signatures**
- Canvas-based signature capture (600x150px)
- Touch and mouse support
- Base64 PNG encoding
- Stored in Firebase at `/teams/{teamId}/players/{playerId}/waiverSignature`

**Waiver Management**
- Track signed/unsigned status per player
- Date tracking for all signatures
- Age verification checkbox for 45+ league
- Download/print capabilities

**Lunch Preferences**
- Three options: Veg, Non-Veg, No Food
- Tracked separately from waiver
- Export to CSV for catering

**WhatsApp Integration**
- Direct links: `https://wa.me/{phone}?text={message}`
- Phone parsing removes all non-digits
- Bulk messaging for organizers
- Individual player messaging for captains

**Team Leaderboard**
- Completion % = (waivers_signed + lunches_selected) / (players × 2) × 100
- Real-time sorting by completion rate
- Displayed on organizer dashboard

### Leagues & Categories

Four tournament leagues in [app-v2.js](app-v2.js):
- `pro-volleyball` - Professional Volleyball League
- `regular-volleyball` - Regular Volleyball League
- `masters-volleyball` - Volleyball 45+ League (requires age verification)
- `women-throwball` - Women Throwball League

### View Components

All views are dynamically rendered via `innerHTML`:

- `showLoginView()` - Email/Google authentication
- `showCaptainView()` - Team dashboard with player management
- `showOrganizerView()` - Choice between dashboard/setup/manage
- `showOrganizerDashboard()` - Statistics, team list, export tools
- `showPlayerView(playerId)` - Public waiver form
- `showSetupModal()` - First-time tournament setup wizard

### Export Capabilities

**Full Data Export** (`exportAllData()`):
- CSV with all teams and players
- Includes waiver status, signatures, lunch choices
- Downloads as `tournament-data-{timestamp}.csv`

**Food Orders Export** (`exportFoodOrders()`):
- Aggregated lunch preferences by team
- Veg/Non-Veg/No Food counts
- Downloads as `food-orders-{timestamp}.csv`

### Debug Utilities

Available in browser console:

```javascript
// Check current user and team info
window.debugTeamInfo()

// Get team count for current user
window.getTeamCount()

// Get all team IDs for current user
window.getAllTeamIds()
```

## Common Development Patterns

### Adding New Features

1. **Read the entire app-v2.js file first** - Monolithic structure means you need full context
2. **Check global state variables** - Features depend on `currentUser`, `userRole`, `userTeamId`, `userTeamIds`
3. **Follow existing patterns** - No frameworks, direct DOM manipulation
4. **Test role-based access** - Features vary by organizer/captain/player role
5. **Consider mobile** - All features must work on touch devices

### Modifying Database Structure

1. **Update both read and write operations** - No ORM or abstraction layer
2. **Check security rules** - Client-side auth is not secure (email whitelist can be bypassed)
3. **Test real-time listeners** - Dashboard uses `onValue()` for live updates
4. **Maintain backwards compatibility** - Existing data in production DB

### Working with Waivers

- Signature canvas initialization: 600×150px canvas with 2D context
- Touch events: `touchstart`, `touchmove`, `touchend`
- Mouse events: `mousedown`, `mousemove`, `mouseup`
- Export: `canvas.toDataURL('image/png')` → store as string
- Validation: Check signature has been drawn before allowing submission

### WhatsApp Link Generation

```javascript
const phone = player.phone.replace(/\D/g, ''); // Remove non-digits
const message = encodeURIComponent('Your message here');
const url = `https://wa.me/${phone}?text=${message}`;
```

## Security Considerations

**Critical Security Issue:** The organizer authorization check happens client-side only. The hardcoded email whitelist in [app-v2.js:5-9](app-v2.js#L5-L9) can be bypassed by modifying the JavaScript.

**Required for production:**
- Firebase Security Rules must validate organizer access server-side
- Database rules should check user email against `/organizers` collection
- Write access should be restricted based on user role

**Current implementation:**
- Client-side only (insecure)
- Base64 signatures stored unencrypted
- No rate limiting on form submissions

## Mobile Optimization

Key features in [index.html:15-68](index.html#L15-L68):

- 16px minimum font size prevents iOS zoom
- Tap highlight disabled: `-webkit-tap-highlight-color: transparent`
- Viewport: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`
- Mobile-first responsive design with Tailwind
- Touch event handling for signature canvas

## Deployment Flow

1. **Local Changes** → Commit to branch
2. **Push to GitHub** → Triggers GitHub Actions
3. **Pull Request** → Creates Firebase preview channel
4. **Merge to main** → Auto-deploys to production (`rdtournament2026.web.app`)

**No build step** - Static files deployed directly.

## Important Configuration Files

- **[firebase.json](firebase.json)** - Hosting config with catch-all rewrite to `/index.html`
- **[.firebaserc](.firebaserc)** - Project ID: `rdtournament2026`
- **[app-v2.js:21-29](app-v2.js#L21-L29)** - Firebase config (API keys visible in source)

## Known Technical Debt

1. **Monolithic JS files** - No code splitting or modularization
2. **No build process** - Direct deployment of source code
3. **Inline styles and scripts** - Could benefit from separation
4. **Dead code** - `public/index.html` is unused but still present
5. **Client-side security** - Organizer whitelist needs server-side validation
6. **No TypeScript** - Vanilla JS with no type safety
7. **Manual role assignment** - Organizers must be added to hardcoded array

## Browser Console Warnings

If you see "🎯 NEW CODE LOADED - Version 2.0" in console, app-v2.js loaded correctly.

The debug functions are automatically available:
- `debugTeamInfo()` - Full user state
- `getTeamCount()` - Number of teams user captains
- `getAllTeamIds()` - Array of team IDs
