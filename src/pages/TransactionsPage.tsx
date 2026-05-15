import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import './TransactionsPage.css'

type Account = {
  id: string
  name: string
}

type Transaction = {
  id: string
  amount: number
  category: string
  description: string
  transaction_date: string
  account_id: string
  accounts: { name: string } | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export default function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txType, setTxType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    const [{ data: accs }, { data: txs }] = await Promise.all([
      supabase.from('accounts').select('id, name').eq('user_id', user.id).eq('is_active', true),
      supabase.from('transactions')
        .select(`
          id, amount, category, description, transaction_date, account_id,
          accounts ( name )
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
    ])
    
    if (accs) {
      setAccounts(accs)
      if (accs.length > 0 && !accountId) setAccountId(accs[0].id)
    }
    // Type casting because the join returns a slightly complex type structure
    if (txs) setTransactions(txs as unknown as Transaction[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !amount || !accountId) return
    
    setIsSubmitting(true)
    setError(null)

    // Ensure amount is parsed correctly based on type
    const rawAmount = parseFloat(amount)
    const finalAmount = txType === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount)

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: accountId,
      amount: finalAmount,
      transaction_date: date,
      description: description || 'Unnamed Transaction',
      category: category || 'Uncategorized',
      type: txType === 'income' ? 'Income' : 'Expense'
    })

    if (insertError) {
      setError(insertError.message)
      setIsSubmitting(false)
    } else {
      // Reset form and refresh list
      setAmount('')
      setDescription('')
      setCategory('')
      setIsAdding(false)
      setIsSubmitting(false)
      fetchData()
    }
  }

  if (loading && transactions.length === 0) {
    return (
      <>
        <Navbar />
        <div className="auth-loading"><div className="auth-loading-spinner" /></div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="transactions-page">
        
        <header className="tx-header">
          <h1 className="tx-title">Transactions</h1>
          <button 
            className="tx-add-btn"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? 'Cancel' : '+ Add Transaction'}
          </button>
        </header>

        {isAdding && (
          <form className="tx-form-card" onSubmit={handleSubmit}>
            <div className="tx-form-grid">
              
              <div className="tx-form-group">
                <label className="tx-form-label">Type</label>
                <div className="tx-type-toggle">
                  <button 
                    type="button" 
                    className={`type-btn expense ${txType === 'expense' ? 'active' : ''}`}
                    onClick={() => setTxType('expense')}
                  >
                    Expense
                  </button>
                  <button 
                    type="button" 
                    className={`type-btn income ${txType === 'income' ? 'active' : ''}`}
                    onClick={() => setTxType('income')}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div className="tx-form-group">
                <label className="tx-form-label">Amount</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  required
                  className="tx-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="tx-form-group">
                <label className="tx-form-label">Date</label>
                <input 
                  type="date" 
                  required
                  className="tx-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="tx-form-group">
                <label className="tx-form-label">Account</label>
                <select 
                  className="tx-input" 
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  <option value="" disabled>Select an account...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div className="tx-form-group">
                <label className="tx-form-label">Description</label>
                <input 
                  type="text" 
                  required
                  className="tx-input"
                  placeholder="e.g. Whole Foods"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="tx-form-group">
                <label className="tx-form-label">Category</label>
                <input 
                  type="text" 
                  className="tx-input"
                  placeholder="e.g. Groceries"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

            </div>

            {error && <div className="form-message form-message--error" style={{marginBottom: '16px'}}>{error}</div>}

            <div className="tx-form-actions">
              <button type="button" className="btn-cancel" onClick={() => setIsAdding(false)}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={isSubmitting || accounts.length === 0}>
                {isSubmitting ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
            
            {accounts.length === 0 && (
              <p style={{fontSize: '13px', color: '#ef4444', marginTop: '12px'}}>
                You need to create an Account in Settings before you can add transactions.
              </p>
            )}
          </form>
        )}

        <div className="tx-list-card">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th style={{textAlign: 'right'}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">No transactions found. Add one above!</div>
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="td-date">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                    <td className="td-desc">{tx.description}</td>
                    <td className="td-cat">{tx.category}</td>
                    <td>
                      <span className="td-account">
                        {tx.accounts?.name || 'Unknown Account'}
                      </span>
                    </td>
                    <td className={`td-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                      {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </>
  )
}
