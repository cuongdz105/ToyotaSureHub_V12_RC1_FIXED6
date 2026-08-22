import "./DashboardCard.css";

function DashboardCard({ icon, title, value }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-icon">
        {icon}
      </div>

      <div className="dashboard-card-content">
        <p className="dashboard-card-title">
          {title}
        </p>

        <h2 className="dashboard-card-value">
          {value}
        </h2>
      </div>
    </div>
  );
}

export default DashboardCard;