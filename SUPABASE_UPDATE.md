# Supabase Database Update - New Meal Structure

## Run this SQL to update your database:

Go to your Supabase SQL Editor and run this:

```sql
-- First, drop the old structure if it exists
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS lists CASCADE;

-- Create lists table (same as before)
CREATE TABLE lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  total_cost DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create items table with new category field
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- 'monday_dinner', 'tuesday_dinner', 'luke_lunch', 'charlie_lunch'
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_lists_week_start ON lists(week_start);
CREATE INDEX idx_items_list_id ON items(list_id);
CREATE INDEX idx_items_category ON items(category);

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

After running this, make sure to enable Real-time replication for both tables again:
- Database → Replication
- Toggle ON for `lists` and `items`
