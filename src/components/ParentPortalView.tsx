import React, { useState } from 'react';
import {
  Smartphone,
  PhoneCall,
  Mail,
  MessageCircle,
  Bell,
  CheckCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  GraduationCap,
  DollarSign,
  Receipt,
  Download,
  Printer,
  ChevronRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Student, PaymentRecord } from '../types';
import { formatTzs, formatOrdinal } from '../utils/necta';

interface ParentPortalViewProps {
  students: Student[];
  initialStudentId?: string;
  onPaymentSuccess?: (
    studentId: string,
    amount: number,
    method: string,
    reference: string,
    term?: string,
    purpose?: string,
    schoolName?: string
  ) => void;
  language: 'en' | 'sw';
  schoolName?: string;
  activeTerm?: string;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  students,
  initialStudentId,
  onPaymentSuccess,
  language,
  schoolName = 'Jitegemee Secondary School',
  activeTerm = 'Term 1',
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

  const currentStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  // Payment Gateway Modal & State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'tigopesa' | 'airtel' | 'halopesa' | 'gepg' | 'card'>('mpesa');
  const [payAmount, setPayAmount] = useState<number>(150000);
  const [payerPhone, setPayerPhone] = useState<string>('+255712345678');
  const [cardCurrency, setCardCurrency] = useState<'TZS' | 'USD' | 'EUR' | 'GBP'>('TZS');
  const [cardNumber, setCardNumber] = useState<string>('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentRecord | null>(null);

  // Term, Purpose & School attributes for Payment & Receipt
  const [feeTerm, setFeeTerm] = useState<string>(currentStudent?.term || activeTerm || 'Term 1');
  const [feePurposeCategory, setFeePurposeCategory] = useState<string>('Tuition');
  const [customPurposeText, setCustomPurposeText] = useState<string>('');
  const [receiptSchoolName, setReceiptSchoolName] = useState<string>(
    currentStudent?.school || schoolName || 'Jitegemee Secondary School'
  );

  // Keep receipt school and term in sync when current student changes
  React.useEffect(() => {
    if (currentStudent) {
      setReceiptSchoolName(currentStudent.school || schoolName);
      setFeeTerm(currentStudent.term || activeTerm || 'Term 1');
    }
  }, [currentStudent?.id, currentStudent?.school, currentStudent?.term, schoolName, activeTerm]);

  if (!currentStudent) {
    return <div className="p-6 text-center text-gray-500">No student selected.</div>;
  }

  const handleTriggerAlert = () => {
    const text = `✓ Alert dispatched to ${currentStudent.parent} (${currentStudent.phone}): "${currentStudent.name} attendance is ${currentStudent.attendance}%, average is ${currentStudent.average}% (${currentStudent.nectaDivision})."`;
    setTestSentMessage(text);
    setTimeout(() => {
      setTestSentMessage(null);
    }, 6000);
  };

  const getRank = () => {
    if (currentStudent.classPosition) {
      return `${formatOrdinal(currentStudent.classPosition)} / ${currentStudent.cohortSize || students.length}`;
    }
    const sorted = [...students].sort((a, b) => b.average - a.average);
    const idx = sorted.findIndex((s) => s.id === currentStudent.id);
    return `${idx + 1}th / ${students.length}`;
  };

  // Determine finalized purpose text
  const getResolvedPurpose = () => {
    if (feePurposeCategory === 'Custom') {
      return customPurposeText.trim() || `${feeTerm} School Fee Payment`;
    }
    if (feePurposeCategory === 'Tuition') {
      return `${feeTerm} School Tuition & Academic Continuous Assessment`;
    }
    if (feePurposeCategory === 'NECTA') {
      return `NECTA National Examination Registration Fee (${currentStudent.form})`;
    }
    if (feePurposeCategory === 'Boarding') {
      return `Boarding & Accommodation Fee (${feeTerm})`;
    }
    if (feePurposeCategory === 'ScienceLab') {
      return `Laboratory, Computer & Science Practical Levy`;
    }
    if (feePurposeCategory === 'Uniform') {
      return `School Uniform & Physical Sports Attire`;
    }
    if (feePurposeCategory === 'Remedial') {
      return `Remedial & Vacation Coaching Program (${feeTerm})`;
    }
    return `${feeTerm} School Fee`;
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPay(true);

    const resolvedPurpose = getResolvedPurpose();
    const finalizedSchool = receiptSchoolName.trim() || currentStudent.school || schoolName;

    setTimeout(() => {
      setIsProcessingPay(false);
      const receiptNo = `REC-TZ-${Date.now().toString().slice(-6)}`;
      const controlNo = `99${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const newReceipt: PaymentRecord = {
        id: `pay-${Date.now()}`,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        schoolName: finalizedSchool,
        amount: payAmount,
        currency: paymentMethod === 'card' ? cardCurrency : 'TZS',
        paymentMethod:
          paymentMethod === 'mpesa'
            ? 'M-Pesa (Vodacom)'
            : paymentMethod === 'tigopesa'
            ? 'Tigo Pesa'
            : paymentMethod === 'airtel'
            ? 'Airtel Money'
            : paymentMethod === 'halopesa'
            ? 'HaloPesa'
            : paymentMethod === 'gepg'
            ? 'Government GePG Control'
            : 'Credit Card (Visa / Mastercard)',
        transactionReference: receiptNo,
        status: 'Completed',
        timestamp: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        term: feeTerm,
        purpose: resolvedPurpose,
        payerName: currentStudent.parent,
        phone: payerPhone,
        controlNumber: controlNo,
      };

      setPaymentReceipt(newReceipt);
      if (onPaymentSuccess) {
        onPaymentSuccess(
          currentStudent.id,
          payAmount,
          newReceipt.paymentMethod,
          receiptNo,
          feeTerm,
          resolvedPurpose,
          finalizedSchool
        );
      }
    }, 1500);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div id="view-parentPortal" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Student Switcher Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label htmlFor="parentWardSelect" className="text-xs font-bold text-slate-700 shrink-0">
            Select Active Ward / Student:
          </label>
          <select
            id="parentWardSelect"
            value={currentStudent.id}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setPaymentReceipt(null);
            }}
            className="text-xs font-bold px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            {students.map((stu) => (
              <option key={stu.id} value={stu.id}>
                {stu.name} — {stu.form} ({stu.school})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setPayAmount(currentStudent.feeBalance > 0 ? currentStudent.feeBalance : 150000);
              setShowPaymentModal(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pay School Fees</span>
          </button>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-200 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping"></span>
            Guardian Sync Active
          </span>
        </div>
      </div>

      {/* Main Parent Dashboard Visual Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700/60 pb-5 mb-6 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-pink-500/20 text-pink-400 rounded-xl text-xl border border-pink-500/30 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">
                Parent Real-Time Desk (Guardian View)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Transmitting continuous assessment scores, class positions, attendance, and fee invoices to legal guardians.
              </p>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-500/30 flex items-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            <span>Official TAMISEMI Portal</span>
          </span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ward Profile & Guardian Info */}
          <div className="bg-slate-900/90 p-5 sm:p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 font-black text-lg flex items-center justify-center shrink-0">
                  {currentStudent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-base leading-tight">
                    {currentStudent.name}
                  </h4>
                  <p className="text-xs text-amber-400 font-medium">
                    {currentStudent.form} — Stream {currentStudent.stream}
                  </p>
                  <p className="text-[11px] text-slate-400">{currentStudent.school}</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Class Rank:</span>
                  <span className="font-bold text-amber-400">{getRank()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Academic Standing:</span>
                  <span className="font-bold text-emerald-400">{currentStudent.nectaDivision}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Guardian Name:</span>
                  <span className="font-semibold text-white">{currentStudent.parent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Registered Phone:</span>
                  <span className="font-mono text-white">{currentStudent.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Discipline Record:</span>
                  <span className="font-semibold text-emerald-400">{currentStudent.discipline}</span>
                </div>
              </div>
            </div>

            {/* Quick Fee Pay Callout */}
            <div className="mt-5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Outstanding Balance:</span>
                <span className="font-bold text-amber-400 text-sm">
                  {formatTzs(currentStudent.feeBalance)}
                </span>
              </div>
              <button
                onClick={() => {
                  setPayAmount(currentStudent.feeBalance > 0 ? currentStudent.feeBalance : 150000);
                  setShowPaymentModal(true);
                }}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-xs flex items-center justify-center space-x-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay Now (Mobile Money / Card)</span>
              </button>
            </div>
          </div>

          {/* Ward Analytics Index */}
          <div className="lg:col-span-2 bg-slate-900/90 p-5 sm:p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center justify-between">
                <span>Ward Real-Time Analytical Index</span>
                <span className="text-slate-400 font-normal lowercase font-mono text-[11px]">
                  ID: {currentStudent.id}
                </span>
              </h4>

              {/* 4 Metric Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                <div className="p-3.5 bg-slate-800/70 rounded-xl border border-slate-700/50">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Attendance</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{currentStudent.attendance}%</p>
                  <span className="text-[10px] text-slate-500 font-medium">Target &ge; 85%</span>
                </div>
                <div className="p-3.5 bg-slate-800/70 rounded-xl border border-slate-700/50">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Term Average</p>
                  <p className="text-xl font-black text-amber-400 mt-1">{currentStudent.average}%</p>
                  <span className="text-[10px] text-slate-500 font-medium">NECTA Grade {currentStudent.nectaGrade}</span>
                </div>
                <div className="p-3.5 bg-slate-800/70 rounded-xl border border-slate-700/50">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Cohort Rank</p>
                  <p className="text-xl font-black text-blue-400 mt-1">{getRank()}</p>
                  <span className="text-[10px] text-slate-500 font-medium">{currentStudent.form} Standing</span>
                </div>
                <div className="p-3.5 bg-slate-800/70 rounded-xl border border-slate-700/50">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Fees Status</p>
                  <p
                    className={`text-sm sm:text-base font-black mt-1 ${
                      currentStudent.feeBalance === 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {currentStudent.feeBalance === 0 ? 'Cleared' : formatTzs(currentStudent.feeBalance)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">{currentStudent.feeStatus}</span>
                </div>
              </div>

              {/* Subject Breakdown Pill Group */}
              <div className="mt-5 p-4 bg-slate-950/40 rounded-xl border border-slate-800">
                <p className="text-xs font-bold text-slate-300 mb-2.5">
                  Continuous Assessment Subject Scores:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-800/60 p-2 rounded-lg flex justify-between">
                    <span className="text-slate-400">Mathematics</span>
                    <span className="font-bold text-slate-100">{currentStudent.mathematics}%</span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-lg flex justify-between">
                    <span className="text-slate-400">English</span>
                    <span className="font-bold text-slate-100">{currentStudent.english}%</span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-lg flex justify-between">
                    <span className="text-slate-400">Kiswahili</span>
                    <span className="font-bold text-slate-100">{currentStudent.kiswahili}%</span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-lg flex justify-between">
                    <span className="text-slate-400">Science</span>
                    <span className="font-bold text-slate-100">{currentStudent.science}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Trigger Alert button and status */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                <span>Synchronized with Tanzanian NECTA Database</span>
              </span>
              <button
                id="btn-trigger-parent-alert"
                onClick={handleTriggerAlert}
                className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-4 py-2 rounded-lg transition shadow-xs flex items-center space-x-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Test SMS Notification</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live confirmation message toast */}
        {testSentMessage && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testSentMessage}</span>
          </div>
        )}
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden my-8 animate-scaleIn">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm">Tanzanian School Fee Payment Gateway</h4>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentReceipt(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {paymentReceipt ? (
              /* Official Payment Receipt View */
              <div className="p-6 space-y-4 text-xs" id="official-fee-receipt">
                {/* Official Letterhead Header */}
                <div className="text-center pb-3 border-b-2 border-slate-900/80 space-y-1">
                  <div className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">
                    Jamhuri ya Muungano wa Tanzania • Wizara ya Elimu na Mafunzo ya Amali
                  </div>
                  <h3 className="text-lg font-black uppercase text-slate-900 tracking-tight">
                    {paymentReceipt.schoolName || currentStudent.school || schoolName}
                  </h3>
                  <div className="inline-block bg-slate-900 text-amber-400 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    Official Electronic Payment Receipt (Hati Rasmi ya Malipo)
                  </div>
                </div>

                {/* Receipt Grid Information */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">School / Institution:</span>
                      <span className="font-bold text-slate-900 text-xs">{paymentReceipt.schoolName || currentStudent.school}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">Academic Term (Muhula):</span>
                      <span className="inline-block bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded text-xs border border-amber-300">
                        {paymentReceipt.term || feeTerm}
                      </span>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-2">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Fee Purpose / Kusudi la Malipo:</span>
                    <span className="font-extrabold text-blue-900 text-xs block">
                      {paymentReceipt.purpose || 'Tuition & School Fee'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">Student / Candidate:</span>
                      <span className="font-bold text-slate-900 block">{paymentReceipt.studentName}</span>
                      <span className="text-[10px] text-gray-500 font-mono">ID: {currentStudent.id} • {currentStudent.form} {currentStudent.stream}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">Parent / Guardian:</span>
                      <span className="font-semibold text-slate-800 block">{paymentReceipt.payerName || currentStudent.parent}</span>
                      <span className="text-[10px] text-gray-500">{paymentReceipt.phone || currentStudent.phone}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">Receipt Reference:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{paymentReceipt.transactionReference}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">GePG Control Number:</span>
                      <span className="font-mono font-bold text-blue-700 text-xs">{paymentReceipt.controlNumber}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">Payment Channel:</span>
                      <span className="font-semibold text-slate-800 text-xs">{paymentReceipt.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 block uppercase">Date & Timestamp:</span>
                      <span className="text-slate-700 text-[11px] font-medium">{paymentReceipt.timestamp}</span>
                    </div>
                  </div>

                  {/* Financial Settlement Totals */}
                  <div className="pt-1 flex items-center justify-between bg-emerald-50/80 p-3 rounded-lg border border-emerald-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Amount Settled:</span>
                      <span className="font-black text-emerald-700 text-base">
                        {paymentReceipt.currency} {paymentReceipt.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">New Remaining Balance:</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {formatTzs(Math.max(0, currentStudent.feeBalance - paymentReceipt.amount))}
                      </span>
                    </div>
                  </div>

                  {/* GePG Verification Seal */}
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                    <span className="flex items-center text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Status: GePG / BOT Verified & Reconciled
                    </span>
                    <span className="font-mono text-[9px] text-gray-400">SECURE DIGITAL AUDIT SIGNED</span>
                  </div>
                </div>

                {/* Print & Action Controls */}
                <div className="flex justify-between items-center pt-2">
                  <div className="text-[10px] text-gray-400">
                    Press Print to produce official A4 or slip receipt.
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrintReceipt}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs transition"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print Official Receipt</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        setPaymentReceipt(null);
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Payment Input Form */
              <form onSubmit={handleExecutePayment} className="p-6 space-y-4 text-xs">
                {/* School Name & Term Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      School / Institution Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={receiptSchoolName}
                      onChange={(e) => setReceiptSchoolName(e.target.value)}
                      placeholder="e.g. Jitegemee Secondary School"
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Term for Fee Payment:
                    </label>
                    <select
                      value={feeTerm}
                      onChange={(e) => setFeeTerm(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs font-bold text-slate-900"
                    >
                      <option value="Term 1">Term 1 (Muhula wa Kwanza)</option>
                      <option value="Term 2">Term 2 (Muhula wa Pili)</option>
                      <option value="Term 3">Term 3 (Muhula wa Tatu)</option>
                      <option value="Term 4">Term 4 (Muhula wa Nne)</option>
                      <option value="Annual">Annual (Ada ya Mwaka Mzima)</option>
                      <option value="Special Session">Special / Remedial Session</option>
                    </select>
                  </div>
                </div>

                {/* Purpose of Fee Selector */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Purpose of Fee (Kusudi la Malipo):
                  </label>
                  <select
                    value={feePurposeCategory}
                    onChange={(e) => setFeePurposeCategory(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-xs font-semibold text-slate-900"
                  >
                    <option value="Tuition">School Tuition & Continuous Assessment ({feeTerm})</option>
                    <option value="NECTA">NECTA National Examination Registration Fee</option>
                    <option value="Boarding">Boarding & Accommodation Fee ({feeTerm})</option>
                    <option value="ScienceLab">Laboratory, Computer & Science Practical Levy</option>
                    <option value="Uniform">School Uniform & Sports Attire</option>
                    <option value="Remedial">Remedial & Vacation Coaching Program</option>
                    <option value="Custom">Other Purpose (Specify Custom Description...)</option>
                  </select>

                  {feePurposeCategory === 'Custom' && (
                    <input
                      type="text"
                      required
                      placeholder="Type custom fee purpose (e.g. Bus Transport, Graduation Levy)..."
                      value={customPurposeText}
                      onChange={(e) => setCustomPurposeText(e.target.value)}
                      className="w-full mt-2 p-2 border border-amber-300 rounded-lg bg-amber-50/50 text-xs font-medium"
                    />
                  )}
                </div>

                {/* Payment Provider Selection */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Payment Provider:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`p-2.5 rounded-lg border text-center transition font-bold ${
                        paymentMethod === 'mpesa'
                          ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                          : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      M-Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('tigopesa')}
                      className={`p-2.5 rounded-lg border text-center transition font-bold ${
                        paymentMethod === 'tigopesa'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                          : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      Tigo Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('airtel')}
                      className={`p-2.5 rounded-lg border text-center transition font-bold ${
                        paymentMethod === 'airtel'
                          ? 'bg-red-50 border-red-600 text-red-800 ring-1 ring-red-600'
                          : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      Airtel Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('halopesa')}
                      className={`p-2.5 rounded-lg border text-center transition font-bold ${
                        paymentMethod === 'halopesa'
                          ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500'
                          : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      HaloPesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('gepg')}
                      className={`p-2.5 rounded-lg border text-center transition font-bold ${
                        paymentMethod === 'gepg'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-600'
                          : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      GePG Gov
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-lg border text-center transition font-bold ${
                        paymentMethod === 'card'
                          ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500'
                          : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      Credit Card
                    </button>
                  </div>
                </div>

                {/* Amount with Quick Presets */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">
                      Amount to Pay ({paymentMethod === 'card' ? cardCurrency : 'TZS'}):
                    </label>
                    <span className="text-[10px] text-gray-500">
                      Outstanding: <strong className="text-slate-900">{formatTzs(currentStudent.feeBalance)}</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-sm font-bold text-slate-900"
                  />
                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {currentStudent.feeBalance > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setPayAmount(currentStudent.feeBalance)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                        >
                          Full Balance ({formatTzs(currentStudent.feeBalance)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayAmount(Math.round(currentStudent.feeBalance / 2))}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                        >
                          50% Partial
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setPayAmount(50000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                    >
                      TZS 50,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayAmount(100000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                    >
                      TZS 100,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayAmount(200000)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                    >
                      TZS 200,000
                    </button>
                  </div>
                </div>

                {/* Mobile Money Details */}
                {paymentMethod !== 'card' && paymentMethod !== 'gepg' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Payer Mobile Number:</label>
                    <input
                      type="text"
                      required
                      placeholder="+255 7XX XXX XXX"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-mono"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      A secure USSD push will prompt your phone to authorize this fee payment for {receiptSchoolName}.
                    </span>
                  </div>
                )}

                {/* GePG Control Number */}
                {paymentMethod === 'gepg' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-emerald-950 block">Government Control Number (GePG):</span>
                    <div className="font-mono text-base font-extrabold text-emerald-800">
                      9914 5028 9201
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Payable for {receiptSchoolName} ({feeTerm}) via NMB, CRDB, NBC, or any mobile money provider using reference 991450289201.
                    </p>
                  </div>
                )}

                {/* Credit Card Details */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3 p-3 bg-purple-50/50 rounded-xl border border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-950">International Payment Currency:</span>
                      <select
                        value={cardCurrency}
                        onChange={(e) => setCardCurrency(e.target.value as any)}
                        className="text-xs font-bold border border-gray-300 rounded p-1 bg-white"
                      >
                        <option value="TZS">TZS - Tanzanian Shilling</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Card Number (Visa / Mastercard):</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Expiry Date:</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">CVV Security Code:</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPay}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                  >
                    {isProcessingPay ? (
                      <span>Authorizing Payment...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Authorize Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
