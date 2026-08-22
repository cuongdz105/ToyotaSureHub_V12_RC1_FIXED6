import { useNavigate } from "react-router-dom";

import DashboardCard from "../components/DashboardCard";
import QuickActions from "../components/QuickActions";
import RecentActivity from "../components/RecentActivity";
import AIWidget from "../components/AIWidget";

import { getDashboardData } from "../services/dashboardService";
import { useCars } from "../hooks/useCars";
import PriorityWorkPanel from "../components/PriorityWorkPanel";

function Dashboard() {
    const navigate = useNavigate();
    useCars();

    const dashboardData =
        getDashboardData();

    
    return (
        <div className="app">
            <main className="content">

                {/* HEADER */}
                <header className="topbar">
                    <div>
                        <h1>
                            👋 Chào mừng trở lại!
                        </h1>

                        <p>
                            Hôm nay ông muốn làm gì?
                        </p>
                    </div>
                </header>


                                {/* KPI */}
                  <section className="cards">
                    {dashboardData.map((item, index) => (
                      <DashboardCard
                        key={index}
                        icon={item.icon}
                        title={item.title}
                        value={item.value}
                      />
                    ))}
                  </section>

                  {/* ==========================================
                      V11 PRIORITY WORK CENTER
                  ========================================== */}

                  <PriorityWorkPanel />

               
               
                {/* Quick Actions */}
<QuickActions />


                {/* BOTTOM */}
                <section className="dashboard-bottom">
                    <RecentActivity />
                    <AIWidget />
                </section>

            </main>
        </div>
    );
}

export default Dashboard;