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
        <ChartContainer 
            chartData={exploratoryResult.chartData} 
            chartType={exploratoryResult.chartType}
            title={exploratoryResult.title}
            insight={exploratoryResult.insight}
        />
        )}
    </div>
    )
}