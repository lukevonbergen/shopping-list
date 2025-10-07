import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ShoppingList from './components/ShoppingList'
import History from './components/History'
import Statistics from './components/Statistics'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState('lists') // lists, history, cost
  const [currentList, setCurrentList] = useState(null)
  const [lists, setLists] = useState([])
  const [items, setItems] = useState([])

  useEffect(() => {
    // Get or create current week's list
    fetchCurrentList()
    fetchLists()

    // Subscribe to real-time changes
    const listsSubscription = supabase
      .channel('lists_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLists(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setLists(prev => prev.map(list => list.id === payload.new.id ? payload.new : list))
          setCurrentList(prev => prev && prev.id === payload.new.id ? payload.new : prev)
        }
      })
      .subscribe()

    const itemsSubscription = supabase
      .channel('items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => {
            // Avoid duplicates
            if (prev.find(item => item.id === payload.new.id)) {
              return prev
            }
            return [...prev, payload.new]
          })
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(item => item.id === payload.new.id ? payload.new : item))
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(item => item.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(listsSubscription)
      supabase.removeChannel(itemsSubscription)
    }
  }, [])

  useEffect(() => {
    if (currentList) {
      fetchItems(currentList.id)
    }
  }, [currentList])

  const fetchCurrentList = async () => {
    const today = new Date()
    const weekStartStr = getWeekStart(today)
    const [year, month, day] = weekStartStr.split('-').map(Number)
    const weekEnd = new Date(year, month - 1, day + 6)
    const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`

    let { data, error } = await supabase
      .from('lists')
      .select('*')
      .gte('week_start', weekStartStr)
      .lte('week_start', weekEndStr)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!error && data && data.length > 0) {
      setCurrentList(data[0])
    } else if (!error && (!data || data.length === 0)) {
      // No list for this week, create one
      const { data: newList, error: createError } = await supabase
        .from('lists')
        .insert([{ week_start: weekStartStr, total_cost: 0 }])
        .select()
        .single()

      if (!createError) {
        setCurrentList(newList)
      }
    }
  }

  const fetchLists = async () => {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('week_start', { ascending: false })

    if (!error) {
      setLists(data)
    }
  }

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


  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    d.setDate(diff)
    // Return as YYYY-MM-DD string in local time
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const dayStr = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${dayStr}`
  }

  const addItem = async (itemName, category) => {
    if (!currentList || !itemName.trim()) {
      return
    }

    const { data, error } = await supabase
      .from('items')
      .insert([{ list_id: currentList.id, name: itemName, category, completed: false, notes: '' }])
      .select()
      .single()

    if (!error && data) {
      // Optimistic update - add immediately to UI
      setItems(prev => [...prev, data])
    }
  }

  const toggleItem = async (itemId, completed) => {
    // Optimistic update
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, completed } : item))

    const { error } = await supabase
      .from('items')
      .update({ completed })
      .eq('id', itemId)

    if (error) {
      // Revert on error
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, completed: !completed } : item))
    }
  }

  const updateItemNotes = async (itemId, notes) => {
    // Optimistic update
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, notes } : item))

    const { error } = await supabase
      .from('items')
      .update({ notes })
      .eq('id', itemId)
  }

  const deleteItem = async (itemId) => {
    // Optimistic update
    const deletedItem = items.find(item => item.id === itemId)
    setItems(prev => prev.filter(item => item.id !== itemId))

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)

    if (error) {
      // Revert on error
      if (deletedItem) {
        setItems(prev => [...prev, deletedItem])
      }
    }
  }

  const updateTotalCost = async (cost) => {
    if (!currentList) return

    await supabase
      .from('lists')
      .update({ total_cost: cost })
      .eq('id', currentList.id)
  }

  const updateMealTitles = async (mealTitles) => {
    if (!currentList) return

    // Optimistic update
    setCurrentList(prev => ({ ...prev, meal_titles: mealTitles }))

    await supabase
      .from('lists')
      .update({ meal_titles: mealTitles })
      .eq('id', currentList.id)
  }

  const createWeek = async (weekStart) => {
    // Check if week already exists
    const { data: existingList } = await supabase
      .from('lists')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle()

    if (existingList) {
      setCurrentList(existingList)
      return
    }

    // Create new week
    const { data: newList, error } = await supabase
      .from('lists')
      .insert([{ week_start: weekStart, total_cost: 0 }])
      .select()
      .single()

    if (!error && newList) {
      setCurrentList(newList)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <nav className="nav-tabs">
          <div className="nav-tabs-background">
            <div className={`nav-tabs-slider nav-tabs-slider-${activeView}`}></div>
          </div>
          <button
            className={activeView === 'lists' ? 'active' : ''}
            onClick={() => setActiveView('lists')}
          >
            Lists
          </button>
          <button
            className={activeView === 'history' ? 'active' : ''}
            onClick={() => setActiveView('history')}
          >
            History
          </button>
          <button
            className={activeView === 'cost' ? 'active' : ''}
            onClick={() => setActiveView('cost')}
          >
            Cost
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeView === 'lists' && currentList && (
          <ShoppingList
            list={currentList}
            items={items}
            onAddItem={addItem}
            onToggleItem={toggleItem}
            onUpdateNotes={updateItemNotes}
            onDeleteItem={deleteItem}
            onUpdateCost={updateTotalCost}
            onUpdateMealTitle={updateMealTitles}
            onCreateWeek={createWeek}
            onGoToCurrentWeek={fetchCurrentList}
          />
        )}
        {activeView === 'history' && (
          <History lists={lists} currentListId={currentList?.id} />
        )}
        {activeView === 'cost' && (
          <Statistics lists={lists} />
        )}
      </main>
    </div>
  )
}

export default App
