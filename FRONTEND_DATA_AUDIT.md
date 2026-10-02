# Frontend data integration audit

Initial audit of src/App.tsx and src/: 

| Dataset / behavior | Classification | Action |
|---|---|---|
| Landing featured properties, browse results, property details | A functional | Retain existing real API data; connect landing search inputs |
| Favorites, renter/owner bookings, owner listings, moderation | A functional | Retain persistence; verify refresh and access isolation |
| renterConversations / ownerConversations, messages, simulated read receipts | A functional | Replace with participant-scoped conversation/message APIs |
| App notifications, mark-read React state, sidebar badges | A functional | Replace with notification and summary APIs |
| Owner transactions, earnings, payouts, chart amounts | A functional | Replace with owner-scoped payments and actual aggregates |
| Admin users, fabricated drawer phone/activity | A functional | Replace with users and per-user DB counts |
| Admin totals, operational uptime, online users, hourly events | A functional | Replace with measured database statistics; remove unsupported claims |
| Admin payments, settlement and revenue charts | A functional | Replace with recorded payments; exports contain real records |
| Analytics configurations for Today/Week/Month/Year | A functional | Replace with date-range database aggregates |
| Activity log rows and cryptographic integrity claims | A functional | Replace with activity_logs; remove unsupported integrity claims |
| Profile fields, preferences, sessions, fake save/delete/password success | A functional | Persist supported operations; disable unsupported destructive operations |
| Fake reset-password flow | A functional | Connect real forgot/reset endpoints and token input |
| Static dashboard date, greetings, fabricated verification/member since | A functional | Use current date and database account fields |
| demoHomes used in DesignSystem property cards/tables; specimen fields and navigation | B showcase | Keep only in explicit Design system page |
| About team personas, decorative home artwork, testimonials | C decorative | Keep as explicitly illustrative marketing content, separate from app accounts |
| Filter options, role/status labels, skeleton counts, navigation definitions | C UI configuration | Keep; these are schema/UI choices, not database records |

## Final audit outcome

All category A sources listed above have been connected to API data or removed where the backend does not support the operation. `demoHomes` was renamed `showcaseHomes` and is used only for explicit DesignSystem examples. The About illustration has its own decorative image source. No functional page renders the showcase property dataset. Read `FRONTEND_INTEGRATION_REPORT.md` for endpoint mappings, remaining B/C datasets, capability limitations and verification evidence.
