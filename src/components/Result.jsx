
function ResultCard ({result}){
    if (!result) return null

    return (
        <div className="result-card">
          <div className="stat">
            <span className="stat-label">User Type</span>
            <span>{result.type}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total Transcation</span>
            <span>{result.totalTx}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Risk Level</span>
            <span>{result.riskLevel}</span>
          </div>
          <p className="summary">{result.summary}</p>
        </div>
    )
}

export default ResultCard