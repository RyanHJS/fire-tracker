import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import './DashboardPage.css'

// ── Types ──────────────────────────────────────────────────
type UserProfile = {
  name: string | null
  fire_goal: 'lean' | 'fat' | 'barista' | 'coast' | null
  annual_expenses: number
  annual_part_time_income: number
}

type Account = {
  id: string
  name: string | null
  type: string
  current_balance: number
}

type Transaction = {
  id: string
  amount: number
  category: string | null
  description: string | null
  transaction_date: string
}

// ── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function calcFireNumber(profile: UserProfile): number | null {
  const { fire_goal, annual_expenses, annual_part_time_income } = profile
  if (!annual_expenses) return null
  switch (fire_goal) {
    case 'lean':    return annual_expenses * 25
    case 'fat':     return annual_expenses * 33
    case 'barista': return (annual_expenses - annual_part_time_income) * 25
    default:        return annual_expenses * 25
  }
}

function timeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

function shortDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const GOAL_LABELS: Record<string, string> = {
  lean: 'Lean FIRE', fat: 'Fat FIRE', barista: 'Barista FIRE', coast: 'Coast FIRE',
}

// ── Component ──────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile]           = useState<UserProfile | null>(null)
  const [accounts, setAccounts]         = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchData() {
      const [{ data: p }, { data: a }, { data: t }] = await Promise.all([
        supabase.from('users')
          .select('name, fire_goal, annual_expenses, annual_part_time_income')
          .eq('id', user!.id).single(),
        supabase.from('accounts')
          .select('id, name, type, current_balance')
          .eq('user_id', user!.id).eq('is_active', true)
          .order('current_balance', { ascending: false }),
        supabase.from('transactions')
          .select('id, amount, category, description, transaction_date')
          .eq('user_id', user!.id)
          .order('transaction_date', { ascending: false }).limit(5),
      ])
      if (p) setProfile(p)
      if (a) setAccounts(a)
      if (t) setTransactions(t)
      setLoading(false)
    }
    fetchData()
  }, [user])

  // Derived numbers
  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0)
  const fireNumber   = profile ? calcFireNumber(profile) : null
  const progress     = fireNumber && fireNumber > 0
    ? Math.min((totalBalance / fireNumber) * 100, 100) : null
  const monthsCovered = profile?.annual_expenses
    ? (totalBalance / (profile.annual_expenses / 12)).toFixed(1) : null

  if (loading) return (
    <>
      <Navbar />
      <div className="dashboard-loading"><div className="auth-loading-spinner" /></div>
    </>
  )

  return (
    <>
      <Navbar />
      <main className="dashboard">

        {/* ── Greeting ── */}
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">
              Good {timeOfDay()}, {profile?.name ?? user?.email?.split('@')[0]} 👋
            </h1>
            {profile?.fire_goal
              ? <span className="fire-badge">{GOAL_LABELS[profile.fire_goal]}</span>
              : <span className="fire-badge fire-badge--empty">No FIRE goal — set one in Settings</span>
            }
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Portfolio</span>
            <span className="stat-value">{fmt(totalBalance)}</span>
            <span className="stat-sub">{accounts.length} active account{accounts.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">FIRE Number</span>
            <span className="stat-value">{fireNumber ? fmt(fireNumber) : '—'}</span>
            <span className="stat-sub">{fireNumber ? 'Your target nest egg' : 'Set expenses in Settings'}</span>
          </div>

          <div className="stat-card stat-card--highlight">
            <span className="stat-label">Progress to FIRE</span>
            <span className="stat-value">{progress !== null ? `${progress.toFixed(1)}%` : '—'}</span>
            <span className="stat-sub">
              {monthsCovered ? `${monthsCovered} months of expenses covered` : 'Set a FIRE goal in Settings'}
            </span>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        {progress !== null && (
          <div className="progress-section">
            <div className="progress-meta">
              <span>Progress to FIRE</span>
              <span>{fmt(totalBalance)} of {fmt(fireNumber!)}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ── Bottom Grid ── */}
        <div className="dash-grid">
          {/* Accounts */}
          <div className="dash-card">
            <h2 className="card-title">Accounts</h2>
            {accounts.length === 0
              ? <p className="card-empty">No accounts yet — add one in Settings.</p>
              : (
                <ul className="account-list">
                  {accounts.map(acc => (
                    <li key={acc.id} className="account-item">
                      <div>
                        <span className="account-name">{acc.name ?? acc.type}</span>
                        <span className="account-type">{acc.type}</span>
                      </div>
                      <span className={`account-balance ${acc.current_balance < 0 ? 'negative' : ''}`}>
                        {fmt(acc.current_balance)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
          </div>

          {/* Recent Transactions */}
          <div className="dash-card">
            <h2 className="card-title">Recent Transactions</h2>
            {transactions.length === 0
              ? <p className="card-empty">No transactions yet.</p>
              : (
                <ul className="tx-list">
                  {transactions.map(tx => (
                    <li key={tx.id} className="tx-item">
                      <div>
                        <span className="tx-desc">{tx.description ?? tx.category ?? 'Transaction'}</span>
                        <span className="tx-date">{shortDate(tx.transaction_date)}</span>
                      </div>
                      <span className={`tx-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                        {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </div>

      </main>
    </>
  )
}
