# Roam Together
Responsive English/Hebrew family trip planner. Open `index.html` or serve this folder with any static server. English is the default; the language choice is remembered.

Implemented: multiple trips, dates, flight details with IANA timezones, exact departure countdown once entered, packing tasks, dated itinerary, USD expenses, local storage, JSON export/import.

## Current limits
- Flight lookup opens an external flight tracker. No automatic flight API is connected. Dates, aircraft and status must be verified against the booking.
- Data is stored in each browser, not synchronized between devices. Export/import transfers data manually. Do not store passports, booking references or secrets here.
- Family members are generic labels; no children's names are published.
- For automatic flight lookup and private cross-device sync, add an authenticated backend, database and server-side flight-data provider. Keep API keys out of browser JavaScript.

## GitHub Pages
Upload these static files into a repository; in Settings → Pages choose Deploy from a branch, main, root. The site is publicly accessible, while locally entered data remains in the current browser.
