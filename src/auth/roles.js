/* Staff roles and what each can do. A staff member's role is stored in the `admins` collection (field `role`).
   The same rules are enforced by the Firestore rules (see the README), not only by the screens. */
export const ROLES = {
  owner: {
    label: 'Owner',
    desc: 'Everything, including staff accounts and rates',
    perms: ['queue', 'bookings', 'sessions', 'players', 'pos', 'inventory', 'income', 'refund', 'tv', 'settings', 'staff'],
  },
  manager: {
    label: 'Manager',
    desc: 'Everything except staff accounts',
    perms: ['queue', 'bookings', 'sessions', 'players', 'pos', 'inventory', 'income', 'refund', 'tv', 'settings'],
  },
  frontdesk: {
    label: 'Front desk',
    desc: 'Queue, rentals, open play, players, POS and the TV',
    perms: ['queue', 'bookings', 'sessions', 'players', 'pos', 'tv'],
  },
  cashier: {
    label: 'Cashier',
    desc: 'POS and collecting rental and open play payments',
    perms: ['pos', 'bookings'],
  },
  queue: {
    label: 'Queue master',
    desc: 'Runs the queue and sees the stats',
    perms: ['queue'],
  },
};

// permissions: queue (queue + stats), bookings (rentals + open play view, collect payments), sessions (create open play),
// players, pos, inventory, income (income page + money on the dashboard), refund (void sales), tv (TV & ads),
// settings (rates, courts), staff (manage staff)

// old accounts have role "admin" or none: they are owners. An unknown role gets no permissions.
export const normalizeRole = (r) => (!r || r === 'admin' ? 'owner' : ROLES[r] ? r : 'none');
export const can = (role, perm) => !!(ROLES[role] && ROLES[role].perms.includes(perm));
