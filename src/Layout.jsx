import { Outlet } from "react-router-dom";
import Header from "./Header";
import Navbar from "./Navbar";

function Layout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Fixed Top Section */}
      <div style={{ flexShrink: 0, zIndex: 20 }}>
        <Header />
        <Navbar />
      </div>

      {/* Scrollable Content Area */}
      <div style={{ flexGrow: 1, overflowY: "auto", minHeight: 0, zIndex: 10 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;