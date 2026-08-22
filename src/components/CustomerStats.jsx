import StatCard from "./StatCard";

function CustomerStats() {
  return (
    <div className="stats-grid">
      <StatCard icon="👥" title="Tổng khách" value={0} />
      <StatCard icon="🔥" title="Lead mới" value={0} />
      <StatCard icon="📅" title="Đã hẹn" value={0} />
      <StatCard icon="💰" title="Đã bán" value={0} />
    </div>
  );
}

export default CustomerStats;