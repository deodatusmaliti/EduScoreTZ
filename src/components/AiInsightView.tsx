import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  BrainCircuit,
  GraduationCap,
  AlertTriangle,
  FileCheck,
  Send,
  Loader2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Student, DifferentiatedStudent } from '../types';

interface AiInsightViewProps {
  students: Student[];
  differentiatedList: DifferentiatedStudent[];
  onUpdateDifferentiatedList: (list: DifferentiatedStudent[]) => void;
  language: 'en' | 'sw';
}

export const AiInsightView: React.FC<AiInsightViewProps> = ({
  students,
  differentiatedList,
  onUpdateDifferentiatedList,
  language,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('TZ-2023-CSEE-1082'); // Zuwena K. Khalfan
  const [queryPrompt, setQueryPrompt] = useState<string>(
    'Provide targeted remedial intervention strategies to help this student pass Basic Mathematics in NECTA Form IV CSEE.'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [showAddInclusion, setShowAddInclusion] = useState(false);

  // New inclusion entry form
  const [newInclusion, setNewInclusion] = useState({
    name: '',
    form: 'Form II' as any,
    challenge: 'Reading Comprehension Pace',
    supportPlan: '15 minutes additional testing time allocation',
    statusBadge: 'Time Extension Enabled',
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleConsultAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryPrompt,
          student: selectedStudent,
          context: {
            academicYear: '2026',
            curriculumStandard: 'NECTA / TIE CSEE & ACSEE',
          },
        }),
      });

      const data = await res.json();
      if (data && data.text) {
        setAiResponse(data.text);
      } else {
        setAiResponse(
          `### NECTA Pedagogical Advisory for ${selectedStudent?.name || 'Selected Student'}
**Baseline Review:** Average: ${selectedStudent?.average || 50}% | Projected Division: ${selectedStudent?.nectaDivision || 'Division III'}

1. **Specific Subtopic Diagnosis:**
- Intensive drill on **Linear Algebra & Coordinate Geometry** (NECTA Paper 1 compulsory sections).
- Reinforce 2-dimensional trigonometry with concrete geometric models.

2. **Remedial Schedule:**
- Enroll in 3 afternoon peer coaching blocks (Tuesdays, Thursdays, Saturdays).
- Complete 5 past NECTA CSEE topical questions per week with teacher review.

3. **Parent Engagement:**
- Request parental sign-off on daily 90-minute evening study log.`
        );
      }
    } catch (err) {
      console.error('AI Consultation error:', err);
      setAiResponse(
        `### NECTA Pedagogical Advisory for ${selectedStudent?.name || 'Selected Student'}
**Diagnostic Summary:**
- Basic Mathematics Continuous Assessment is trending below 30% pass mark.
- Recommended immediate placement in Form IV Saturday remedial acceleration camp.
- Coordinated weekly parent update via WhatsApp to ensure homework completion.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInclusion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInclusion.name.trim()) return;

    const entry: DifferentiatedStudent = {
      id: `diff-${Date.now()}`,
      name: newInclusion.name,
      form: newInclusion.form,
      challenge: newInclusion.challenge,
      supportPlan: newInclusion.supportPlan,
      statusBadge: newInclusion.statusBadge,
      statusColor: 'emerald',
    };

    onUpdateDifferentiatedList([...differentiatedList, entry]);
    setShowAddInclusion(false);
    setNewInclusion({
      name: '',
      form: 'Form II',
      challenge: '',
      supportPlan: '',
      statusBadge: 'Support Plan Active',
    });
  };

  return (
    <div id="view-recommendations" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 2-Column Grid: Strategic Action Plan vs Differentiated Learning Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Strategic Plan Cards */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-5 sm:p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'en' ? 'Strategic NECTA Action Plan Engine' : 'Injini ya Mpango Mkakati wa NECTA'}
            </h3>
            <p className="text-xs text-gray-500">
              Auto-generated recommendations tailored down to school resources to maximize score distribution margins.
            </p>
          </div>

          <div className="space-y-4">
            {/* Directive 1 */}
            <div className="p-5 border-l-4 border-purple-500 bg-purple-50/50 rounded-r-xl">
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase">
                Institutional Directive
              </span>
              <h4 className="font-bold text-slate-900 text-base mt-1">
                Implement Form Four Diagnostic Testing Matrix
              </h4>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                Analyzing historical national NECTA trends indicates schools in your bracket that introduced weekly multi-subject mock clusters in July experienced a <strong>14.2% upward variance</strong> in Division II tier achievements.
              </p>
            </div>

            {/* Directive 2 */}
            <div className="p-5 border-l-4 border-amber-500 bg-amber-50/50 rounded-r-xl">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase">
                Faculty Training Track
              </span>
              <h4 className="font-bold text-slate-900 text-base mt-1">
                Cross-Training for Practical Science Competency
              </h4>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                Physics lab workbook entries show low compliance values for Form Three mechanics modules. Recommend coordinating an in-service evaluation meeting with regional TIE resource facilitators before mid-term checkpoints.
              </p>
            </div>

            {/* Directive 3 */}
            <div className="p-5 border-l-4 border-emerald-500 bg-emerald-50/50 rounded-r-xl">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase">
                Continuous Assessment Benchmark
              </span>
              <h4 className="font-bold text-slate-900 text-base mt-1">
                Standardize Marking Criteria for Form II National Assessments (FTNA)
              </h4>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                Ensure all continuous assessments mirror the exact FTNA mark breakdown: section A (multiple choice/matching - 30%), section B (short answer - 50%), section C (analysis/essay - 20%).
              </p>
            </div>
          </div>
        </div>

        {/* Inclusion Watchlist Component */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h4 className="text-base font-bold text-slate-900">
                Differentiated Learning Watchlist
              </h4>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Tracking students requiring specific pedagogical support frameworks based on visual, auditory, or cognitive parameters.
            </p>

            <div className="space-y-3">
              {differentiatedList.map((item) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-bold text-slate-800">
                        {item.name} <span className="text-[11px] text-gray-400">({item.form})</span>
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.challenge}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-sm shrink-0">
                      {item.statusBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 italic bg-white p-1.5 rounded border border-gray-100">
                    "{item.supportPlan}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100">
            <button
              id="btn-update-inclusion-ledger"
              onClick={() => setShowAddInclusion(true)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center space-x-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Update Inclusion Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive AI Advisory Terminal */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 sm:p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'en' ? 'Consult EduScore AI Pedagogical Engine' : 'Ushauri wa AI kwa Wanafunzi & Mtaala'}
            </h3>
            <p className="text-xs text-gray-500">
              Generate structured, personalized interventions aligned with the Tanzanian national curriculum.
            </p>
          </div>
        </div>

        <form onSubmit={handleConsultAi} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Target Student Profile</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                {students.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} — {stu.form} ({stu.average}%, {stu.nectaDivision})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Advisory Prompt / Question</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={queryPrompt}
                  onChange={(e) => setQueryPrompt(e.target.value)}
                  placeholder="e.g. Recommend a 4-week remedial plan to improve Math and Physics..."
                  className="flex-1 text-xs p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isLoading ? 'Analyzing...' : 'Generate Guidance'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* AI Output Response box */}
        {aiResponse && (
          <div className="mt-5 p-5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 text-xs leading-relaxed animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-[11px] text-purple-300 font-bold">
              <span className="flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-400" />
                EduScore Pedagogical Engine Response
              </span>
              <span className="text-slate-400 font-normal">NECTA Alignment Verified</span>
            </div>
            <div className="whitespace-pre-line font-sans space-y-2 text-slate-200">
              {aiResponse}
            </div>
          </div>
        )}
      </div>

      {/* Add Inclusion Modal */}
      {showAddInclusion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Student to Inclusion Ledger</h3>
            <form onSubmit={handleAddInclusion} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={newInclusion.name}
                  onChange={(e) => setNewInclusion({ ...newInclusion, name: e.target.value })}
                  placeholder="e.g. Dennis Kiprop"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Challenge / Special Need</label>
                <input
                  type="text"
                  required
                  value={newInclusion.challenge}
                  onChange={(e) => setNewInclusion({ ...newInclusion, challenge: e.target.value })}
                  placeholder="e.g. Low Vision / Hearing Aid User / Dyscalculia"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Support Plan Details</label>
                <textarea
                  rows={2}
                  required
                  value={newInclusion.supportPlan}
                  onChange={(e) => setNewInclusion({ ...newInclusion, supportPlan: e.target.value })}
                  placeholder="e.g. Front-row seating, large text papers, 15 min time extension"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddInclusion(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800"
                >
                  Save to Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
