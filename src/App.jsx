import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import Layout from './Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RentalsPage from './pages/Rentals.jsx';
import OpenPlayPage from './pages/OpenPlay.jsx';
import PlayersPage from './pages/Players.jsx';
import PosPage from './pages/Pos.jsx';
import InventoryPage from './pages/Inventory.jsx';
import IncomePage from './pages/Income.jsx';
import AdsPage from './pages/Ads.jsx';
import StatsPage from './pages/Stats.jsx';
import AccountPage from './pages/Account.jsx';
import UsersPage from './pages/Users.jsx';
import LoginPage from './auth/Login.jsx';
import { RequireAuth, RequirePerm, RequireSuper } from './auth/Guards.jsx';
import ClientLayout from './client/ClientLayout.jsx';
import ClientBook from './client/ClientBook.jsx';
import ClientOpenPlay from './client/ClientOpenPlay.jsx';
import ClientProfile from './client/ClientProfile.jsx';
import { ControlPage, TvPage } from './court-queue/CourtQueue.jsx';
import { HubProvider } from './hub/HubProvider.jsx';
import Home from './hub/Home.jsx';
import { HubDetail, HubsPage, PlatformLayout, SuperAdminsPage } from './platform/Platform.jsx';

// keyed by the hub code, so opening another hub starts completely fresh
function HubRoute() {
  const { hubId } = useParams();
  return <HubProvider key={hubId}><Outlet /></HubProvider>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />

      {/* platform console: super admins only */}
      <Route path="/platform" element={<RequireSuper><PlatformLayout /></RequireSuper>}>
        <Route index element={<HubsPage />} />
        <Route path="hubs/:id" element={<HubDetail />} />
        <Route path="admins" element={<SuperAdminsPage />} />
      </Route>

      {/* one hub (venue): /h/<code>/... */}
      <Route path="/h/:hubId" element={<HubRoute />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="tv" element={<TvPage />} />

        {/* staff area */}
        <Route element={<RequireAuth admin><Layout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="queue" element={<RequirePerm perm="queue"><ControlPage /></RequirePerm>} />
          <Route path="rentals" element={<RequirePerm perm="bookings"><RentalsPage /></RequirePerm>} />
          <Route path="open-play" element={<RequirePerm perm="bookings"><OpenPlayPage /></RequirePerm>} />
          <Route path="players" element={<RequirePerm perm="players"><PlayersPage /></RequirePerm>} />
          <Route path="pos" element={<RequirePerm perm="pos"><PosPage /></RequirePerm>} />
          <Route path="inventory" element={<RequirePerm perm="inventory"><InventoryPage /></RequirePerm>} />
          <Route path="income" element={<RequirePerm perm="income"><IncomePage /></RequirePerm>} />
          <Route path="stats" element={<RequirePerm perm="queue"><StatsPage /></RequirePerm>} />
          <Route path="ads" element={<RequirePerm perm="tv"><AdsPage /></RequirePerm>} />
          <Route path="users" element={<RequirePerm perm="staff"><UsersPage /></RequirePerm>} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        {/* client page: any signed-in user */}
        <Route path="c" element={<RequireAuth><ClientLayout /></RequireAuth>}>
          <Route index element={<ClientBook />} />
          <Route path="open-play" element={<ClientOpenPlay />} />
          <Route path="profile" element={<ClientProfile />} />
        </Route>

        <Route path="*" element={<Navigate to=".." replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
