import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import './History.css'

function History({ lists, currentListId }) {
  const [selectedList, setSelectedList] = useState(null)
  const [items, setItems] = useState([])

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
  }

  const formatWeekRange = (weekStart) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const pastLists = lists.filter(list => list.id !== currentListId)

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
                  <span className="week-range">{formatWeekRange(list.week_start)}</span>
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
                <h4>Items ({items.length})</h4>
                {items.length === 0 ? (
                  <p className="no-items">No items in this list</p>
                ) : (
                  <ul>
                    {items.map(item => (
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
