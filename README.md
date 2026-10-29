# Court Queue

Badminton / pickleball club app: match queue with a TV display, court rentals, open play, player profiles with levels,
player stats, POS and inventory, and income tracking. Staff sign in to run everything; clients sign in to book courts and
join open play.

## Run

```bash
npm install
npm run dev
```

Without Firebase the app runs in **local mode** (data saved in this browser, no login). To get the database, login and the
client booking page, set up Firebase (below).

## Hubs: many venues, one app

One deployment can serve many court owners ("hubs"). Every hub has its **own** courts, queue, bookings, players, products,
sales, staff, TV and settings, and **cannot see any other hub**. Only a **super admin** (the platform owner) can create hubs
and choose their name, theme and owner. Hub owners and their staff work only inside their hub.

Every hub has a code (for example `daily-dink`) and its own addresses:

| Address | Who | What |
|---|---|---|
| `#/` | everyone | Enter a hub code (super admins also see the list of hubs) |
| `#/login` | super admins | Platform sign-in |
| `#/platform` | super admin | Create hubs, set their theme and owner, activate or pause a hub, manage super admins |
| `#/h/<code>/` | hub staff | Dashboard: courts, income today, low stock, next 14 days of rentals and open play |
| `#/h/<code>/queue` | staff | Run the queue: add players, partners, call matches, timers, pick winners |
| `#/h/<code>/rentals` | staff | Book a court for a walk-in, see every booking, mark paid, cancel |
| `#/h/<code>/open-play` | staff | Open play sessions (courts, fee, max players, weekly repeat, edit), sign-ups, collect fees |
| `#/h/<code>/players` | staff | Saved players: contact details, level, rating, notes |
| `#/h/<code>/users` | hub owner | Add a user (creates their account) and change anyone's role |
| `#/h/<code>/pos` | staff | Point of sale for products |
| `#/h/<code>/inventory` | staff | Products, stock, restock, stock count, stock history |
| `#/h/<code>/income` | staff | Income by day, category and payment method; money still to collect; void a sale |
| `#/h/<code>/stats` | staff | Win/loss stats, best partners |
| `#/h/<code>/ads` | staff | TV header, ads, announcements, voice |
| `#/h/<code>/account` | staff | Settings: number of courts, rates, sign out |
| `#/h/<code>/c` | clients | Book a court, open play sign-up, my profile |
| `#/h/<code>/login` | everyone | Sign in / create account for this hub |
| `#/h/<code>/tv` | the TV | TV display (no login needed) |

Give each hub owner their hub link (`https://<site>/#/h/<code>/`), the client link (`.../#/h/<code>/c`) and the TV link
(`.../#/h/<code>/tv`). A device remembers the last hub it opened.

### Themes (set by the super admin only)

| Theme | Look |
|---|---|
| **Candy** | Pastel pink, peach, lemon, mint and lavender on frosted glass panels |
| **Glass** | Cool frosted glass on a deep blue backdrop |
| **Professional** | Flat, solid and neutral, like business software |

The theme belongs to the hub and applies to its staff pages, client page and TV. Hub owners cannot change it. Each theme has a
light and a night version that follow the device setting (Glass is always dark). The pickleball courts keep their colours.

## Set up the database and login (Firebase, free plan)

1. https://console.firebase.google.com > **Add project**.
2. **Project settings > Your apps > Web (`</>`)**: register an app, copy `firebaseConfig` into `src/sync/firebaseConfig.js`
   (`apiKey`, `authDomain`, `projectId`, `appId`). These values are not secret.
3. **Build > Authentication > Get started**: enable **Email/Password** (and **Google** if you want that button).
   Under **Settings > Authorized domains** add the site's domain (for GitHub Pages: `<you>.github.io`).
4. **Build > Firestore Database > Create database** (production mode). Open the **Rules** tab, paste the rules below, **Publish**.
5. Rebuild or redeploy. Open `#/login` and **Create account** (this is your super admin login).
6. Make yourself super admin: copy your **User UID** from Firebase *Authentication > Users*. In **Firestore** start a collection
   named `platformAdmins`, use that UID as the document ID and add any field (e.g. `role` = `super`). Sign out and in again.
7. Open `#/platform` > **Create hub**: name, code, theme, and the owner's name and email. The owner gets an email to choose a
   password and then runs the hub from `#/h/<code>/`. More super admins can be added on the platform page (**Super admins**).

Data from the old single-venue version (collections at the top level of Firestore) is **not** moved into a hub automatically.

### Firestore rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isSuper() { return signedIn() && exists(/databases/$(database)/documents/platformAdmins/$(request.auth.uid)); }
    function hubOn(h) { return get(/databases/$(database)/documents/hubs/$(h)).data.get('active', true); }
    // staff of hub h (a super admin counts as owner of every hub; a paused hub is closed to its own staff)
    function isStaff(h) { return isSuper() || (signedIn() && hubOn(h) && exists(/databases/$(database)/documents/hubs/$(h)/admins/$(request.auth.uid))); }
    function roleOf(h) { return isSuper() ? 'owner' : get(/databases/$(database)/documents/hubs/$(h)/admins/$(request.auth.uid)).data.get('role', 'owner'); }
    function hasRole(h, roles) { return isStaff(h) && roleOf(h) in roles; }
    function isOwner(h)   { return hasRole(h, ['owner', 'admin']); }
    function canManage(h) { return hasRole(h, ['owner', 'admin', 'manager']); }
    function canFront(h)  { return hasRole(h, ['owner', 'admin', 'manager', 'frontdesk']); }
    function canPos(h)    { return hasRole(h, ['owner', 'admin', 'manager', 'frontdesk', 'cashier']); }
    function canQueue(h)  { return hasRole(h, ['owner', 'admin', 'manager', 'frontdesk', 'queue']); }
    function open(h)      { return signedIn() && hubOn(h); } // clients can act only in an active hub

    // platform level
    match /platformAdmins/{uid} {
      allow get: if signedIn() && request.auth.uid == uid;
      allow list, write: if isSuper();
    }
    match /users/{uid} {   // directory of people who have signed in; used by super admins to find an existing account
      allow read: if isSuper() || (signedIn() && request.auth.uid == uid);
      // a person can only record the email they really signed in with, so nobody can claim someone else's email
      allow create, update: if isSuper() || (signedIn() && request.auth.uid == uid
        && request.resource.data.email.lower() == request.auth.token.email.lower());
      allow delete: if isSuper();
    }

    // a hub: anyone can read its public card (name, theme, active); only super admins list or change hubs
    match /hubs/{hubId} {
      allow get: if true;
      allow list, write: if isSuper();

      // staff of this hub: everyone reads their own; owners list and change them
      match /admins/{uid} {
        allow get: if signedIn() && request.auth.uid == uid;
        allow list, write: if isOwner(hubId);
      }

      // saved players: staff read; owner, manager and front desk write; a client sees and edits only their own
      // profile (not level, rating or notes)
      match /players/{id} {
        allow read: if isStaff(hubId) || (open(hubId) && request.auth.uid == id);
        allow create: if canFront(hubId) || (open(hubId) && request.auth.uid == id
          && request.resource.data.uid == request.auth.uid
          && request.resource.data.keys().hasOnly(['uid','name','email','phone','selfLevel','createdAt','updatedAt']));
        allow update: if canFront(hubId) || (open(hubId) && request.auth.uid == id
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name','phone','selfLevel','email','createdAt','updatedAt']));
        allow delete: if canFront(hubId);
      }

      // bookings: private details; `slots` stop double booking and block rentals during open play;
      // `rentalsPublic` is what the TV and the booking page show
      match /bookings/{id} {
        allow read: if canPos(hubId) || (open(hubId) && resource.data.uid == request.auth.uid);
        allow create: if open(hubId) && request.resource.data.uid == request.auth.uid;
        allow update: if canPos(hubId);
        allow delete: if canPos(hubId) || (open(hubId) && resource.data.uid == request.auth.uid);
      }
      match /slots/{slot} {
        allow get: if open(hubId);
        allow create: if open(hubId) && request.resource.data.uid == request.auth.uid;
        allow delete: if canPos(hubId) || (open(hubId) && resource.data.uid == request.auth.uid);
      }
      match /rentalsPublic/{id} {
        allow read: if true;
        allow create: if open(hubId) && request.resource.data.uid == request.auth.uid;
        allow update: if canPos(hubId);
        allow delete: if canPos(hubId) || (open(hubId) && resource.data.uid == request.auth.uid);
      }

      // open play
      match /sessions/{id} {
        allow read: if true;
        allow write: if canFront(hubId);
      }
      match /signups/{id} {
        allow read: if open(hubId);
        allow create, update: if canFront(hubId) || (open(hubId) && request.resource.data.uid == request.auth.uid
          && id == request.resource.data.sessionId + '_' + request.auth.uid);
        allow delete: if canFront(hubId) || (open(hubId) && resource.data.uid == request.auth.uid);
      }

      // live queue state shown on the TV (readable by the TV without login; written by staff who run the queue)
      match /display/{doc} {
        allow read: if true;
        allow write: if canQueue(hubId) && request.resource.data.json is string && request.resource.data.json.size() < 900000;
      }

      // rates are public (clients see prices); only owner and manager change them
      match /settings/{doc} {
        allow read: if true;
        allow write: if canManage(hubId);
      }

      // products and sales. A cashier or front desk can sell (lower stock, record sales) but not edit products or void sales.
      match /products/{id} {
        allow read: if canPos(hubId);
        allow create, delete: if canManage(hubId);
        allow update: if canManage(hubId) || (canPos(hubId)
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stock','updatedAt']));
      }
      match /stockLog/{id} {
        allow read: if canManage(hubId);
        allow create: if canPos(hubId);
      }
      match /sales/{id} {
        allow read: if canPos(hubId);
        allow create: if canPos(hubId);
        allow update: if canManage(hubId);
      }
    }
  }
}
```

What the rules do and do not protect:
- Hubs are separated by the database path (`hubs/<code>/...`) and by the rules: a hub's staff and clients can only read and
  write inside their own hub. Only super admins can list hubs, create them, or change a theme.
- A super admin can open every hub as its owner (needed for support). Keep the number of super admins small.
- Pausing a hub (platform page) closes it to its staff and clients. Its public card, TV data and open play list stay readable.
- Clients cannot see other people's bookings or contact details, cannot see products, stock or sales, and cannot change prices.
- Anyone with a hub's link can read its TV data: the queue, courts, rentals' names and the open play list.
- The limits on booking length (4 hours) and how far ahead (60 days) are checked in the app only, not by the rules.
- Open play capacity is soft: two people tapping at the same moment can both get the last place.
- Hiding the Income page for cashiers and front desk is done by the screen; their role can still read sales records.
- Income is always counted from the **sales** records (staff only), never from flags a client could set.

### Staff roles (inside a hub)

| Role | Can do |
|---|---|
| **Owner** | Everything in the hub, including staff accounts |
| **Manager** | Everything except staff accounts (rates, courts, inventory, income, refunds) |
| **Front desk** | Queue, rentals, open play (create sessions), players, POS, TV & ads |
| **Cashier** | POS and collecting rental / open play payments |
| **Queue master** | Queue and stats only |

Hub owners add people and change roles on the **Users** page; the screens and menu items a role cannot use are hidden, and the
rules above enforce the same limits. Roles belong to one hub: the same person can be an owner in one hub and a client in another.

## Money

- **Rates** (Settings): court price per hour, an optional peak rate from a start time, and the default open play fee.
  A session can have its own fee. Clients see the prices; they pay at the venue.
- **Rentals and open play**: staff mark a booking or a sign-up paid (amount and method). That creates a sale. *Undo*
  voids it. Cancelling a paid booking offers to refund it.
- **POS**: tap products, choose Cash / GCash / Card / Bank transfer / Other, charge. Stock goes down in the same
  transaction, and a stock history entry is written. **Open play entry** is a quick button for walk-ins.
- **Inventory**: add products with price, cost, stock and a low-stock level; restock; set a counted total.
- **Income**: totals by category (court rentals, open play, products), by day and by payment method, plus the money still
  to collect and the recent sales (void a sale to refund it; product stock returns).

## Open play blocks rentals

An open play session takes the 30-minute slots of the courts it uses (all courts by default, or the ones you tick), exactly like a
rental does. Nobody can rent those courts at that time: the booking screens show the slots as open play (mint) and the database
refuses a rental that overlaps. If a court already has a rental at that time, the session is not created, and you are told which court
and time to clear first. Deleting a session opens the slots again. Sessions made before this feature show a **Block rentals** button.
(If you later add courts, existing sessions do not cover the new courts.)

## Look

Each hub has one of three themes (Candy, Glass, Professional), chosen by the super admin; see *Themes* above. Panels fall back
to near-solid on browsers without blur support or when the device asks for reduced transparency.

## Partners in the queue

By default every match gets random partners. Pick two players under **Partners** on the Queue page (or tick **The 2 names are
partners for the session** when adding two players) and choose how long:
- **Rest of the queue session**: the pair plays on the same team for every match and waits in the queue together, until you
  unpair them, press **End session (clear partners)**, or the day ends.
- **Next match only**: they are partners for their next match, then go back to random partners.

Pairs show as "Anna & Ben" on the TV. If only one of a pair is waiting, that player is matched like anyone else until the
partner returns.

## Timers

- **Game timer**: each court shows how long its match has been running (on the TV, in the bottom half of the court, and on the
  Queue page). Set **Game time (min)** on the Queue page to count down instead; at zero it flashes **TIME** (the match is not
  ended automatically). 0 means no limit, the clock just counts up. The clock uses each device's own time, so a TV with a wrong
  clock will be off by the same amount.
- **Waiting time**: every waiting player shows how long they have waited (Queue page: "⏳ 12 min"; TV Up next: "· 12m"). The
  clock restarts when a player rejoins after a match. A pair shows the longer wait.

## Open play sessions

An open play session blocks rentals on its courts for its date and time. Use **Edit** on a session to change its date, time,
courts, fee or note: the court blocks move with it, sign-ups stay, and nothing changes if a rental or another session is in
the way.

## Users and roles

Owners use **Users** to **add a person**: it creates their login (Firebase email and password must be enabled), saves their
profile and role, and emails them a link to choose their own password (the temporary password is also shown once). People
can also sign up themselves on the booking page and then appear in the list; use the role menu on any row to make them staff
or set them back to **Client**. There must always be at least one owner. Creating an account for someone else uses a second
Firebase app instance, so the owner stays signed in.

## Levels

Players have a level (Beginner / Intermediate / Advanced). Clients choose their own level on their profile; the level
staff set on the **Players** page overrides it. Levels show in the queue, and the **Similar levels** matchup mode takes the
first player in line plus the three closest in level.

## TV

The right side cycles: courts, open play schedule, player stats. Ads and announcements are managed on **TV & ads**.
Open `#/tv` on the TV once and tap to start; it needs no login. Voice announcements lower the ad volume while speaking.

## Deploy to GitHub Pages

A workflow is included (`.github/workflows/deploy.yml`). Push to `main`, set **Settings > Pages > Source** to
**GitHub Actions**. Add the Pages domain to the Firebase authorized domains (step 3 above).

## Build

```bash
npm run build     # outputs to dist/
npm run preview
```
