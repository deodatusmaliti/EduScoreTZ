import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Save,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Calendar,
  GraduationCap,
  Plus,
} from 'lucide-react';
import { Student, TeacherMark } from '../types';
import { getNectaGrade } from '../utils/necta';

interface TeacherViewProps {
  students: Student[];
  teacherMarks: TeacherMark[];
  onSaveMark: (
    studentId: string,
    subject: string,
    teacher: string,
    score: number,
    note: string
  ) => void;
  onPrint: () => void;
  language: 'en' | 'sw';
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  students,
  teacherMarks,
  onSaveMark,
  onPrint,
  language,
}) => {
  const teachers = [
    'M. Mwakalinga',
    'S. Mtei',
    'R. Joseph',
    'P. Mushi',
    'Mr. Lazaro Nyalandu',
    'Madam Upendo Massawe',
    'Mr. D. Mtani',
  ];

  const defaultSubjects = [
    'Mathematics',
    'English',
    'Kiswahili',
    'Science',
    'Physics',
    'Chemistry',
    'Geography',
    'History',
  ];

  const [selectedTeacher, setSelectedTeacher] = useState<string>(teachers[0]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(defaultSubjects[0]);
  const [customSubjectName, setCustomSubjectName] = useState<string>('');
  const [score, setScore] = useState<number>(75);
  const [note, setNote] = useState<string>('Demonstrated good grasp of concepts.');
  const [statusMessage, setStatusMessage] = useState<string | null>(
    'Choose a student and enter an assessment score.'
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Derive dynamic list of all subjects (default + dynamic across students)
  const availableSubjects = useMemo(() => {
    const customSet = new Set<string>();
    students.forEach((s) => {
      if (s.customSubjects) {
        Object.keys(s.customSubjects).forEach((k) => customSet.add(k));
      }
    });
    // If selected student has specific custom subjects, ensure they are present
    if (selectedStudent?.customSubjects) {
      Object.keys(selectedStudent.customSubjects).forEach((k) => customSet.add(k));
    }
    const combined = Array.from(new Set([...defaultSubjects, ...Array.from(customSet)]));
    return [...combined, '__CUSTOM__'];
  }, [students, selectedStudent]);

  const effectiveSubject = selectedSubject === '__CUSTOM__' ? customSubjectName.trim() : selectedSubject;

  const currentGrade = getNectaGrade(score);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Please select a student.');
      return;
    }

    if (!effectiveSubject) {
      alert('Please select or specify a subject name.');
      return;
    }

    if (isNaN(score) || score < 0 || score > 100) {
      alert('Please enter a valid score between 0 and 100.');
      return;
    }

    onSaveMark(selectedStudentId, effectiveSubject, selectedTeacher, score, note);
    const stuName = selectedStudent?.name || 'Student';
    setStatusMessage(
      `✓ Successfully saved ${effectiveSubject} mark (${score}% - Grade ${currentGrade.grade}) for ${stuName}. Average & ranking updated.`
    );
  };

  return (
    <div id="view-teacher" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Input Grading Deck */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'en' ? 'Teacher Assessment Input Workspace' : 'Dawati la Kuingiza Alama za Mwalimu'}
            </h3>
            <p className="text-xs text-gray-500">
              Log formative and continuous assessment (CA) marks. Metrics immediately update NECTA division projections.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Teacher */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Assigned Teacher
              </label>
              <select
                id="teacherSelect"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {teachers.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Subject
              </label>
              <select
                id="teacherSubjectSelect"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <optgroup label="Standard Core Subjects">
                  {defaultSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </optgroup>
                {availableSubjects.filter((s) => !defaultSubjects.includes(s) && s !== '__CUSTOM__').length > 0 && (
                  <optgroup label="Dynamic / School Curriculum Subjects">
                    {availableSubjects
                      .filter((s) => !defaultSubjects.includes(s) && s !== '__CUSTOM__')
                      .map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="Other">
                  <option value="__CUSTOM__">+ Enter New / Custom Subject...</option>
                </optgroup>
              </select>

              {selectedSubject === '__CUSTOM__' && (
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter Custom Subject Name (e.g. Civics, Commerce)"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    className="w-full text-xs font-semibold p-2 border border-amber-400 bg-amber-50/50 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Student */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Student
              </label>
              <select
                id="teacherStudentSelect"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {students.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} ({stu.form} {stu.stream})
                  </option>
                ))}
              </select>
            </div>

            {/* Score */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Score (%) [0 - 100]
                </label>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${currentGrade.bgLight}`}>
                  Grade {currentGrade.grade} ({currentGrade.points} pt)
                </span>
              </div>
              <input
                id="teacherScoreInput"
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(+e.target.value)}
                className="w-full text-xs font-bold p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Formative Note */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Teacher Formative Note / Remedial Strategy
            </label>
            <textarea
              id="teacherNoteInput"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add specific comments on strengths or areas requiring attention..."
              className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Buttons and Status alert */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                id="btn-save-mark"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Assessment</span>
              </button>

              <button
                type="button"
                onClick={onPrint}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Class Report</span>
              </button>
            </div>

            {selectedStudent && (
              <span className="text-xs text-slate-500 font-medium">
                Current Average for <strong>{selectedStudent.name}</strong>: {selectedStudent.average}% ({selectedStudent.nectaDivision})
              </span>
            )}
          </div>
        </form>

        {/* Live status alert */}
        {statusMessage && (
          <div
            id="teacherStatusBanner"
            className="mt-4 p-3 bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600 rounded-r-lg text-xs font-medium flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Recorded Assessments Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
              Continuous Assessment Log Entries ({teacherMarks.length})
            </h4>
            <p className="text-[11px] text-gray-500">
              Audit log of recently entered marks for the current academic session.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-200/70 px-2.5 py-1 rounded">
            Term 1 (2026)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-100 text-gray-600 font-semibold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3">Student Name</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Teacher</th>
                <th className="px-5 py-3">Score (%)</th>
                <th className="px-5 py-3">Term</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Teacher Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
              {teacherMarks.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3 font-bold text-slate-900">{m.studentName}</td>
                  <td className="px-5 py-3">
                    <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[11px]">
                      {m.subject}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{m.teacher}</td>
                  <td className="px-5 py-3 font-bold text-emerald-700">{m.score}%</td>
                  <td className="px-5 py-3 text-gray-500">{m.term}</td>
                  <td className="px-5 py-3 text-gray-400 text-[11px]">{m.timestamp}</td>
                  <td className="px-5 py-3 text-gray-600 max-w-xs truncate">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
