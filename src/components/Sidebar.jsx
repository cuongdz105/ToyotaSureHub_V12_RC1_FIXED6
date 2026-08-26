import { Link } from "react-router-dom";

function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`sidebar${isOpen ? " open" : ""}`}>
      <h2>🚗 ToyotaSureHub</h2>

      <Link to="/" onClick={onClose}>
        <button>📋 Dashboard</button>
      </Link>

      <Link to="/cars" onClick={onClose}>
        <button>🚗 Quản lý xe</button>
      </Link>

      {/* =================================
          CONTENT RESEARCH
      ================================= */}

      <Link to="/content-library" onClick={onClose}>
        <button>📚 Thư viện bài mẫu</button>
      </Link>

      <Link to="/facebook/groups" onClick={onClose}>
        <button>👥 Facebook Groups</button>
      </Link>

      <Link to="/facebook/queue" onClick={onClose}>
        <button>📋 Facebook Queue</button>
      </Link>

      <Link to="/campaign" onClick={onClose}>
        <button>📣 Facebook Campaign</button>
      </Link>

      <Link to="/facebook/accounts" onClick={onClose}>
        <button>👤 Facebook Accounts</button>
      </Link>

      <Link to="/customers" onClick={onClose}>
        <button>👥 Khách hàng</button>
      </Link>

            <Link to="/report" onClick={onClose}>
        <button>📊 Báo cáo</button>
      </Link>

      <Link to="/settings" onClick={onClose}>
        <button>⚙️ Cài đặt</button>
      </Link>
    </aside>
  );
}

export default Sidebar;