import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTrips, useTripDetail, useCreateTrip, useCancelTrip, useReviewTrip, useCompleteTrip } from '@/hooks/useTrips';
import { useAuthStore } from '@/store/authStore';
import { Plus, MapPin, Calendar, Plane, Eye, XCircle, CheckCircle, Ban } from 'lucide-react';
import { format } from 'date-fns';

export const Trips = () => {
  const user = useAuthStore(s => s.user);
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showReview, setShowReview] = useState(null);
  const [reviewData, setReviewData] = useState({ status: '', review_note: '' });
  const [view, setView] = useState('cards');

  const { data, isLoading } = useTrips(filters);
  const { data: tripDetail } = useTripDetail(showDetail);
  const createMutation = useCreateTrip();
  const cancelMutation = useCancelTrip();
  const reviewMutation = useReviewTrip();
  const completeMutation = useCompleteTrip();

  const [form, setForm] = useState({
    title: '', destination: '', purpose: '', departure_date: '', return_date: '',
    estimated_budget: '', itinerary: [],
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    setShowForm(false);
    setForm({ title: '', destination: '', purpose: '', departure_date: '', return_date: '', estimated_budget: '', itinerary: [] });
  };

  const handleReview = async (status) => {
    if (!showReview) return;
    await reviewMutation.mutateAsync({
      id: showReview.id,
      data: { status, review_note: reviewData.review_note },
    });
    setShowReview(null);
    setReviewData({ status: '', review_note: '' });
  };

  const getSpendRatio = (actual, estimated) => {
    if (!estimated || estimated === 0) return 0;
    return Math.round((parseFloat(actual) / parseFloat(estimated)) * 100);
  };

  return (
    <PageLayout title="Trips">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              className="w-full sm:w-auto sm:min-w-[140px]"
              value={filters.status || ''}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4" /> New Trip
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-card border border-[#e5e7eb] p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-5">
            <AnimatePresence>
              {data?.data?.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-card border border-[#e5e7eb] p-5 cursor-pointer"
                  onClick={() => setShowDetail(trip.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-gray-900">{trip.destination}</span>
                      </div>
                      <p className="text-sm text-gray-500">{trip.title}</p>
                    </div>
                    <Badge status={trip.status} />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(trip.departure_date), 'dd MMM')} - {format(new Date(trip.return_date), 'dd MMM yyyy')}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{trip.total_days} days</span>
                  </div>

                  <div className="text-sm mb-2">
                    <span className="text-gray-500">Budget:</span>{' '}
                    <span className="font-medium">Rs.{Number(trip.estimated_budget).toLocaleString('en-IN')}</span>
                    {parseFloat(trip.actual_total) > 0 && (
                      <span className="text-gray-400"> · Actual: Rs.{Number(trip.actual_total).toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  {parseFloat(trip.estimated_budget) > 0 && (
                    <ProgressBar percentage={getSpendRatio(trip.actual_total, trip.estimated_budget)} />
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#e5e7eb]">
                    <Button variant="ghost" className="!px-3 !py-1.5 text-xs w-full min-[380px]:w-auto" onClick={(e) => { e.stopPropagation(); setShowDetail(trip.id); }}>
                      View Details
                    </Button>
                    {trip.status === 'approved' && user?.role === 'EMPLOYEE' && (
                      <Button variant="ghost" className="!px-3 !py-1.5 text-xs text-primary w-full min-[380px]:w-auto">
                        Add Expense
                      </Button>
                    )}
                    {['pending', 'approved'].includes(trip.status) && trip.employee_id === user?.id && (
                      <Button variant="ghost" className="!px-3 !py-1.5 text-xs text-red-500 w-full min-[380px]:w-auto" onClick={(e) => { e.stopPropagation(); cancelMutation.mutate(trip.id); }}>
                        Cancel
                      </Button>
                    )}
                    {(user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN') && trip.status === 'pending' && (
                      <Button variant="ghost" className="!px-3 !py-1.5 text-xs w-full min-[380px]:w-auto" onClick={(e) => { e.stopPropagation(); setShowReview(trip); }}>
                        Review
                      </Button>
                    )}
                    {(user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN') && trip.status === 'approved' && (
                      <Button variant="ghost" className="!px-3 !py-1.5 text-xs text-green-600 w-full min-[380px]:w-auto" onClick={(e) => { e.stopPropagation(); completeMutation.mutate(trip.id); }}>
                        Complete
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {data?.meta && (
          <Pagination
            page={data.meta.page}
            limit={data.meta.limit}
            total={data.meta.total}
            onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
          />
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Trip Request" maxWidth="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required />
          <Input label="Destination" value={form.destination} onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))} required />
          <Textarea label="Purpose" value={form.purpose} onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Departure" type="date" value={form.departure_date} onChange={(e) => setForm(f => ({ ...f, departure_date: e.target.value }))} required />
            <Input label="Return" type="date" value={form.return_date} onChange={(e) => setForm(f => ({ ...f, return_date: e.target.value }))} required />
          </div>
          <Input label="Estimated Budget (Rs.)" type="number" value={form.estimated_budget} onChange={(e) => setForm(f => ({ ...f, estimated_budget: e.target.value }))} required />
          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)} className="w-full md:w-auto">Cancel</Button>
            <Button type="submit" loading={createMutation.isPending} className="w-full md:w-auto">Submit</Button>
          </div>
        </form>
      </Modal>

      <Drawer isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Trip Details" width="w-[560px]">
        {tripDetail && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{tripDetail.destination}</h3>
                <Badge status={tripDetail.status} />
              </div>
              <p className="text-sm text-gray-500">{tripDetail.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Departure:</span> {format(new Date(tripDetail.departure_date), 'dd MMM yyyy')}</div>
              <div><span className="text-gray-500">Return:</span> {format(new Date(tripDetail.return_date), 'dd MMM yyyy')}</div>
              <div><span className="text-gray-500">Days:</span> {tripDetail.total_days}</div>
              <div><span className="text-gray-500">Employee:</span> {tripDetail.employee_name}</div>
            </div>

            <div className="bg-[#f8f8f8] rounded-btn p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimated Budget</span>
                <span className="font-medium">Rs.{Number(tripDetail.estimated_budget).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Actual Total</span>
                <span className="font-medium">Rs.{Number(tripDetail.actual_total).toLocaleString('en-IN')}</span>
              </div>
              <ProgressBar percentage={getSpendRatio(tripDetail.actual_total, tripDetail.estimated_budget)} />
            </div>

            <div><span className="text-sm text-gray-500">Purpose:</span><p className="text-sm mt-1">{tripDetail.purpose}</p></div>

            {tripDetail.review_note && (
              <div className="bg-red-50 rounded-btn p-3">
                <p className="text-xs text-gray-500 mb-1">Review Note ({tripDetail.reviewer_name})</p>
                <p className="text-sm">{tripDetail.review_note}</p>
              </div>
            )}

            {tripDetail.itinerary?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Itinerary</h4>
                <div className="space-y-3">
                  {tripDetail.itinerary.map((day, idx) => (
                    <motion.div
                      key={day.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.06, duration: 0.35 }}
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                          D{day.day_number}
                        </div>
                        {idx < tripDetail.itinerary.length - 1 && <div className="w-px h-full bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs text-gray-400">{format(new Date(day.date), 'dd MMM yyyy')}</p>
                        <p className="text-sm">{day.activities}</p>
                        {day.notes && <p className="text-xs text-gray-500 mt-1">{day.notes}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {tripDetail.expenses?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Linked Expenses</h4>
                <div className="space-y-2">
                  {tripDetail.expenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between bg-[#f8f8f8] rounded-btn p-3 text-sm">
                      <div>
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-xs text-gray-500">{exp.category_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs.{Number(exp.amount).toLocaleString('en-IN')}</p>
                        <Badge status={exp.status} />
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm font-semibold pt-2 border-t border-[#e5e7eb]">
                    Total claimed: Rs.{tripDetail.expenses.reduce((s, e) => s + parseFloat(e.amount), 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Drawer isOpen={!!showReview} onClose={() => setShowReview(null)} title="Review Trip">
        {showReview && (
          <div className="space-y-4">
            <div className="space-y-2 pb-4 border-b border-[#e5e7eb]">
              <p className="text-sm"><span className="text-gray-500">Title:</span> {showReview.title}</p>
              <p className="text-sm"><span className="text-gray-500">Destination:</span> {showReview.destination}</p>
              <p className="text-sm"><span className="text-gray-500">Employee:</span> {showReview.employee_name}</p>
              <p className="text-sm"><span className="text-gray-500">Dates:</span> {format(new Date(showReview.departure_date), 'dd MMM')} - {format(new Date(showReview.return_date), 'dd MMM yyyy')}</p>
              <p className="text-sm"><span className="text-gray-500">Budget:</span> Rs.{Number(showReview.estimated_budget).toLocaleString('en-IN')}</p>
            </div>
            <Textarea
              label="Review Note (required)"
              value={reviewData.review_note}
              onChange={(e) => setReviewData(d => ({ ...d, review_note: e.target.value }))}
              required
            />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => handleReview('rejected')} className="flex-1 !text-red-600 !border-red-200" disabled={!reviewData.review_note}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
              <Button onClick={() => handleReview('approved')} className="flex-1" disabled={!reviewData.review_note}>
                <CheckCircle className="w-4 h-4" /> Approve
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </PageLayout>
  );
};
