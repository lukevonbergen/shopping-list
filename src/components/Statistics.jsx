import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import './Statistics.css'

function Statistics({ lists }) {
  const [itemStats, setItemStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItemStats()
  }, [lists])

  const fetchItemStats = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('items')
      .select('name')

    if (!error && data) {
      // Count frequency of each item
      const itemCounts = {}
      data.forEach(item => {
        const name = item.name.toLowerCase().trim()
        itemCounts[name] = (itemCounts[name] || 0) + 1
      })

      // Convert to array and sort by frequency
      const sortedItems = Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10

      setItemStats(sortedItems)
    }
    setLoading(false)
  }

  const calculateStats = () => {
    if (lists.length === 0) return null

    const validLists = lists.filter(list => list.total_cost > 0)
    const totalSpent = validLists.reduce((sum, list) => sum + (list.total_cost || 0), 0)
    const avgSpend = validLists.length > 0 ? totalSpent / validLists.length : 0
    const maxSpend = validLists.length > 0 ? Math.max(...validLists.map(l => l.total_cost || 0)) : 0
    const minSpend = validLists.length > 0 ? Math.min(...validLists.map(l => l.total_cost || 0)) : 0

    return {
      totalWeeks: lists.length,
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

          <div className="top-items">
            <h3>Most Purchased Items</h3>
            {loading ? (
              <p>Loading...</p>
            ) : itemStats.length === 0 ? (
              <p>No items yet</p>
            ) : (
              <div className="items-chart">
                {itemStats.map((item, index) => (
                  <div key={index} className="chart-item">
                    <div className="item-info">
                      <span className="item-rank">#{index + 1}</span>
                      <span className="item-name">{item.name}</span>
                    </div>
                    <div className="item-bar-container">
                      <div
                        className="item-bar"
                        style={{ width: `${(item.count / itemStats[0].count) * 100}%` }}
                      ></div>
                      <span className="item-count">{item.count}x</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Statistics
