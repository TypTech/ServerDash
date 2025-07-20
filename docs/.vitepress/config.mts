import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "ServerDash",
  description: "The only dashboard you'll ever need to manage your entire server infrastructure",
  lastUpdated: true,
  cleanUrls: true,
  metaChunk: true,
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }]
  ],
  
  themeConfig: {
    logo: '/logo.png',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Installation', link: '/installation' },
      { text: 'General', link: '/general/Dashboard' },
      { text: 'Notifications', link: '/notifications/General' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/installation' }
        ]
      },
      {
        text: 'General',
        items: [
          { text: 'Dashboard', link: '/general/Dashboard' },
          { text: 'Servers', link: '/general/Servers' },
          { text: 'Applications', link: '/general/Applications' },
          { text: 'Network', link: '/general/Network' },
          { text: 'Uptime', link: '/general/Uptime' },
          { text: 'Settings', link: '/general/Settings' }
        ]
      },
      {
        text: 'Notifications',
        items: [
          { text: 'General', link: '/notifications/General' },
          { text: 'Email', link: '/notifications/Email' },
          { text: 'Discord', link: '/notifications/Discord' },
          { text: 'Telegram', link: '/notifications/Telegram' },
          { text: 'Gotify', link: '/notifications/Gotify' },
          { text: 'Ntfy', link: '/notifications/Ntfy' },
          { text: 'Pushover', link: '/notifications/Pushover' },
          { text: 'Echobell', link: '/notifications/Echobell' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/serverdash/serverdash' },
      { icon: 'buymeacoffee', link: 'https://www.buymeacoffee.com/serverdash' }
    ],
    
    footer: {
      copyright: 'Copyright © 2025-present ServerDash',
    }
  }
})
