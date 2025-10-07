import './Statistics.css'

function Statistics({ lists }) {

  const calculateStats = () => {
    const validLists = lists.filter(list => list.total_cost > 0)

    if (validLists.length === 0) return null

    const totalSpent = validLists.reduce((sum, list) => sum + (list.total_cost || 0), 0)
    const avgSpend = totalSpent / validLists.length
    const maxSpend = Math.max(...validLists.map(l => l.total_cost || 0))
    const minSpend = Math.min(...validLists.map(l => l.total_cost || 0))

    return {
      totalWeeks: validLists.length,
      totalSpent,
      avgSpend,
      maxSpend,
      minSpend
    }
  }

  const stats = calculateStats()

  return (
    <div className="statistics">
      <h2>Shopping Statistics</h2>

      {!stats || stats.totalWeeks === 0 ? (
        <p className="no-stats">Not enough data yet. Start shopping to see statistics!</p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Weeks</div>
              <div className="stat-value">{stats.totalWeeks}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Total Spent</div>
              <div className="stat-value">£{stats.totalSpent.toFixed(2)}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Average per Week</div>
              <div className="stat-value">£{stats.avgSpend.toFixed(2)}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Highest Week</div>
              <div className="stat-value">£{stats.maxSpend.toFixed(2)}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Lowest Week</div>
              <div className="stat-value">£{stats.minSpend.toFixed(2)}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Statistics
