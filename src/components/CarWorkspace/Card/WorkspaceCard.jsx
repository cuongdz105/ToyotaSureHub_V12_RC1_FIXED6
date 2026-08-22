import "./WorkspaceCard.css";

function WorkspaceCard({ title, children }) {
    return (
        <section className="workspace-card">

            <div className="workspace-card-header">
                <h2>{title}</h2>
            </div>

            <div className="workspace-card-body">
                {children}
            </div>

        </section>
    );
}

export default WorkspaceCard;