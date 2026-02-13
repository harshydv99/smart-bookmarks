import './globals.css'

export const metadata = {
  title: 'Smart Bookmarks - Save & Sync Your Bookmarks',
  description: 'A real-time bookmark manager with Google OAuth, powered by Supabase.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}