import ChartContainer from "./ChartContainer"



export function ExplanatoryChart({question, setQuestion, handleExplore, exploratoryLoading, exploratoryResult}){
    return (
    <div className="explore-section">
        <div className="input-row">
        <input
            placeholder="Ask anything about this wallet..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
        />
        <button onClick={handleExplore} disabled={exploratoryLoading}>
            {exploratoryLoading ? 'Thinking...' : 'Ask'}
        </button>
        </div>

        {exploratoryResult && (
        <div className="exploratory-results-grid">
            <ChartContainer
                chartData={exploratoryResult.chartData}
                chartType={exploratoryResult.chartType}
                title={exploratoryResult.title}
                insight={exploratoryResult.insight}
            />
            {exploratoryResult.chartData && exploratoryResult.chartData.length > 0 && (
                <div className="exploratory-data-table">
                    <h3>Data Details</h3>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Label</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exploratoryResult.chartData.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.label || item.date || item.name}</td>
                                        <td>{item.value || item.txCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
        )}
    </div>
    )
}