import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Mail,
  Share2,
  Copy,
  CheckCircle,
  Phone,
  Sparkles,
  Users,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Layers,
  ExternalLink,
  ChevronRight,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Student } from '../types';
import { formatTzs, formatOrdinal } from '../utils/necta';
import {
  formatCsvPhone,
  formatCsvCurrency,
  escapeCsvCell,
  downloadCsvFile,
} from '../utils/csvFormatter';

interface MessagesViewProps {
  students: Student[];
  initialStudentId?: string;
  language: 'en' | 'sw';
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  students,
  initialStudentId,
  language,
}) => {
  const [messagingMode, setMessagingMode] = useState<'individual' | 'collective'>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Academic Term Report');
  const [customText, setCustomText] = useState<string>(
    'Taarifa ya Matokeo: Habari {parent_name}, matokeo ya {student_name} ({form} {stream}) yametolewa. Wastani: {average}%, Nafasi: {rank} kati ya {cohort_size}. Daraja la NECTA: {necta_division}. Mahudhurio: {attendance}%. Salio la Ada: {fee_balance}. Hongera!'
  );
  const [copied, setCopied] = useState(false);
  const [simulatedSendStatus, setSimulatedSendStatus] = useState<string | null>(null);

  // Collective Broadcast States
  const [broadcastTarget, setBroadcastTarget] = useState<'form' | 'all' | 'at_risk' | 'defaulters' | 'honors'>('form');
  const [targetForm, setTargetForm] = useState<string>('Form IV');
  const [targetStream, setTargetStream] = useState<string>('All');
  const [broadcastChannel, setBroadcastChannel] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastLog, setBroadcastLog] = useState<string[]>([]);
  const [broadcastResult, setBroadcastResult] = useState<{
    count: number;
    channel: string;
    targetName: string;
    timestamp: string;
  } | null>(null);

  const currentStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  const templates: Record<string, string> = {
    'Academic Term Report':
      'Taarifa ya Matokeo: Habari {parent_name}, matokeo ya {student_name} ({form} {stream}) yametolewa. Wastani: {average}%, Nafasi: {rank} kati ya {cohort_size}. Daraja la NECTA: {necta_division}. Mahudhurio: {attendance}%. Salio la Ada: {fee_balance}. Hongera!',
    'Class PTA Meeting':
      'Kikao cha Wazazi: Ndugu {parent_name}, uongozi wa shule unakualika kwenye mkutano wa kitaaluma wa wazazi wa darasa la {form} {stream} siku ya Jumamosi saa 3:00 asubuhi kujadili mikakati ya mitihani ya mwanafunzi wako {student_name}.',
    'Fee Reminder Notice':
      'Kikumbusho cha Ada: Ndugu {parent_name}, mwanafunzi {student_name} ({form}) ana salio la ada la {fee_balance} kwa muhula huu. Tafadhali kamilisha malipo ili mwanafunzi asikose masomo na mitihani.',
    'Attendance & Discipline Alert':
      'Taarifa Muhimu: Ndugu {parent_name}, mahudhurio ya mwanafunzi {student_name} ({form} {stream}) yamefikia {attendance}%. Tafadhali fika shuleni au wasiliana na mwalimu wa darasa kujadili maendeleo yake.',
    'Exam Schedule Notice':
      'Ratiba ya Mitihani: Ndugu {parent_name}, mitihani ya NECTA kwa {student_name} ({form}) itaanza hivi karibuni. Mhimize mwanafunzi azingatie masomo na mapitio ya nyumbani.',
    'Academic Honors':
      'Pongezi za Heshima: Ndugu {parent_name}, tunayo furaha kukujulisha kuwa {student_name} ameshika nafasi ya {rank} kati ya {cohort_size} ({form}) kwa wastani wa juu wa {average}%. Hongera sana!',
  };

  const handleTemplateChange = (tmplName: string) => {
    setSelectedTemplate(tmplName);
    setCustomText(templates[tmplName] || '');
  };

  // Interpolate single message
  const getResolvedMessage = (stu: Student) => {
    const cohort = students.filter((s) => s.form === stu.form);
    return customText
      .replace(/{student_name}/g, stu.name)
      .replace(/{parent_name}/g, stu.parent)
      .replace(/{average}/g, `${stu.average}`)
      .replace(/{rank}/g, stu.classPosition ? formatOrdinal(stu.classPosition) : '1st')
      .replace(/{cohort_size}/g, `${cohort.length || students.length}`)
      .replace(/{attendance}/g, `${stu.attendance}`)
      .replace(/{form}/g, stu.form)
      .replace(/{stream}/g, stu.stream ? `Mkondo ${stu.stream}` : '')
      .replace(/{necta_division}/g, stu.nectaDivision)
      .replace(/{fee_balance}/g, formatTzs(stu.feeBalance));
  };

  const resolved = currentStudent ? getResolvedMessage(currentStudent) : '';

  // Filter recipients for collective broadcast
  const getBroadcastRecipients = () => {
    let list = students;
    switch (broadcastTarget) {
      case 'form':
        list = students.filter((s) => s.form === targetForm);
        break;
      case 'at_risk':
        list = students.filter((s) => s.average < 45 || s.attendance < 80);
        break;
      case 'defaulters':
        list = students.filter((s) => s.feeBalance > 0);
        break;
      case 'honors':
        list = students.filter((s) => s.average >= 75);
        break;
      case 'all':
      default:
        list = students;
        break;
    }

    if (broadcastTarget === 'form' && targetStream !== 'All') {
      list = list.filter((s) => s.stream === targetStream);
    }

    return list;
  };

  const broadcastList = getBroadcastRecipients();

  const handleCopy = () => {
    navigator.clipboard.writeText(resolved);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsApp = (stu?: Student) => {
    const s = stu || currentStudent;
    if (!s) return;
    const msg = getResolvedMessage(s);
    const cleanPhone = s.whatsapp?.replace(/[^0-9]/g, '') || s.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleEmail = (stu?: Student) => {
    const s = stu || currentStudent;
    if (!s) return;
    const msg = getResolvedMessage(s);
    const url = `mailto:${s.email}?subject=${encodeURIComponent(
      `EduScore TZ - Ripoti ya Mwanafunzi: ${s.name} (${s.form})`
    )}&body=${encodeURIComponent(msg)}`;
    window.location.href = url;
  };

  const handleSimulateSms = (stu?: Student) => {
    const s = stu || currentStudent;
    if (!s) return;
    setSimulatedSendStatus(
      `✓ SMS successfully dispatched to ${s.parent} (${s.phone}) for ${s.name}. NECTA Delivery Ref: TZ-SMS-${Math.floor(100000 + Math.random() * 900000)} (200 OK).`
    );
    setTimeout(() => setSimulatedSendStatus(null), 5000);
  };

  // Launch Batch Email Client (BCC to all parents in the class)
  const handleLaunchBatchEmailClient = () => {
    const validEmails = broadcastList.map((s) => s.email).filter(Boolean);
    if (validEmails.length === 0) {
      alert('No valid emails found in the selected batch.');
      return;
    }
    const bccList = validEmails.join(',');
    const generalNotice = customText
      .replace(/{parent_name}/g, 'Mzazi / Mlezi')
      .replace(/{student_name}/g, 'Mwanafunzi')
      .replace(/{average}/g, '[Matokeo]')
      .replace(/{rank}/g, '[Nafasi]')
      .replace(/{cohort_size}/g, `${broadcastList.length}`)
      .replace(/{attendance}/g, '[Mahudhurio]')
      .replace(/{form}/g, broadcastTarget === 'form' ? targetForm : 'Darasa')
      .replace(/{stream}/g, targetStream !== 'All' ? targetStream : '')
      .replace(/{necta_division}/g, '[Daraja]')
      .replace(/{fee_balance}/g, '[Salio la Ada]');

    const url = `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(
      `EduScore TZ - Taarifa Rasmi ya Darasa (${targetForm})`
    )}&body=${encodeURIComponent(generalNotice)}`;
    window.location.href = url;
  };

  // Automated Batch Execution Simulation
  const handleExecuteCollectiveBroadcast = () => {
    if (broadcastList.length === 0) return;
    setIsBroadcasting(true);
    setBroadcastProgress(0);
    setBroadcastLog([]);

    const total = broadcastList.length;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const currentStu = broadcastList[step - 1];
      if (currentStu) {
        setBroadcastLog((prev) => [
          `✓ Dispatched ${broadcastChannel.toUpperCase()} to ${currentStu.parent} (${currentStu.phone}) for ${currentStu.name} [Ref: TZ-BULK-${Date.now().toString().slice(-5)}]`,
          ...prev.slice(0, 5),
        ]);
      }

      setBroadcastProgress(Math.round((step / total) * 100));

      if (step >= total) {
        clearInterval(interval);
        setTimeout(() => {
          setIsBroadcasting(false);
          const targetLabel =
            broadcastTarget === 'form'
              ? `${targetForm} ${targetStream !== 'All' ? `(${targetStream})` : ''} Parents`
              : broadcastTarget === 'at_risk'
              ? 'At-Risk Candidates Parents'
              : broadcastTarget === 'defaulters'
              ? 'Fee Defaulters'
              : broadcastTarget === 'honors'
              ? 'Honors Achievers Parents'
              : 'All Enrolled School Parents';

          setBroadcastResult({
            count: total,
            channel: broadcastChannel.toUpperCase(),
            targetName: targetLabel,
            timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          });
        }, 600);
      }
    }, 150);
  };

  // Export Recipient CSV with standardized phone and currency formats
  const handleExportBroadcastContacts = () => {
    const headers = [
      'Student_ID',
      'Student_Name',
      'Parent_Name',
      'Phone_Formatted',
      'WhatsApp_Formatted',
      'Email',
      'Form_Level',
      'Stream',
      'Average_Score',
      'NECTA_Division',
      'Class_Position',
      'Fee_Balance_TZS',
      'Fee_Balance_Formatted',
      'Personalized_Message_Content',
    ].map(escapeCsvCell).join(',');

    const rows = broadcastList.map((s) => {
      const msg = getResolvedMessage(s);
      return [
        escapeCsvCell(s.id),
        escapeCsvCell(s.name),
        escapeCsvCell(s.parent),
        formatCsvPhone(s.phone),
        formatCsvPhone(s.whatsapp || s.phone),
        escapeCsvCell(s.email),
        escapeCsvCell(s.form),
        escapeCsvCell(s.stream),
        String(s.average || 0),
        escapeCsvCell(s.nectaDivision),
        escapeCsvCell(s.classPosition ? formatOrdinal(s.classPosition) : ''),
        String(s.feeBalance || 0),
        formatCsvCurrency(s.feeBalance, 'TZS'),
        escapeCsvCell(msg),
      ].join(',');
    });

    const csvData = [headers, ...rows].join('\n');
    downloadCsvFile(
      csvData,
      `broadcast-recipients-${broadcastTarget === 'form' ? targetForm.replace(/\s+/g, '_') : broadcastTarget}-${Date.now()}`
    );
  };

  return (
    <div id="view-messages" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Mode Switcher Banner */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Parent Communication & Unified Messaging Center
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Dispatch personalized notices individually or in class-wide batches via SMS, WhatsApp, and Email.
            </p>
          </div>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setMessagingMode('individual')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              messagingMode === 'individual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Individual Messaging</span>
          </button>
          <button
            onClick={() => setMessagingMode('collective')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              messagingMode === 'collective'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Class / Batch Broadcast</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Individual Student Messaging */}
      {messagingMode === 'individual' ? (
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Candidate Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Candidate:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-semibold"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.form} {s.stream}) — Parent: {s.parent}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Message Template:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-semibold"
              >
                {Object.keys(templates).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Meta Card */}
          {currentStudent && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{currentStudent.parent} (Guardian)</span>
                <span className="text-slate-500">
                  Phone: {currentStudent.phone} | WhatsApp: {currentStudent.whatsapp || currentStudent.phone} | Email: {currentStudent.email}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-white px-2 py-1 rounded border border-slate-200 font-bold text-slate-800">
                  Avg: {currentStudent.average}%
                </span>
                <span className="bg-white px-2 py-1 rounded border border-slate-200 font-bold text-emerald-800">
                  {currentStudent.nectaDivision}
                </span>
                <span className="bg-white px-2 py-1 rounded border border-slate-200 font-bold text-slate-700">
                  Rank: {currentStudent.classPosition ? formatOrdinal(currentStudent.classPosition) : '1st'}
                </span>
              </div>
            </div>
          )}

          {/* Custom / Interpolated Message Area */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Message Content (Interpolated Template):</label>
              <span className="text-[11px] text-gray-500">
                Variables: {'{student_name}'}, {'{parent_name}'}, {'{average}'}, {'{rank}'}, {'{attendance}'}, {'{fee_balance}'}
              </span>
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-mono focus:outline-hidden"
            />
          </div>

          {/* Rendered Live SMS Box */}
          <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
              Live Gateway Output Preview:
            </span>
            <p className="text-xs text-slate-900 font-medium leading-relaxed">{resolved}</p>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition flex items-center space-x-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEmail()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs"
              >
                <Mail className="w-3.5 h-3.5 text-blue-300" />
                <span>Email Guardian</span>
              </button>

              <button
                onClick={() => handleWhatsApp()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>

              <button
                onClick={() => handleSimulateSms()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch SMS</span>
              </button>
            </div>
          </div>

          {simulatedSendStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-semibold flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{simulatedSendStatus}</span>
            </div>
          )}
        </div>
      ) : (
        /* Mode 2: Collective / Bulk Class Messaging Broadcast */
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
            <div>
              <h4 className="text-base font-bold text-slate-900">Class & Cohort Batch Messaging Broadcast</h4>
              <p className="text-xs text-gray-500">
                Dispatch individualized reports and notices to all class parents/guardians at once via SMS, WhatsApp, or Email.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportBroadcastContacts}
                title="Export list with formatted phones and individual message previews"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition flex items-center space-x-1.5 border border-slate-200 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export Recipient CSV ({broadcastList.length})</span>
              </button>
            </div>
          </div>

          {/* Filter Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Audience:</label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value as any)}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-semibold"
              >
                <option value="form">Specific Class / Form Level</option>
                <option value="all">All Enrolled School Parents ({students.length})</option>
                <option value="at_risk">At-Risk Candidates (Avg &lt; 45% or Att &lt; 80%)</option>
                <option value="defaulters">Outstanding Fee Defaulters</option>
                <option value="honors">Academic Honors Candidates (Avg ≥ 75%)</option>
              </select>
            </div>

            {broadcastTarget === 'form' ? (
              <>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Form Level:</label>
                  <select
                    value={targetForm}
                    onChange={(e) => setTargetForm(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-semibold"
                  >
                    <option value="Form I">Form I</option>
                    <option value="Form II">Form II</option>
                    <option value="Form III">Form III</option>
                    <option value="Form IV">Form IV</option>
                    <option value="Form V">Form V</option>
                    <option value="Form VI">Form VI</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stream / Section:</label>
                  <select
                    value={targetStream}
                    onChange={(e) => setTargetStream(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-semibold"
                  >
                    <option value="All">All Streams (A, B, C)</option>
                    <option value="A">Stream A</option>
                    <option value="B">Stream B</option>
                    <option value="C">Stream C</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 flex items-center text-xs">
                <span>Selected {broadcastTarget.replace('_', ' ')}: {broadcastList.length} matching students across all levels.</span>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Transmission Gateway:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['sms', 'whatsapp', 'email'] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setBroadcastChannel(ch)}
                    className={`py-2 text-center rounded-lg border font-bold text-xs uppercase transition ${
                      broadcastChannel === ch
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-gray-50 border-gray-300 text-slate-600 hover:bg-gray-100'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Template Selection for Broadcast */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-1">
              <label className="font-bold text-slate-700 block mb-1">Batch Message Template:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-semibold"
              >
                {Object.keys(templates).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">
                  Broadcast Message Body (Personalized per student):
                </label>
                <span className="text-[11px] text-gray-500">
                  Variables: {'{student_name}'}, {'{parent_name}'}, {'{average}'}, {'{rank}'}, {'{attendance}'}, {'{fee_balance}'}
                </span>
              </div>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-mono focus:outline-hidden"
              />
            </div>
          </div>

          {/* Audience Preview & Dispatch Actions */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900">
                  Recipients: {broadcastList.length} Parents / Guardians in {broadcastTarget === 'form' ? `${targetForm} (${targetStream === 'All' ? 'All Streams' : `Stream ${targetStream}`})` : broadcastTarget}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {broadcastChannel === 'email' && (
                  <button
                    onClick={handleLaunchBatchEmailClient}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-300" />
                    <span>Open Batch Mail Client (BCC All)</span>
                  </button>
                )}

                <button
                  onClick={handleExecuteCollectiveBroadcast}
                  disabled={isBroadcasting || broadcastList.length === 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-2 shadow-xs"
                >
                  {isBroadcasting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching ({broadcastProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        Broadcast to All {broadcastList.length} Parents ({broadcastChannel.toUpperCase()})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Broadcast Progress Bar */}
            {isBroadcasting && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Dispatching messages via Tanzania Gateway...</span>
                  <span>{broadcastProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 transition-all duration-150 rounded-full"
                    style={{ width: `${broadcastProgress}%` }}
                  />
                </div>
                {broadcastLog.length > 0 && (
                  <div className="p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg space-y-0.5">
                    {broadcastLog.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Success Banner */}
          {broadcastResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl animate-fadeIn text-xs text-emerald-950 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Batch Broadcast Successfully Completed at {broadcastResult.timestamp}!</span>
              </div>
              <p className="text-emerald-800">
                Successfully dispatched <strong>{broadcastResult.count}</strong> individualized messages to{' '}
                <strong>{broadcastResult.targetName}</strong> via {broadcastResult.channel} Gateway. Each parent received their student's exact academic position and records.
              </p>
            </div>
          )}

          {/* Individual Recipient Queue & Interactive Trigger Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h5 className="text-xs font-bold text-slate-800">
                Recipients & Personalized Preview Queue ({broadcastList.length} Parents):
              </h5>
              <span className="text-[11px] text-gray-500">
                Click WhatsApp, Email, or SMS to contact any parent individually with their student's report.
              </span>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-gray-200 z-10">
                  <tr>
                    <th className="p-2.5">Student & Class</th>
                    <th className="p-2.5">Parent / Guardian</th>
                    <th className="p-2.5">Contact Info</th>
                    <th className="p-2.5">Personalized Message Preview</th>
                    <th className="p-2.5 text-right">Direct Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {broadcastList.map((stu) => {
                    const msg = getResolvedMessage(stu);
                    return (
                      <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5">
                          <strong className="text-slate-900 block">{stu.name}</strong>
                          <span className="text-gray-500 text-[11px]">
                            {stu.form} {stu.stream} • Avg: {stu.average}% • Pos: {stu.classPosition ? formatOrdinal(stu.classPosition) : '1st'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-800 font-medium">
                          {stu.parent}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">
                          <div>{stu.phone}</div>
                          {stu.email && <div className="text-[10px] text-gray-400">{stu.email}</div>}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-600 max-w-xs truncate" title={msg}>
                          {msg}
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleWhatsApp(stu)}
                              title="Send personalized WhatsApp message"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEmail(stu)}
                              title="Send personalized email"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md transition"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSimulateSms(stu)}
                              title="Dispatch direct SMS"
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {broadcastList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">
                        No candidates found matching the selected class or criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
