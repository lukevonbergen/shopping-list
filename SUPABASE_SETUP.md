# Supabase Database Setup

## Steps to configure your Supabase database:

### 1. Create the Tables

Go to your Supabase project dashboard and run these SQL commands in the SQL Editor:

```sql
-- Create lists table
CREATE TABLE lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create items table
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_lists_week_start ON lists(week_start);
CREATE INDEX idx_items_list_id ON items(list_id);
```

### 2. Enable Row Level Security (RLS)

Since you don't need authentication, we'll create policies that allow public access:

```sql
-- Enable RLS on both tables
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policies for lists table (allow all operations)
CREATE POLICY "Allow all operations on lists" ON lists
  FOR ALL USING (true) WITH CHECK (true);

-- Create policies for items table (allow all operations)
CREATE POLICY "Allow all operations on items" ON items
  FOR ALL USING (true) WITH CHECK (true);
```

### 3. Enable Realtime

1. Go to Database → Replication in your Supabase dashboard
2. Enable replication for both `lists` and `items` tables
3. This allows real-time updates when you or your girlfriend add/edit items

### 4. Verify Setup

Your `.env.local` file is already configured with:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## That's it!

Once you've run these SQL commands and enabled realtime, you're ready to start the app with:

```bash
npm run dev
```

## Database Schema Overview

**lists** table:
- `id` - Unique identifier for each week's list
- `week_start` - Monday of the week (automatically set)
- `total_cost` - Total cost of the shopping for that week
- `created_at` - When the list was created

**items** table:
- `id` - Unique identifier for each item
- `list_id` - Links to the week's list
- `name` - Item name (e.g., "Milk", "Bread")
- `completed` - Whether the item has been checked off
- `notes` - Optional notes for the item
- `created_at` - When the item was added
