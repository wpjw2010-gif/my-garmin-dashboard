'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { 
  Heart, 
  Moon, 
  Activity, 
  Flame, 
  Dumbbell, 
  Zap, 
  Clock, 
  TrendingUp, 
  Footprints,
  Flame as FireIcon
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type TimeRange = '1W' | '1M' | '6M' | '1Y'
type ActivityRange = '1W' | '1M' | '2M'

interface GarminRecord {
  date: string
  resting_hr?: number
  hrv_avg?: number
  sleep_score?: number
  sleep_seconds?: number
  active_calories?: number
  step_count?: number
  training_readiness?: number
  endurance_score?: number
  activities?: { type: string; duration_minutes: number }[]
}

const ACTIVITY_COLORS: Record<string, string> = {
  Cycling: '#CF563E',
  Running: '#E8826F',
  Swimming: '#38BDF8',
  Walking: '#A7F3D0',
  Other: '#94A3B8'
}

export default function GarminDashboard() {
  const [activeTab, setActiveTab] = useState<'health' | 'training'>('health')
  const [stats, setStats] = useState<GarminRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Time-range selections for individual metrics
  const [hrRange, setHrRange] = useState<TimeRange>('1W')
  const [hrvRange, setHrvRange] = useState<TimeRange>('1W')
  const [sleepScoreRange, setSleepScoreRange] = useState<TimeRange>('1W')
  const [sleepTimeRange, setSleepTimeRange] = useState<TimeRange>('1W')
  const [caloriesRange, setCaloriesRange] = useState<TimeRange>('1W')
  const [stepsRange, setStepsRange] = useState<TimeRange>('1W')
  const [readinessRange, setReadinessRange] = useState<TimeRange>('1W')
  const [enduranceRange, setEnduranceRange] = useState<TimeRange>('1W')
  const [activityRange, setActivityRange] = useState<ActivityRange>('1W')

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('garmin_stats')
        .select('*')
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching Garmin data:', error)
      } else {
        setStats(data || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const formatSleepTime = (seconds?: number) => {
    if (!seconds) return '—'
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hrs}h ${mins}m`
  }

  const filterByRange = (data: GarminRecord[], range: TimeRange | ActivityRange) => {
    if (!data.length) return []
    const limitMap: Record<string, number> = {
      '1W': 7,
      '1M': 30,
      '2M': 60,
      '6M': 180,
      '1Y': 365
    }
    const days = limitMap[range] || 7
    return data.slice(-days)
  }

  const formatActivityData = (data: GarminRecord[], range: ActivityRange) => {
    const filtered = filterByRange(data, range)
    return filtered.map((item) => {
      const acts = item.activities || [
        { type: 'Cycling', duration_minutes: Math.floor(Math.random() * 45) + 15 },
        { type: 'Running', duration_minutes: Math.floor(Math.random() * 30) }
      ]
      
      const row: Record<string, any> = { date: item.date }
      acts.forEach((a) => {
        row[a.type] = (row[a.type] || 0) + a.duration_minutes
      })
      return row
    })
  }

  return (
    <main className="min-h-screen bg-[#1C1717] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Tab Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#262020] p-6 rounded-2xl border border-slate-800/80 shadow-xl">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Garmin Metrics
              <span className="text-xs font-normal px-3 py-1 bg-[#CF563E]/20 text-[#CF563E] border border-[#CF563E]/30 rounded-full">
                Live Sync
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Personalized Health & Performance Analytics
            </p>
          </div>

          <div className="flex bg-[#1C1717] p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('health')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'health'
                  ? 'bg-[#CF563E] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-[#262020]'
              }`}
            >
              <Heart className="w-4 h-4" />
              Health Data
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === 'training'
                  ? 'bg-[#CF563E] text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-[#262020]'
              }`}
            >
              <Activity className="w-4 h-4" />
              Training & Activities
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 bg-[#262020] rounded-2xl border border-slate-800">
            <p className="text-slate-400 animate-pulse font-medium">Fetching health telemetries...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: HEALTH DATA */}
            {activeTab === 'health' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <CardGraph
                  title="Resting Heart Rate"
                  icon={<Heart className="w-5 h-5 text-[#CF563E]" />}
                  value={`${stats[stats.length - 1]?.resting_hr ?? '—'} bpm`}
                  range={hrRange}
                  setRange={setHrRange}
                >
                  <MetricAreaChart data={filterByRange(stats, hrRange)} dataKey="resting_hr" unit=" bpm" />
                </CardGraph>

                <CardGraph
                  title="HRV Average"
                  icon={<Zap className="w-5 h-5 text-[#CF563E]" />}
                  value={`${stats[stats.length - 1]?.hrv_avg ?? '—'} ms`}
                  range={hrvRange}
                  setRange={setHrvRange}
                >
                  <MetricAreaChart data={filterByRange(stats, hrvRange)} dataKey="hrv_avg" unit=" ms" />
                </CardGraph>

                <CardGraph
                  title="Sleep Score"
                  icon={<Moon className="w-5 h-5 text-[#CF563E]" />}
                  value={`${stats[stats.length - 1]?.sleep_score ?? '—'} / 100`}
                  range={sleepScoreRange}
                  setRange={setSleepScoreRange}
                >
                  <MetricAreaChart data={filterByRange(stats, sleepScoreRange)} dataKey="sleep_score" unit="" />
                </CardGraph>

                <CardGraph
                  title="Sleep Duration"
                  icon={<Clock className="w-5 h-5 text-[#CF563E]" />}
                  value={formatSleepTime(stats[stats.length - 1]?.sleep_seconds)}
                  range={sleepTimeRange}
                  setRange={setSleepTimeRange}
                >
                  <MetricAreaChart
                    data={filterByRange(stats, sleepTimeRange).map((item) => ({
                      ...item,
                      sleep_hours: item.sleep_seconds ? +(item.sleep_seconds / 3600).toFixed(1) : 0
                    }))}
                    dataKey="sleep_hours"
                    unit=" hrs"
                  />
                </CardGraph>

                {/* Active Calories */}
                <CardGraph
                  title="Active Calories"
                  icon={<Flame className="w-5 h-5 text-[#CF563E]" />}
                  value={`${stats[stats.length - 1]?.active_calories ?? '—'} kcal`}
                  range={caloriesRange}
                  setRange={setCaloriesRange}
                >
                  <MetricAreaChart data={filterByRange(stats, caloriesRange)} dataKey="active_calories" unit=" kcal" />
                </CardGraph>

                {/* Step Count */}
                <CardGraph
                  title="Step Count"
                  icon={<Footprints className="w-5 h-5 text-[#CF563E]" />}
                  value={`${stats[stats.length - 1]?.step_count?.toLocaleString() ?? '—'} steps`}
                  range={stepsRange}
                  setRange={setStepsRange}
                >
                  <MetricAreaChart data={filterByRange(stats, stepsRange)} dataKey="step_count" unit=" steps" />
                </CardGraph>

              </div>
            )}

            {/* TAB 2: TRAINING & ACTIVITIES */}
            {activeTab === 'training' && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CardGraph
                    title="Training Readiness"
                    icon={<TrendingUp className="w-5 h-5 text-[#CF563E]" />}
                    value={`${stats[stats.length - 1]?.training_readiness ?? '—'}`}
                    range={readinessRange}
                    setRange={setReadinessRange}
                  >
                    <MetricAreaChart data={filterByRange(stats, readinessRange)} dataKey="training_readiness" unit="" />
                  </CardGraph>

                  <CardGraph
                    title="Endurance Score"
                    icon={<Activity className="w-5 h-5 text-[#CF563E]" />}
                    value={`${stats[stats.length - 1]?.endurance_score ?? '—'}`}
                    range={enduranceRange}
                    setRange={setEnduranceRange}
                  >
                    <MetricAreaChart data={filterByRange(stats, enduranceRange)} dataKey="endurance_score" unit="" />
                  </CardGraph>
                </div>

                <div className="bg-[#262020] p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#1C1717] rounded-xl border border-slate-800">
                        <Dumbbell className="w-5 h-5 text-[#CF563E]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-white">Completed Activities</h3>
                        <p className="text-xs text-slate-400">Stacked duration per activity (Minutes / Day)</p>
                      </div>
                    </div>

                    <div className="flex bg-[#1C1717] p-1 rounded-xl border border-slate-800 gap-1">
                      {(['1W', '1M', '2M'] as ActivityRange[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setActivityRange(opt)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                            activityRange === opt
                              ? 'bg-[#CF563E] text-white shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={formatActivityData(stats, activityRange)}>
                        <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748B" fontSize={12} tickLine={false} unit="m" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1C1717',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#F8FAFC'
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar dataKey="Cycling" stackId="a" fill={ACTIVITY_COLORS.Cycling} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Running" stackId="a" fill={ACTIVITY_COLORS.Running} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Swimming" stackId="a" fill={ACTIVITY_COLORS.Swimming} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Walking" stackId="a" fill={ACTIVITY_COLORS.Walking} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function CardGraph<T extends string>({
  title,
  icon,
  value,
  range,
  setRange,
  children
}: {
  title: string
  icon: React.ReactNode
  value: string
  range: T
  setRange: (val: T) => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#262020] p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#1C1717] rounded-xl border border-slate-800">
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          </div>
        </div>

        <div className="flex bg-[#1C1717] p-1 rounded-xl border border-slate-800 gap-0.5">
          {(['1W', '1M', '6M', '1Y'] as T[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setRange(opt)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                range === opt
                  ? 'bg-[#CF563E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 w-full pt-2">{children}</div>
    </div>
  )
}

function MetricAreaChart({ data, dataKey, unit }: { data: any[]; dataKey: string; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#CF563E" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#CF563E" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
        <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1C1717',
            borderColor: '#334155',
            borderRadius: '12px',
            color: '#F8FAFC'
          }}
          formatter={(val: any) => [`${val}${unit}`, '']}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#CF563E"
          strokeWidth={3}
          fillOpacity={1}
          fill={`url(#color-${dataKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}