import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ShoppingList from './components/ShoppingList'
import History from './components/History'
import Statistics from './components/Statistics'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState('current') // current, history, stats
  const [currentList, setCurrentList] = useState(null)
  const [lists, setLists] = useState([])
  const [items, setItems] = useState([])

  useEffect(() => {
    console.log('🚀 App mounted, initializing...')
    // Get or create current week's list
    fetchCurrentList()
    fetchLists()

    // Subscribe to real-time changes
    console.log('📡 Setting up real-time subscriptions...')
    const listsSubscription = supabase
      .channel('lists_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, handleListChange)
      .subscribe()

    const itemsSubscription = supabase
      .channel('items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, handleItemChange)
      .subscribe()

    console.log('✅ Subscriptions created')

    return () => {
      console.log('🔌 Cleaning up subscriptions')
      supabase.removeChannel(listsSubscription)
      supabase.removeChannel(itemsSubscription)
    }
  }, [])

  useEffect(() => {
    console.log('📋 Current list changed:', currentList)
    if (currentList) {
      console.log('🔍 Fetching items for list:', currentList.id)
      fetchItems(currentList.id)
    }
  }, [currentList])

  const fetchCurrentList = async () => {
    console.log('📅 Fetching current list...')
    const today = new Date()
    const weekStart = getWeekStart(today)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    console.log('📆 Week range:', weekStart.toISOString().split('T')[0], 'to', weekEnd.toISOString().split('T')[0])

    let { data, error } = await supabase
      .from('lists')
      .select('*')
      .gte('week_start', weekStart.toISOString().split('T')[0])
      .lte('week_start', weekEnd.toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)

    console.log('🔎 Query result - data:', data, 'error:', error)

    if (!error && data && data.length > 0) {
      console.log('✅ Found existing list:', data[0])
      setCurrentList(data[0])
    } else if (!error && (!data || data.length === 0)) {
      console.log('➕ No list found, creating new one...')
      // No list for this week, create one
      const { data: newList, error: createError } = await supabase
        .from('lists')
        .insert([{ week_start: weekStart.toISOString().split('T')[0], total_cost: 0 }])
        .select()
        .single()

      console.log('✨ Created new list - data:', newList, 'error:', createError)

      if (!createError) {
        setCurrentList(newList)
      } else {
        console.error('❌ Error creating list:', createError)
      }
    } else {
      console.error('❌ Error fetching list:', error)
    }
  }

  const fetchLists = async () => {
    console.log('📚 Fetching all lists...')
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('week_start', { ascending: false })

    console.log('📚 All lists - data:', data, 'error:', error)

    if (!error) {
      setLists(data)
    } else {
      console.error('❌ Error fetching lists:', error)
    }
  }

  const fetchItems = async (listId) => {
    console.log('🛒 Fetching items for list:', listId)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })

    console.log('🛒 Items query - data:', data, 'error:', error)

    if (!error) {
      console.log(`✅ Setting ${data?.length || 0} items`)
      setItems(data)
    } else {
      console.error('❌ Error fetching items:', error)
    }
  }

  const handleListChange = (payload) => {
    if (payload.eventType === 'INSERT') {
      setLists(prev => [payload.new, ...prev])
    } else if (payload.eventType === 'UPDATE') {
      setLists(prev => prev.map(list => list.id === payload.new.id ? payload.new : list))
      if (currentList && currentList.id === payload.new.id) {
        setCurrentList(payload.new)
      }
    }
  }

  const handleItemChange = (payload) => {
    console.log('🔔 Item change event:', payload.eventType, payload)
    if (!currentList) {
      console.warn('⚠️ No current list, ignoring item change')
      return
    }

    if (payload.eventType === 'INSERT' && payload.new.list_id === currentList.id) {
      console.log('➕ Adding new item to state:', payload.new)
      setItems(prev => [...prev, payload.new])
    } else if (payload.eventType === 'UPDATE' && payload.new.list_id === currentList.id) {
      console.log('✏️ Updating item in state:', payload.new)
      setItems(prev => prev.map(item => item.id === payload.new.id ? payload.new : item))
    } else if (payload.eventType === 'DELETE') {
      console.log('🗑️ Removing item from state:', payload.old)
      setItems(prev => prev.filter(item => item.id !== payload.old.id))
    }
  }

  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  const addItem = async (itemName, category) => {
    console.log('➕ Adding item:', itemName, 'category:', category)
    if (!currentList || !itemName.trim()) {
      console.warn('⚠️ Cannot add item - no current list or empty name')
      return
    }

    console.log('💾 Inserting to list:', currentList.id)
    const { data, error } = await supabase
      .from('items')
      .insert([{ list_id: currentList.id, name: itemName, category, completed: false, notes: '' }])
      .select()

    console.log('➕ Insert result - data:', data, 'error:', error)

    if (error) console.error('❌ Error adding item:', error)
  }

  const toggleItem = async (itemId, completed) => {
    const { error } = await supabase
      .from('items')
      .update({ completed })
      .eq('id', itemId)

    if (error) console.error('Error toggling item:', error)
  }

  const updateItemNotes = async (itemId, notes) => {
    const { error } = await supabase
      .from('items')
      .update({ notes })
      .eq('id', itemId)

    if (error) console.error('Error updating notes:', error)
  }

  const deleteItem = async (itemId) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)

    if (error) console.error('Error deleting item:', error)
  }

  const updateTotalCost = async (cost) => {
    if (!currentList) return

    const { error } = await supabase
      .from('lists')
      .update({ total_cost: cost })
      .eq('id', currentList.id)

    if (error) console.error('Error updating cost:', error)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🛒 Shopping List</h1>
        <nav className="nav-tabs">
          <button
            className={activeView === 'current' ? 'active' : ''}
            onClick={() => setActiveView('current')}
          >
            Current Week
          </button>
          <button
            className={activeView === 'history' ? 'active' : ''}
            onClick={() => setActiveView('history')}
          >
            History
          </button>
          <button
            className={activeView === 'stats' ? 'active' : ''}
            onClick={() => setActiveView('stats')}
          >
            Statistics
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeView === 'current' && currentList && (
          <ShoppingList
            list={currentList}
            items={items}
            onAddItem={addItem}
            onToggleItem={toggleItem}
            onUpdateNotes={updateItemNotes}
            onDeleteItem={deleteItem}
            onUpdateCost={updateTotalCost}
          />
        )}
        {activeView === 'history' && (
          <History lists={lists} currentListId={currentList?.id} />
        )}
        {activeView === 'stats' && (
          <Statistics lists={lists} />
        )}
      </main>
    </div>
  )
}

export default App
