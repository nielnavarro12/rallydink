import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

function Layout() {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Sidebar mounts desktop nav in-place and portals mobile drawer to body */}
      <Sidebar />

      {/* Main App Container */}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
        {/* Top Header */}
        <div style={{ flexShrink: 0 }}>
          <Header />
        </div>

        {/* Main Scrollable View */}
        <main style={{ flexGrow: 1, overflowY: "auto", minHeight: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;