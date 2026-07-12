import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { subscribeToExpenses, addExpense } from '../../services/expenseService';
import { Expense, ExpenseCategory } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Receipt, Plus } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

export const Expenses: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form toggle
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [category, setCategory] = useState<ExpenseCategory>('TOLL');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [referenceId, setReferenceId] = useState('');

  useEffect(() => {
    const unsub = subscribeToExpenses((data) => {
      setExpenses(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      showError('Validation Error', 'Amount must be greater than zero.');
      return;
    }

    setActionLoading(true);
    try {
      await addExpense({
        category,
        amount: amt,
        description: `${description.trim()} (Submitted by: ${userProfile?.name || 'Staff'})`,
        tripId: referenceId.trim() || undefined,
        date: new Date().toISOString(),
      });
      success('Logged', `Expense for ₹ ${amt.toLocaleString()} added successfully.`);
      setAmount('');
      setDescription('');
      setReferenceId('');
      setShowForm(false);
    } catch (err: any) {
      showError('Failed to add expense', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isFleetOrAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'FLEET_MANAGER';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track operational receipts, toll taxes, repairs, and miscellaneous costs</p>
        </div>
        {isFleetOrAdmin && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Expense Receipt
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-xl mx-auto">
          <h2 className="text-lg font-black text-gray-900 mb-4">Log Expense</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description / Notes *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NH-2 Toll Plaza payment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reference Trip / Bill ID</label>
                <input
                  type="text"
                  placeholder="e.g. TRIP-1025 or BILL-9932"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {actionLoading && <LoadingSpinner size="sm" />}
                Save Expense
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Table */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-4">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="font-bold text-gray-800">No Expense Receipts</p>
          <p className="text-xs text-gray-500 mt-1">Logged operational expenses will show here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase">
                <tr>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Reference Trip</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{exp.category}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹ {exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500">{exp.description}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{exp.tripId || '—'}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
