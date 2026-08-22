
function AIWidget({

    totalHistory = 0,

    totalMemory = 0,

    provider = "OpenAI",

    version = "V11",

    onOpen,

}) {

    return (

        <div className="dashboard-card">

            <h3>🤖 Toyota AI Brain</h3>

            <p>Version: {version}</p>

            <p>Provider: {provider}</p>

            <p>History: {totalHistory}</p>

            <p>Memory: {totalMemory}</p>

            <button onClick={onOpen}>
                🚀 Mở AI Workspace
            </button>

        </div>

    );

}

export default AIWidget;