'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getData() {
      const { data, error } = await supabase
        .from('garmin_stats')
        .select('*')
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching data:', error)
      } else {
        setStats(data || [])
      }
      setLoading(false)
    }
    getData()
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-lime-400">My Garmin Dashboard</h1>
        <p className="text-slate-400 mb-6">Connected live to Supabase (`garmin_stats`)</p>

        {loading ? (
          <p className="text-slate-400">Loading your Garmin data...</p>
        ) : stats.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <p className="text-yellow-400 font-semibold mb-2">No rows found in `garmin_stats` yet.</p>
            <p className="text-sm text-slate-300">Run your Python script (`python garmin_pull.py`) to upload your data!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {stats.map((row, index) => (
              <div key={index} className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lime-400 font-semibold">Date: {row.date ?? 'Unknown'}</span>
                  <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">Garmin Sync</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">Resting HR</p>
                    <p className="text-lg font-bold">{row.resting_hr ?? '—'} bpm</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">HRV Avg</p>
                    <p className="text-lg font-bold">{row.hrv_avg ?? '—'}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">Sleep Score</p>
                    <p className="text-lg font-bold">{row.sleep_score ?? '—'}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">Training Readiness</p>
                    <p className="text-lg font-bold text-lime-400">{row.training_readiness ?? '—'}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">Endurance Score</p>
                    <p className="text-lg font-bold text-cyan-400">{row.endurance_score ?? '—'}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg">
                    <p className="text-xs text-slate-400">Weight</p>
                    <p className="text-lg font-bold">{row.weight_kg ? `${row.weight_kg} kg` : '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}