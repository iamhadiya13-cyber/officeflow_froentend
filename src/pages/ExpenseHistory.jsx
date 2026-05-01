import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useExpenseById } from '@/hooks/useExpenses';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CheckCircle2, XCircle, History, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const ExpenseHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: expense, isLoading } = useExpenseById(id);

  if (isLoading) {
    return (
      <PageLayout title="Audit History">
        <div className="flex justify-center p-12 text-gray-500">Loading history...</div>
      </PageLayout>
    );
  }

  if (!expense) {
    return (
      <PageLayout title="Audit History">
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
          <p>Expense not found</p>
          <Button variant="secondary" onClick={() => navigate('/expenses')} className="mt-4">Back to Expenses</Button>
        </div>
      </PageLayout>
    );
  }

  const history = expense.settlementHistory || [];

  return (
    <PageLayout
      title="Settlement Audit Trail"
      subtitle="View full timeline of settlement actions for this record"
      actions={
        <Button variant="secondary" onClick={() => navigate(-1)} className="flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Record Overview Strip */}
        <div className="bg-white rounded-card shadow-sm border border-[#e5e7eb] p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{expense.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Belongs to <span className="font-medium text-gray-700">{expense.employee_name}</span> &bull; {expense.expense_type}</p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-xl font-bold text-gray-900">Rs.{expense.amount?.toLocaleString('en-IN')}</div>
              <p className="text-xs text-gray-500 mt-1">Expensed on {format(new Date(expense.expense_date), 'dd MMM yyyy')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {expense.is_settled ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                {expense.is_settled ? 'Currently Settled' : 'Currently Unsettled'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Last modified by <span className="font-medium text-gray-800">{expense.settled_by_name || 'Unknown'}</span>{' '}
                {expense.settled_at ? `on ${format(new Date(expense.settled_at), 'dd MMM yyyy, h:mm a')}` : 'with no timestamp'}
              </p>
            </div>
          </div>
        </div>

        {/* Audit Timeline Rows */}
        <div>
          <h4 className="flex items-center text-sm font-semibold text-gray-800 mb-4 px-2 tracking-wide uppercase">
            <History className="w-4 h-4 mr-2 text-gray-400" />
            Audit History Log ({history.length} records)
          </h4>

          {history.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No modifications have been recorded on this expense yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Loop backwards to show newest first if backend isn't natively reverse-sorting inside array block */}
              {[...history].reverse().map((record, index) => (
                <div key={record.id || index} className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${record.action === 'SETTLED' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {record.action === 'SETTLED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          Marked as <span className={record.action === 'SETTLED' ? 'text-green-600' : 'text-amber-600'}>{record.action === 'SETTLED' ? 'Settled' : 'Unsettled'}</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Executed by <span className="font-medium text-gray-700">{record.performed_by_name || 'System Operator'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {record.performedAt ? format(new Date(record.performedAt), 'dd MMM yyyy') : '-'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {record.performedAt ? format(new Date(record.performedAt), 'h:mm a') : '-'}
                      </p>
                    </div>
                  </div>
                  {record.note && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 font-medium tracking-wide">Note attached:</p>
                      <p className="text-sm text-gray-800 mt-1 italic">"{record.note}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
