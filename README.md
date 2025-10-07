# Shopping List App

A real-time shopping list app built with React and Supabase for tracking weekly shopping trips.

## Features

- ✅ **Real-time collaboration** - See updates instantly when either person adds or checks off items
- 📝 **Add notes to items** - Keep track of brands, sizes, or other details
- 💰 **Track costs** - Record the total cost at the end of each week
- 📊 **Statistics** - View spending trends and most purchased items
- 📅 **History** - Browse past weeks' shopping lists

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to set up your database tables
   - Your `.env.local` is already configured with your Supabase credentials

3. **Run the app**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to the URL shown in the terminal (usually http://localhost:5173)
   - Share this URL with your girlfriend when on the same network, or deploy to access remotely

## How to Use

### Current Week
- Add items using the input field
- Check items off as you pick them up while shopping
- Click the note icon (📝) to add details to any item
- Click the delete icon (🗑️) to remove items
- Add the total cost at the end of your shopping trip

### History
- View all previous weeks' shopping lists
- Click on any week to see what you bought and how much you spent

### Statistics
- See your total spending across all weeks
- View average weekly spend
- Check which items you buy most frequently

## Tech Stack

- **React** - Frontend framework
- **Vite** - Build tool
- **Supabase** - Backend database and real-time subscriptions
- **CSS** - Custom styling

## Deployment

To deploy this app so you can both access it from anywhere:

1. **Vercel** (recommended):
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**:
   - Connect your git repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables from `.env.local`

Make sure to add your environment variables to the deployment platform!
