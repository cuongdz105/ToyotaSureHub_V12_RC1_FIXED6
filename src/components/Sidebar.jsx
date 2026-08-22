import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>🚗 ToyotaSureHub</h2>

      <Link to="/">
        <button>📋 Dashboard</button>
      </Link>

      <Link to="/cars">
        <button>🚗 Quản lý xe</button>
      </Link>

      {/* =================================
          CONTENT RESEARCH
      ================================= */}

      <Link to="/content-library">
        <button>📚 Thư viện bài mẫu</button>
      </Link>

      <Link to="/facebook/groups">
        <button>👥 Facebook Groups</button>
      </Link>

      <Link to="/facebook/queue">
        <button>📋 Facebook Queue</button>
      </Link>

      <Link to="/campaign">
        <button>📣 Facebook Campaign</button>
      </Link>

      <Link to="/facebook/accounts">
        <button>👤 Facebook Accounts</button>
      </Link>

      <Link to="/customers">
        <button>👥 Khách hàng</button>
      </Link>

      <button>📊 Báo cáo</button>

      <Link to="/settings">
        <button>⚙️ Cài đặt</button>
      </Link>
    </aside>
  );
}

export default Sidebar;