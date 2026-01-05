import './globals.css'

export const metadata = {
  title: 'Fishing Poles Dashboard',
  description: 'Track revenue across multiple businesses and profit centers',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
