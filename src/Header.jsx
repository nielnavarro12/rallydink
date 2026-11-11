import { useAuth } from "./data/hooks.js";

const Header = () => {
  const { hub } = useAuth();

  return (
    <header
      className="cq-nav-in"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      {/* Brand Logo & Name (Left aligned) */}
      <div
        className="cq-nav-brand"
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        {hub?.logoUrl && (
          <img
            src={hub.logoUrl}
            alt={`${hub.name || "Hub"} Logo`}
            className="logo"
          />
        )}
        <h1 className="auth-title" style={{ margin: 0 }}>
          {hub?.name || "Drive n Dink"}
        </h1>
      </div>
   
    </header>
  );
};

export default Header;
