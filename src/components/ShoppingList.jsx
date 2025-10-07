import { useState } from 'react'
import './ShoppingList.css'

function ShoppingList({ list, items, onAddItem, onToggleItem, onUpdateNotes, onDeleteItem, onUpdateCost }) {
  const [newItemName, setNewItemName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('monday_dinner')
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesText, setNotesText] = useState('')
  const [totalCost, setTotalCost] = useState(list.total_cost || 0)
  const [editingCost, setEditingCost] = useState(false)
  const [categoryInputs, setCategoryInputs] = useState({})

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
  ]

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

  return (
    <div className="shopping-list">
      <div className="list-header">
        <h2>Week of {formatWeekRange(list.week_start)}</h2>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          ></div>
          <span className="progress-text">{completedCount} / {totalCount} items</span>
        </div>
      </div>

      <form onSubmit={handleAddItem} className="add-item-form">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add new item..."
          className="add-item-input"
        />
        <button type="submit" className="add-item-btn">Add</button>
      </form>

      <div className="categories-container">
        {categories.map(category => (
          <div key={category.id} className="category-section">
            <h3 className="category-title">{category.label}</h3>
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
              {renderItemsList(groupedItems[category.id])}
            </div>
          </div>
        ))}
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
