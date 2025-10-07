import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import './History.css'

function History({ lists, currentListId }) {
  const [selectedList, setSelectedList] = useState(null)
  const [items, setItems] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})

  const fetchItems = async (listId) => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })

    if (!error) {
      setItems(data)
    }
  }

  const handleSelectList = (list) => {
    setSelectedList(list)
    fetchItems(list.id)
    setExpandedCategories({})
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const formatWeekRange = (weekStart) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const getWeekLabel = (weekStart) => {
    const today = new Date()
    const currentWeekStart = new Date(today)
    const day = currentWeekStart.getDay()
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1)
    currentWeekStart.setDate(diff)
    currentWeekStart.setHours(0, 0, 0, 0)

    const listDate = new Date(weekStart)
    listDate.setHours(0, 0, 0, 0)

    const diffDays = Math.round((currentWeekStart - listDate) / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.round(diffDays / 7)

    if (diffWeeks === 0) return 'This week'
    if (diffWeeks === 1) return 'Last week'
    if (diffWeeks > 1) return `${diffWeeks} weeks ago`
    if (diffWeeks === -1) return 'Next week'
    return `${Math.abs(diffWeeks)} weeks ahead`
  }

  const categories = [
    { id: 'monday_dinner', label: 'Monday Dinner' },
    { id: 'tuesday_dinner', label: 'Tuesday Dinner' },
    { id: 'wednesday_dinner', label: 'Wednesday Dinner' },
    { id: 'thursday_dinner', label: 'Thursday Dinner' },
    { id: 'friday_dinner', label: 'Friday Dinner' },
    { id: 'saturday_dinner', label: 'Saturday Dinner' },
    { id: 'sunday_dinner', label: 'Sunday Dinner' },
    { id: 'luke_lunch', label: "Luke's Weekly Lunches" },
    { id: 'charlie_lunch', label: "Charlie's Weekly Lunches" },
    { id: 'snacks', label: "Snacks" },
  ]

  const pastLists = lists.filter(list =>
    list.total_cost > 0
  )

  // Group items by category
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat.id] = items.filter(item => item.category === cat.id)
    return acc
  }, {})

  return (
    <div className="history">
      <h2>Shopping History</h2>

      <div className="history-content">
        <div className="history-list">
          {pastLists.length === 0 ? (
            <p className="no-history">No past shopping lists yet</p>
          ) : (
            pastLists.map(list => (
              <div
                key={list.id}
                className={`history-item ${selectedList?.id === list.id ? 'selected' : ''}`}
                onClick={() => handleSelectList(list)}
              >
                <div className="history-item-header">
                  <div className="week-info">
                    <span className="week-range">{formatWeekRange(list.week_start)}</span>
                    <span className="week-label">{getWeekLabel(list.week_start)}</span>
                  </div>
                  <span className="cost">£{(list.total_cost || 0).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="history-detail">
          {selectedList ? (
            <>
              <h3>Week of {formatWeekRange(selectedList.week_start)}</h3>
              <div className="detail-cost">Total: £{(selectedList.total_cost || 0).toFixed(2)}</div>

              <div className="detail-items">
                {categories.map(category => {
                  const categoryItems = groupedItems[category.id] || []
                  if (categoryItems.length === 0) return null

                  const isExpanded = expandedCategories[category.id]

                  return (
                    <div key={category.id} className="history-category">
                      <div
                        className="history-category-header"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <span className="category-chevron">{isExpanded ? '▼' : '▶'}</span>
                        <h4>{category.label}</h4>
                        <span className="category-count">({categoryItems.length})</span>
                      </div>
                      {isExpanded && (
                        <ul className="history-category-items">
                          {categoryItems.map(item => (
                            <li key={item.id} className={item.completed ? 'completed' : ''}>
                              <span className="item-name">
                                {item.completed && '✓ '}
                                {item.name}
                              </span>
                              {item.notes && (
                                <div className="item-notes">{item.notes}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a week to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default History
