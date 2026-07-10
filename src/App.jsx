import { useState } from 'react'
import { useAppData } from './store.js'
import TabBar from './components/TabBar.jsx'
import Today from './views/Today.jsx'
import History from './views/History.jsx'
import Plans from './views/Plans.jsx'
import Profile from './views/Profile.jsx'

export default function App() {
  const [data, setData] = useAppData()
  const [tab, setTab] = useState('today')

  return (
    <>
      {tab === 'today' && <Today data={data} setData={setData} />}
      {tab === 'history' && <History data={data} setData={setData} />}
      {tab === 'plans' && <Plans data={data} setData={setData} />}
      {tab === 'profile' && <Profile data={data} setData={setData} />}
      <TabBar
        tab={tab}
        onChange={(t) => {
          setTab(t)
          window.scrollTo(0, 0)
        }}
      />
    </>
  )
}
