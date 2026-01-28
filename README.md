# Product Mirror Web

Dashboard to view captured screenshots of SaaS products.

## What it does

1. Pulls routes and products from Supabase database
2. Displays the most recent screenshot for each route
3. Shows product name and route name for each capture

## Setup

1. Install dependencies:
```
   npm install
```

2. Create a `.env.local` file with:
```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

## Run
```
npm run dev
```

Then open http://localhost:3000 in your browser.