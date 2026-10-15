import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog, DialogFooter } from '../components/ui/Dialog';
import { Input, Textarea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  Bot,
  Sparkles,
  CheckCircle2,
  CheckSquare,
  Mail,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Search,
  Zap,
  HelpCircle,
  Clock,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function ActionAgent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Interactive AI Agent Query state
  const [userQuery, setUserQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);

  // Track actioned items in current session
  const [actionedRecIds, setActionedRecIds] = useState(new Set());

  // Prefill Task Dialog state (FR-AGT-02)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentRec, setCurrentRec] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    customerId: '',
    customerName: '',
    priority: 'HIGH',
    dueDate: ''
  });
  const [taskLoading, setTaskLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const navigate = useNavigate();

  async function loadRecommendations() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getStoreRecommendations();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendations();
  }, []);

  function handleOpenPrefillTask(rec) {
    if (rec.prefillTask) {
      setCurrentRec(rec);
      setTaskForm({
        title: rec.prefillTask.title,
        description: rec.prefillTask.description,
        customerId: rec.prefillTask.customerId || '',
        customerName: rec.customerName || '',
        priority: rec.prefillTask.priority || 'HIGH',
        dueDate: rec.prefillTask.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setIsTaskModalOpen(true);
    }
  }

  async function handleConfirmTask(e) {
    e.preventDefault();
    setTaskLoading(true);
    try {
      await api.createTask({
        title: taskForm.title,
        description: taskForm.description,
        customerId: taskForm.customerId || undefined,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : undefined,
        source: 'ACTION_AGENT'
      });

      if (currentRec) {
        setActionedRecIds(prev => new Set(prev).add(currentRec.id));
      }

      setActionSuccess(`Task "${taskForm.title}" successfully created and saved in Merqanta CRM!`);
      setIsTaskModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to create task');
    } finally {
      setTaskLoading(false);
    }
  }

  async function handleAskAgent(queryText) {
    const q = queryText || userQuery;
    if (!q.trim()) return;

    try {
      setQueryLoading(true);
      setQueryError(null);
      setUserQuery(q);
      const result = await api.queryAgent(q);
      setQueryResult(result);
    } catch (err) {
      console.error('Agent query failed:', err);
      setQueryError(err.message || 'Failed to query Merqanta Action Agent');
    } finally {
      setQueryLoading(false);
    }
  }

  // Filter recommendations based on selected tab
  const allRecs = data?.recommendations || [];
  const filteredRecs = allRecs.filter(rec => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'URGENT_HIGH') return rec.priority === 'URGENT' || rec.priority === 'HIGH';
    if (categoryFilter === 'RETENTION') return rec.type === 'RETENTION_WINBACK' || rec.category === 'Retention';
    if (categoryFilter === 'VIP') return rec.type === 'VIP_APPRECIATION' || rec.category === 'VIP Club';
    if (categoryFilter === 'ONBOARDING') return rec.type === 'NEW_CUSTOMER_ONBOARDING' || rec.type === 'LOYALTY_NURTURE';
    if (categoryFilter === 'OPERATIONS') return rec.type === 'OPERATIONAL_TASK' || rec.type === 'CUSTOMER_RECOVERY';
    return true;
  });

  const summary = data?.summary || {
    totalRecommendations: allRecs.length,
    urgentCount: allRecs.filter(r => r.priority === 'URGENT').length,
    highCount: allRecs.filter(r => r.priority === 'HIGH').length,
    atRiskRevenue: 0,
    overdueTasksCount: 0
  };

  const promptSuggestions = [
    'Who are my highest-risk churn customers?',
    'Analyze VIP customers and loyalty opportunities',
    'What are our top selling products and sales volume?',
    'Check refunds and service recovery orders',
    'How is new customer onboarding?',
    'Summarize overdue tasks and operational bottlenecks'
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Merqanta Action Agent</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Evidence-grounded autonomous decision engine citing verified store & customer records (FR-AGT-01 to FR-AGT-04).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadRecommendations}
            isLoading={loading}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Analysis</span>
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <Alert variant="success" title="Action Completed">
          {actionSuccess}
        </Alert>
      )}

      {/* KPI Intelligence Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Actionable Recs</span>
            <Sparkles className="w-4 h-4 text-brand-indigo" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.totalRecommendations}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Prioritized interventions</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Urgent Attention</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{summary.urgentCount + summary.highCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{summary.urgentCount} urgent / {summary.highCount} high priority</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Guarded Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{formatCurrency(summary.atRiskRevenue)}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">At-risk inactive spend</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-indigo-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-brand-indigo" />
          </div>
          <div className="text-2xl font-bold text-indigo-950">{summary.overdueTasksCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Pending operational checks</p>
        </div>
      </div>

      {/* Interactive AI Query Console */}
      <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 overflow-hidden">
        <CardHeader className="pb-3 border-b border-indigo-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-indigo" />
              <CardTitle className="text-sm font-bold text-slate-900">
                Ask Merqanta Action Agent
              </CardTitle>
            </div>
            <span className="text-[11px] font-semibold text-brand-indigo bg-indigo-100/60 px-2.5 py-0.5 rounded-full">
              Live Database Heuristic Engine
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {/* Quick prompt pills */}
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAskAgent(prompt)}
                className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-brand-indigo border border-slate-200 hover:border-indigo-300 rounded-lg transition-all text-left shadow-2xs cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Query Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAgent();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ask any question about store customers, churn risk, order trends, or recommended actions..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-indigo shadow-xs"
              />
            </div>
            <Button
              type="submit"
              variant="indigo"
              size="sm"
              isLoading={queryLoading}
              className="text-xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze</span>
            </Button>
          </form>

          {queryError && (
            <Alert variant="destructive" title="Agent Notice">
              {queryError}
            </Alert>
          )}

          {/* Query Result Display */}
          {queryResult && (
            <div className="mt-3 p-4 bg-white border border-indigo-200 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-brand-dark">
                  {queryResult.headline}
                </h4>
                <Badge variant="indigo" className="text-[10px] shrink-0">
                  Verified Insights
                </Badge>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {queryResult.analysis}
              </p>

              {/* Verified Facts */}
              {queryResult.facts?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  {queryResult.facts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] text-slate-700 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono">{fact}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Next Actions */}
              {queryResult.suggestedActions?.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Recommended Next Steps:
                  </span>
                  <ul className="space-y-1">
                    {queryResult.suggestedActions.map((action, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-brand-indigo shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactive Quick Actions from AI Query */}
              {(queryResult.prefillTask || queryResult.prefillEmail || queryResult.relatedCustomer) && (
                <div className="pt-3 border-t border-indigo-100 flex flex-wrap items-center gap-2">
                  {queryResult.prefillTask && (
                    <Button
                      variant="indigo"
                      size="sm"
                      onClick={() => handleOpenPrefillTask({
                        customerName: queryResult.relatedCustomer?.name,
                        prefillTask: queryResult.prefillTask
                      })}
                      className="text-xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Prefill Recommended Task</span>
                    </Button>
                  )}

                  {queryResult.prefillEmail && (
                    <Link
                      to={`/communications?customerId=${queryResult.prefillEmail.customerId}&subject=${encodeURIComponent(
                        queryResult.prefillEmail.subject
                      )}&body=${encodeURIComponent(queryResult.prefillEmail.body)}&action=compose`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-brand-indigo border-indigo-200 hover:bg-indigo-50"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Draft Recommended Email</span>
                      </Button>
                    </Link>
                  )}

                  {queryResult.relatedCustomer?.id && (
                    <Link to={`/customers/${queryResult.relatedCustomer.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Customer Profile &rarr;
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bounded Capability Disclosure Banner (FR-AGT-04) */}
      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-indigo-950 space-y-1 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-brand-indigo">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Deterministic Architecture & Evidence-Grounded Reasoning (FR-AGT-01 to FR-AGT-04)</span>
        </div>
        <p className="leading-relaxed text-[11px] sm:text-xs text-slate-600">
          The Merqanta Action Agent operates on <strong>deterministic rules and verifiable store telemetry</strong>. It directly evaluates stored order frequency, spend thresholds, and customer timelines. Explicit facts from verified CRM and commerce telemetry are strictly separated from deductive inferences to eliminate hallucinations.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'ALL', label: `All Recs (${allRecs.length})` },
          { id: 'URGENT_HIGH', label: `Urgent & High (${summary.urgentCount + summary.highCount})` },
          { id: 'RETENTION', label: 'Retention Win-Back' },
          { id: 'VIP', label: 'VIP & Loyalty' },
          { id: 'ONBOARDING', label: 'Onboarding & Growth' },
          { id: 'OPERATIONS', label: 'Operations & Overdue' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === tab.id
                ? 'bg-brand-indigo text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive" title="Error">{error}</Alert>
      ) : filteredRecs.length === 0 ? (
        <Card className="p-8 text-center text-xs text-slate-500">
          No recommendations match the selected filter category at this time.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecs.map((rec) => {
            const isActioned = actionedRecIds.has(rec.id);

            return (
              <Card
                key={rec.id}
                className={`border-slate-200 overflow-hidden transition-all ${
                  isActioned
                    ? 'bg-slate-50/80 border-emerald-200 opacity-90'
                    : 'hover:shadow-md'
                }`}
              >
                <CardHeader className="bg-slate-50/70 py-3 px-5 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm sm:text-base text-slate-900">
                        {rec.title}
                      </CardTitle>

                      <Badge
                        variant={
                          rec.priority === 'URGENT'
                            ? 'danger'
                            : rec.priority === 'HIGH'
                            ? 'warning'
                            : 'primary'
                        }
                      >
                        {rec.priority}
                      </Badge>

                      {rec.category && (
                        <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                          {rec.category}
                        </span>
                      )}
                    </div>

                    {isActioned && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Task Scheduled
                      </span>
                    )}
                  </div>

                  {rec.customerName && (
                    <p className="text-xs text-slate-500 mt-1">
                      Customer:{' '}
                      <Link
                        to={`/customers/${rec.customerId}`}
                        className="text-brand-indigo font-semibold hover:underline"
                      >
                        {rec.customerName}
                      </Link>
                      {rec.customerEmail && (
                        <span className="text-slate-400 ml-1.5">({rec.customerEmail})</span>
                      )}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* 1. FACTS CITATION (FR-AGT-01) */}
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      CITED STORE & CUSTOMER EVIDENCE:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rec.facts.map((fact, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-indigo shrink-0" />
                          <span className="font-mono text-[11px]">{fact}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. DEDUCTIVE INFERENCE (FR-AGT-01) */}
                  <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs">
                    <span className="font-bold text-brand-indigo block mb-0.5">
                      DEDUCTIVE INFERENCE:
                    </span>
                    <p className="text-slate-700 leading-relaxed">{rec.inference}</p>
                  </div>

                  {/* 3. SUGGESTED ACTION & BUTTONS (FR-AGT-02, FR-AGT-03) */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100">
                    <p className="text-xs text-slate-600 font-medium">
                      {rec.suggestedAction}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      {rec.prefillTask && (
                        <Button
                          variant={isActioned ? 'outline' : 'indigo'}
                          size="sm"
                          onClick={() => handleOpenPrefillTask(rec)}
                          className="text-xs"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{isActioned ? 'Edit Task' : 'Prefill Task'}</span>
                        </Button>
                      )}

                      {rec.prefillEmail && (
                        <Link
                          to={`/communications?customerId=${rec.customerId}&subject=${encodeURIComponent(
                            rec.prefillEmail.subject
                          )}&body=${encodeURIComponent(rec.prefillEmail.body)}&action=compose`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-brand-indigo border-indigo-200 hover:bg-indigo-50"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Draft Email</span>
                          </Button>
                        </Link>
                      )}

                      {rec.link && (
                        <Link to={rec.link}>
                          <Button variant="outline" size="sm" className="text-xs">
                            Inspect &rarr;
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Prefill Task Confirmation Dialog (FR-AGT-02) */}
      <Dialog
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Confirm Prefilled Action Task"
        description="Verify and edit the task recommended by the Merqanta Action Agent before persisting to CRM."
      >
        <form onSubmit={handleConfirmTask} className="space-y-3">
          {taskForm.customerName && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-500 font-medium">Target Customer: </span>
              <span className="font-bold text-slate-900">{taskForm.customerName}</span>
            </div>
          )}

          <Input
            label="Task Title *"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />

          <Textarea
            label="Description & Context"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
            <div className="w-full">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-brand-indigo"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={taskLoading}
            >
              Save Task to Database
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
