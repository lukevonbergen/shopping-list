import { useState, useEffect } from 'react'
import './ShoppingList.css'

function ShoppingList({ list, items, onAddItem, onToggleItem, onUpdateNotes, onDeleteItem, onUpdateCost, onUpdateMealTitle, onCreateWeek, onGoToCurrentWeek }) {
  const [newItemName, setNewItemName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('monday_dinner')
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesText, setNotesText] = useState('')
  const [totalCost, setTotalCost] = useState(list.total_cost || 0)
  const [editingCost, setEditingCost] = useState(false)
  const [categoryInputs, setCategoryInputs] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
  const [mealTitles, setMealTitles] = useState({})
  const [editingMealTitle, setEditingMealTitle] = useState(null)

  // Update meal titles when list changes
  useEffect(() => {
    setMealTitles(list.meal_titles || {})
  }, [list.id, list.meal_titles])

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  const getDateForDay = (dayIndex) => {
    // Parse date string and add days - ensuring no timezone conversion
    const [year, month, day] = list.week_start.split('-').map(Number)
    console.log(`Parsing week_start: ${list.week_start} -> year=${year}, month=${month}, day=${day}`)
    const weekStart = new Date(year, month - 1, day, 12, 0, 0) // Use noon to avoid DST issues
    console.log(`Created date for Monday: ${weekStart.toDateString()}`)
    weekStart.setDate(weekStart.getDate() + dayIndex)
    const dayNum = weekStart.getDate()
    console.log(`Day ${dayIndex} (adding ${dayIndex} days): ${weekStart.toDateString()} = ${dayNum}`)

    return `${dayNum}${getOrdinalSuffix(dayNum)}`
  }

  const categories = [
    { id: 'monday_dinner', label: 'Monday Dinner', dayIndex: 0 },
    { id: 'tuesday_dinner', label: 'Tuesday Dinner', dayIndex: 1 },
    { id: 'wednesday_dinner', label: 'Wednesday Dinner', dayIndex: 2 },
    { id: 'thursday_dinner', label: 'Thursday Dinner', dayIndex: 3 },
    { id: 'friday_dinner', label: 'Friday Dinner', dayIndex: 4 },
    { id: 'saturday_dinner', label: 'Saturday Dinner', dayIndex: 5 },
    { id: 'sunday_dinner', label: 'Sunday Dinner', dayIndex: 6 },
    { id: 'luke_lunch', label: "Luke's Weekly Lunches", dayIndex: null },
    { id: 'charlie_lunch', label: "Charlie's Weekly Lunches", dayIndex: null },
  ]

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const saveMealTitle = (categoryId, title) => {
    const newTitles = { ...mealTitles, [categoryId]: title }
    setMealTitles(newTitles)
    onUpdateMealTitle(newTitles)
    setEditingMealTitle(null)
  }

  const handleAddItem = (e) => {
    e.preventDefault()
    if (newItemName.trim()) {
      onAddItem(newItemName, selectedCategory)
      setNewItemName('')
    }
  }

  const handleAddItemToCategory = (categoryId, e) => {
    e.preventDefault()
    const itemName = categoryInputs[categoryId] || ''
    if (itemName.trim()) {
      onAddItem(itemName, categoryId)
      setCategoryInputs({ ...categoryInputs, [categoryId]: '' })
    }
  }

  const handleToggle = (itemId, currentStatus) => {
    onToggleItem(itemId, !currentStatus)
  }

  const startEditingNotes = (item) => {
    setEditingNotes(item.id)
    setNotesText(item.notes || '')
  }

  const saveNotes = (itemId) => {
    onUpdateNotes(itemId, notesText)
    setEditingNotes(null)
  }

  const handleCostChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    setTotalCost(value)
  }

  const saveCost = () => {
    onUpdateCost(totalCost)
    setEditingCost(false)
  }

  const formatWeekRange = (weekStart) => {
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length

  // Group items by category
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat.id] = items.filter(item => item.category === cat.id)
    return acc
  }, {})

  const renderItemsList = (categoryItems) => {
    if (categoryItems.length === 0) {
      return <p className="no-items">No items yet</p>
    }

    return categoryItems.map(item => (
      <div key={item.id} className={`item ${item.completed ? 'completed' : ''}`}>
        <div className="item-main">
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => handleToggle(item.id, item.completed)}
            className="item-checkbox"
          />
          <span className="item-name">{item.name}</span>
          <div className="item-actions">
            <button
              onClick={() => startEditingNotes(item)}
              className="notes-btn"
              title="Add notes"
            >
              📝
            </button>
            <button
              onClick={() => onDeleteItem(item.id)}
              className="delete-btn"
              title="Delete item"
            >
              🗑️
            </button>
          </div>
        </div>

        {editingNotes === item.id ? (
          <div className="notes-editor">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add notes..."
              className="notes-textarea"
              autoFocus
            />
            <div className="notes-actions">
              <button onClick={() => saveNotes(item.id)} className="save-btn">Save</button>
              <button onClick={() => setEditingNotes(null)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        ) : item.notes && (
          <div className="notes-display" onClick={() => startEditingNotes(item)}>
            {item.notes}
          </div>
        )}
      </div>
    ))
  }

  const createNewWeek = (weekOffset) => {
    const baseDate = new Date(list.week_start)
    const newWeekStart = new Date(baseDate)
    newWeekStart.setDate(newWeekStart.getDate() + (weekOffset * 7))
    onCreateWeek(newWeekStart.toISOString().split('T')[0])
  }

  return (
    <div className="shopping-list">
      <div className="list-header">
        <div className="week-navigation">
          <button
            className="week-nav-btn"
            onClick={() => createNewWeek(-1)}
            title="Previous week"
          >
            ←
          </button>
          <div className="week-title-container">
            <h2>Week of {formatWeekRange(list.week_start)}</h2>
            <button
              className="today-btn"
              onClick={onGoToCurrentWeek}
              title="Go to current week"
            >
              Today
            </button>
          </div>
          <button
            className="week-nav-btn"
            onClick={() => createNewWeek(1)}
            title="Next week"
          >
            →
          </button>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          ></div>
          <span className="progress-text">{completedCount} / {totalCount} items</span>
        </div>
      </div>

      <div className="categories-container">
        {categories.map(category => {
          const isExpanded = expandedCategories[category.id]
          const categoryItems = groupedItems[category.id] || []
          const itemCount = categoryItems.length
          const completedCount = categoryItems.filter(item => item.completed).length

          return (
            <div key={category.id} className="category-section">
              <div className="category-header" onClick={() => toggleCategory(category.id)}>
                <div className="category-header-left">
                  <span className="category-chevron">{isExpanded ? '▼' : '▶'}</span>
                  <div className="category-title-container">
                    <div className="category-title-row">
                      <h3 className="category-title">
                        {category.label}
                        {category.dayIndex !== null && (
                          <span className="category-date-text">({getDateForDay(category.dayIndex)})</span>
                        )}
                      </h3>
                    </div>
                    {mealTitles[category.id] && !editingMealTitle && (
                      <p className="meal-title" onClick={(e) => {
                        e.stopPropagation()
                        setEditingMealTitle(category.id)
                      }}>
                        {mealTitles[category.id]}
                      </p>
                    )}
                    {editingMealTitle === category.id && (
                      <input
                        type="text"
                        className="meal-title-input"
                        defaultValue={mealTitles[category.id] || ''}
                        placeholder="Add meal title..."
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => saveMealTitle(category.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveMealTitle(category.id, e.target.value)
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="category-count">
                  {completedCount}/{itemCount}
                </div>
              </div>

              {isExpanded && (
                <div className="category-content">
                  {!mealTitles[category.id] && !editingMealTitle && (
                    <button
                      className="add-meal-title-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingMealTitle(category.id)
                      }}
                    >
                      + Add meal title
                    </button>
                  )}
                  <form onSubmit={(e) => handleAddItemToCategory(category.id, e)} className="category-add-form">
                    <input
                      type="text"
                      value={categoryInputs[category.id] || ''}
                      onChange={(e) => setCategoryInputs({ ...categoryInputs, [category.id]: e.target.value })}
                      placeholder="Add item..."
                      className="category-input"
                    />
                    <button type="submit" className="category-add-btn">+</button>
                  </form>
                  <div className="category-items">
                    {renderItemsList(categoryItems)}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="total-cost-section">
        <label>Total Cost: £</label>
        {editingCost ? (
          <div className="cost-editor">
            <input
              type="number"
              step="0.01"
              value={totalCost}
              onChange={handleCostChange}
              className="cost-input"
              autoFocus
            />
            <button onClick={saveCost} className="save-btn">Save</button>
            <button onClick={() => {
              setEditingCost(false)
              setTotalCost(list.total_cost || 0)
            }} className="cancel-btn">Cancel</button>
          </div>
        ) : (
          <div className="cost-display" onClick={() => setEditingCost(true)}>
            <span className="cost-value">£{(list.total_cost || 0).toFixed(2)}</span>
            <button className="edit-btn">✏️ Edit</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShoppingList
