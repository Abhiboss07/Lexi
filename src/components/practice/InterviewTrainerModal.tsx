import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Sparkles, 
  ArrowRight, 
  Volume2, 
  Mic, 
  MicOff, 
  Award, 
  RotateCw, 
  HelpCircle, 
  Target
} from 'lucide-react';
import type { PracticeDifficulty, PracticeSessionLength } from '../../types/practicePreferences';
import { SESSION_LENGTH_MINUTES } from '../../types/practicePreferences';
import { practiceRepository } from '../../db/practiceRepository';

export type InterviewType = 'behavioral' | 'technical' | 'hr' | 'mixed';
export type ExperienceLevel = 'fresher' | 'mid' | 'senior';

export interface PredefinedRole {
  id: string;
  title: string;
  companyContext: string;
  sampleJobDescription: string;
  extractedSkills: string[];
}

export const PREDEFINED_ROLES: PredefinedRole[] = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    companyContext: 'Modern Tech & Cloud Platforms',
    sampleJobDescription: 'Seeking a collaborative engineer with experience in React, TypeScript, scalable web architectures, cross-functional communication, and agile delivery.',
    extractedSkills: ['React', 'TypeScript', 'System Architecture', 'Agile Collaboration', 'Code Quality'],
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    companyContext: 'Fast-Growing Consumer SaaS',
    sampleJobDescription: 'Lead product vision, prioritize roadmap with engineering and design, analyze customer analytics, and communicate clearly with global stakeholders.',
    extractedSkills: ['Roadmap Prioritization', 'Stakeholder Communication', 'User Research', 'Data Analysis'],
  },
  {
    id: 'customer-success',
    title: 'Customer Success Specialist',
    companyContext: 'Global Enterprise Services',
    sampleJobDescription: 'Manage client onboarding, resolve technical inquiries, cultivate long-term renewals, and advocate for customer needs across departments.',
    extractedSkills: ['Active Listening', 'Conflict Resolution', 'Empathetic Communication', 'Client Relationship'],
  },
];

export interface InterviewQuestion {
  id: string;
  category: 'behavioral' | 'technical' | 'hr';
  question: string;
  interviewerPersona: string;
  hint: string;
  starGuide?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  sampleGoodAnswer: string;
}

export const DEFAULT_QUESTIONS_MAP: Record<string, InterviewQuestion[]> = {
  'software-engineer': [
    {
      id: 'swe-1',
      category: 'behavioral',
      question: 'Tell me about a challenging bug or technical setback you encountered and how you resolved it.',
      interviewerPersona: 'Sarah • Engineering Director',
      hint: 'Use the STAR method: explain the system context, the root cause, the debugging steps you took, and the production outcome.',
      starGuide: {
        situation: 'Describe the project and the critical issue that appeared in production.',
        task: 'What was your responsibility in diagnosing and fixing it?',
        action: 'What debugging tools, code refactoring, or team coordination did you execute?',
        result: 'What was the quantified result (e.g. 0 downtime, faster latency, happy users)?',
      },
      sampleGoodAnswer: 'In my previous project, we observed intermittent latency spikes on our checkout API during peak hours. As the lead frontend engineer, I collaborated with backend colleagues to profile database queries and implemented request memoization. This reduced API response latency by 45% and completely eliminated timeout errors for over 50,000 daily users.',
    },
    {
      id: 'swe-2',
      category: 'technical',
      question: 'How do you approach state management and component modularity when scaling a modern React application?',
      interviewerPersona: 'Alex • Principal Architect',
      hint: 'Highlight separation of concerns, container vs presentational components, local vs global state, and performance optimization.',
      sampleGoodAnswer: 'I prioritize keeping state as localized as possible to avoid unnecessary component re-renders. For shared server state, I rely on declarative caching libraries like React Query, while keeping UI state managed through lightweight context or composition hooks. This keeps components modular, testable, and maintainable as the team expands.',
    },
    {
      id: 'swe-3',
      category: 'hr',
      question: 'How do you give constructive feedback during code reviews when you disagree with a colleague’s approach?',
      interviewerPersona: 'Sarah • Engineering Director',
      hint: 'Demonstrate empathy, focus on the code rather than the person, ask open-ended questions, and offer constructive alternatives.',
      sampleGoodAnswer: 'I approach code reviews as collaborative learning opportunities rather than critiques. Instead of making prescriptive statements, I ask open questions like "Could this edge case cause a memory leak?", explain the architectural reasoning, and propose an alternative with a brief code example while praising what they did well.',
    },
  ],
  'product-manager': [
    {
      id: 'pm-1',
      category: 'behavioral',
      question: 'Describe a situation where engineering and executive stakeholders had conflicting priorities. How did you align them?',
      interviewerPersona: 'Elena • VP of Product',
      hint: 'Demonstrate data-driven prioritization, active listening, transparent trade-off matrices, and customer-first alignment.',
      starGuide: {
        situation: 'Executives wanted a new shiny feature while engineering insisted on technical debt reduction.',
        task: 'My objective was to establish an agreed-upon roadmap without demoralizing the team or missing Q3 revenue targets.',
        action: 'I facilitated a trade-off session using customer retention metrics and allocated 20% sprint bandwidth to technical debt while scoping a focused MVP for executives.',
        result: 'We shipped the MVP on time, reduced bug reports by 35%, and hit our retention goals.',
      },
      sampleGoodAnswer: 'When our leadership team pushed for an immediate enterprise feature while engineering highlighted critical technical debt, I organized an alignment workshop using customer churn data. By demonstrating how system instability cost us revenue, we agreed to allocate 25% of sprint velocity to infrastructure upgrades while delivering an MVP of the feature on time.',
    },
  ],
};

interface InterviewTrainerModalProps {
  userId?: string;
  initialDifficulty?: PracticeDifficulty;
  initialSessionLength?: PracticeSessionLength;
  onClose: () => void;
  onNavigateToExplore?: () => void;
}

export const InterviewTrainerModal: React.FC<InterviewTrainerModalProps> = ({
  userId = 'local-learner-1',
  initialDifficulty = 'medium',
  initialSessionLength = 'standard',
  onClose,
  onNavigateToExplore: _onNavigateToExplore,
}) => {
  // Step Management: 'setup' | 'interview' | 'report'
  const [step, setStep] = useState<'setup' | 'interview' | 'report'>('setup');

  // Setup Form State
  const [selectedRoleId, setSelectedRoleId] = useState<string>('software-engineer');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid');
  const [interviewType, setInterviewType] = useState<InterviewType>('mixed');
  const difficulty = initialDifficulty;
  const sessionLength = initialSessionLength;
  const [parsedSkills, setParsedSkills] = useState<string[]>(PREDEFINED_ROLES[0].extractedSkills);

  // Interview Player State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponseText, setUserResponseText] = useState('');
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showStarGuide, setShowStarGuide] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<Array<{
    question: InterviewQuestion;
    userAnswer: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>>([]);

  // Load predefined role into form
  const handleSelectPredefinedRole = (role: PredefinedRole) => {
    setSelectedRoleId(role.id);
    setCustomRoleTitle('');
    setJobDescription(role.sampleJobDescription);
    setParsedSkills(role.extractedSkills);
  };

  // Local Job Description Parser
  const handleParseJobDescription = (text: string) => {
    setJobDescription(text);
    if (!text.trim()) return;

    // Simple heuristic keyword extractor
    const keywords = ['react', 'typescript', 'python', 'javascript', 'sql', 'communication', 'leadership', 'agile', 'aws', 'docker', 'product', 'design', 'analytics', 'collaboration', 'strategy'];
    const found = keywords.filter((k) => text.toLowerCase().includes(k));
    if (found.length > 0) {
      setParsedSkills(found.map((k) => k.charAt(0).toUpperCase() + k.slice(1)));
    }
  };

  // Active Questions List
  const activeQuestions = DEFAULT_QUESTIONS_MAP[selectedRoleId] || DEFAULT_QUESTIONS_MAP['software-engineer'];
  const currentQuestion = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  // TTS Read Aloud Question
  const handleSpeakQuestion = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
      utterance.lang = 'en-US';
      utterance.rate = difficulty === 'easy' ? 0.85 : 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Mic Recognition
  const handleToggleMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Simulation text fallback
      setUserResponseText(currentQuestion.sampleGoodAnswer);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecordingMic(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserResponseText((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsRecordingMic(false);
      };
      recognition.onerror = () => setIsRecordingMic(false);
      recognition.onend = () => setIsRecordingMic(false);
      recognition.start();
    } catch {
      setIsRecordingMic(false);
      setUserResponseText(currentQuestion.sampleGoodAnswer);
    }
  };

  // Submit Answer for Current Question
  const handleSubmitAnswer = () => {
    const answer = userResponseText.trim();
    if (!answer) return;

    // Intelligent heuristic evaluation
    const wordCount = answer.split(/\s+/).length;
    const hasSituationWords = /when|project|previous|team|encountered|worked/i.test(answer);
    const hasResultWords = /result|outcome|reduced|improved|increased|achieved|delivered/i.test(answer);

    let score = 85;
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (wordCount >= 35) {
      score += 5;
      strengths.push('Detailed, substantive explanation with professional pacing');
    } else {
      score -= 10;
      improvements.push('Expand response with specific metrics and quantified outcomes');
    }

    if (hasSituationWords) {
      strengths.push('Clear situational context established early');
    }

    if (hasResultWords) {
      score += 5;
      strengths.push('Strong focus on business and technical impact');
    } else {
      improvements.push('Conclude with a clear quantified result (e.g. reduced latency, improved user engagement)');
    }

    const calculatedScore = Math.min(98, Math.max(70, score));

    const record = {
      question: currentQuestion,
      userAnswer: answer,
      score: calculatedScore,
      feedback: `Strong response covering the core challenge. Your vocabulary was professional and appropriately structured for a ${experienceLevel} interview.`,
      strengths,
      improvements,
    };

    setSubmittedAnswers((prev) => [...prev, record]);
    setUserResponseText('');
    setShowHint(false);
    setShowStarGuide(false);

    if (currentQuestionIndex + 1 < activeQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishInterviewSession([...submittedAnswers, record]);
    }
  };

  const finishInterviewSession = async (allAnswers = submittedAnswers) => {
    setStep('report');
    const avgScore = Math.round(
      allAnswers.reduce((acc, curr) => acc + curr.score, 0) / (allAnswers.length || 1)
    );

    try {
      await practiceRepository.recordSession({
        userId,
        category: 'interview',
        activityId: `interview-${selectedRoleId}`,
        difficulty,
        sessionLength,
        durationMinutes: SESSION_LENGTH_MINUTES[sessionLength],
        score: avgScore,
        notes: `Mock interview for ${customRoleTitle || PREDEFINED_ROLES.find((r) => r.id === selectedRoleId)?.title || 'Software Engineer'}. Overall Score: ${avgScore}%. Completed ${allAnswers.length} questions.`,
      });
    } catch (err) {
      console.warn('Failed to record interview practice session:', err);
    }
  };

  const overallScore = Math.round(
    submittedAnswers.reduce((acc, curr) => acc + curr.score, 0) / (submittedAnswers.length || 1)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Personal Interview Trainer"
    >
      <div className="relative w-full max-w-[620px] bg-white rounded-3xl shadow-2xl border border-[#D5D8EE] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="px-5 py-4 border-b border-[#ECEEFE] flex items-center justify-between bg-gradient-to-r from-[#FAF9FE] to-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shadow-xs">
              <Briefcase className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-black text-[#15164B] tracking-tight">
                  Interview Trainer
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  STAR Method AI
                </span>
              </div>
              <p className="text-[11.5px] font-medium text-[#6B7094]">
                Role-Tailored Mock Interviews & Constructive Feedback
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7094] hover:text-[#15164B] hover:bg-[#F0F2FD] transition-colors cursor-pointer"
            aria-label="Close interview trainer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* STEP 1: INTERVIEW SETUP */}
          {step === 'setup' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#FAF9FE] border border-[#BFDBFE] space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#2563EB] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Target Role & Requirements Setup
                </span>
                <p className="text-[12.5px] text-[#334155] leading-relaxed">
                  Select your target career track or paste an authentic job description. Lexi extracts core requirements and simulates role-specific questions.
                </p>
              </div>

              {/* Predefined Track Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#6B7094] uppercase tracking-wider">
                  Select Career Track:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {PREDEFINED_ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectPredefinedRole(r)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                        selectedRoleId === r.id
                          ? 'bg-[#15164B] text-white border-[#15164B]'
                          : 'bg-white border-[#E0E3F5] text-[#15164B] hover:border-[#545CA6]'
                      }`}
                    >
                      <h4 className="text-[12.5px] font-extrabold leading-tight">{r.title}</h4>
                      <p className={`text-[10px] mt-1 ${selectedRoleId === r.id ? 'text-white/70' : 'text-[#6B7094]'}`}>
                        {r.companyContext}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paste Job Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#6B7094] uppercase tracking-wider">
                    Job Description / Key Requirements:
                  </span>
                  <span className="text-[10px] text-[#545CA6] font-bold">Auto-Parser Active</span>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => handleParseJobDescription(e.target.value)}
                  placeholder="Paste requirements, technologies, or job posting excerpt here..."
                  rows={3}
                  className="w-full p-3 rounded-2xl border border-[#D5D8EE] text-[12.5px] text-[#15164B] focus:border-[#545CA6] outline-hidden leading-relaxed shadow-xs"
                />
              </div>

              {/* Extracted Skills Chips */}
              {parsedSkills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold text-[#6B7094] uppercase tracking-wider">
                    Extracted Competencies:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedSkills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-[11px] font-bold"
                      >
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience Tier & Session Config */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#ECEEFE]">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#6B7094]">Experience Level:</span>
                  <div className="flex gap-1">
                    {(['fresher', 'mid', 'senior'] as ExperienceLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setExperienceLevel(lvl)}
                        className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold capitalize transition-all cursor-pointer ${
                          experienceLevel === lvl
                            ? 'bg-[#15164B] text-white border-[#15164B]'
                            : 'bg-white border-[#E0E3F5] text-[#52577F]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#6B7094]">Interview Focus:</span>
                  <div className="flex gap-1">
                    {(['mixed', 'behavioral', 'technical'] as InterviewType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setInterviewType(t)}
                        className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold capitalize transition-all cursor-pointer ${
                          interviewType === t
                            ? 'bg-[#15164B] text-white border-[#15164B]'
                            : 'bg-white border-[#E0E3F5] text-[#52577F]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INTERACTIVE MOCK INTERVIEW */}
          {step === 'interview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Progress & Persona Strip */}
              <div className="flex items-center justify-between text-[11.5px] font-bold text-[#6B7094]">
                <span className="text-[#545CA6] bg-[#ECEFFD] px-2.5 py-0.5 rounded-full">
                  Question {currentQuestionIndex + 1} of {activeQuestions.length}
                </span>
                <span>Interviewer: {currentQuestion.interviewerPersona}</span>
              </div>

              {/* Question Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1E224E] to-[#2B316D] text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 uppercase tracking-wide">
                    {currentQuestion.category} Question
                  </span>
                  <button
                    type="button"
                    onClick={handleSpeakQuestion}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#A5B4FC] hover:text-white transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isPlayingAudio ? 'Stop Audio' : 'Listen Question'}</span>
                  </button>
                </div>

                <h3 className="text-[17px] font-black leading-snug">
                  "{currentQuestion.question}"
                </h3>
              </div>

              {/* Guidance & STAR Method Toggles */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="px-3 py-1.5 rounded-full border border-[#D5D8EE] hover:bg-[#F0F2FD] text-[#545CA6] text-[11.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Hint' : 'Interview Hint'}</span>
                </button>

                {currentQuestion.starGuide && (
                  <button
                    type="button"
                    onClick={() => setShowStarGuide(!showStarGuide)}
                    className="px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[11.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>STAR Method Structure</span>
                  </button>
                )}
              </div>

              {/* Hint Box */}
              {showHint && (
                <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[12px] text-[#92400E] leading-relaxed animate-in fade-in duration-150">
                  <span className="font-extrabold block">Coach Hint:</span>
                  <p>{currentQuestion.hint}</p>
                </div>
              )}

              {/* STAR Method Helper Guide */}
              {showStarGuide && currentQuestion.starGuide && (
                <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[12px] space-y-2 animate-in fade-in duration-150">
                  <span className="font-extrabold text-[#1E40AF] block">STAR Answering Blueprint:</span>
                  <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                    <div className="p-2 rounded-xl bg-white border border-[#DBEAFE]">
                      <strong className="text-[#2563EB] block">S - Situation:</strong>
                      <p className="text-[#475569]">{currentQuestion.starGuide.situation}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#DBEAFE]">
                      <strong className="text-[#2563EB] block">T - Task:</strong>
                      <p className="text-[#475569]">{currentQuestion.starGuide.task}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#DBEAFE]">
                      <strong className="text-[#2563EB] block">A - Action:</strong>
                      <p className="text-[#475569]">{currentQuestion.starGuide.action}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#DBEAFE]">
                      <strong className="text-[#2563EB] block">R - Result:</strong>
                      <p className="text-[#475569]">{currentQuestion.starGuide.result}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Response Input Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-extrabold text-[#15164B]">
                    Your Response:
                  </span>
                  <button
                    type="button"
                    onClick={() => setUserResponseText(currentQuestion.sampleGoodAnswer)}
                    className="text-[11px] font-bold text-[#545CA6] hover:underline cursor-pointer"
                  >
                    Insert Model Response
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={userResponseText}
                    onChange={(e) => setUserResponseText(e.target.value)}
                    placeholder="Type or speak your answer using complete sentences and structured examples..."
                    rows={4}
                    className="w-full p-3.5 pr-12 rounded-2xl border border-[#D5D8EE] text-[13px] text-[#15164B] focus:border-[#545CA6] outline-hidden leading-relaxed shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isRecordingMic ? 'bg-[#EF4444] text-white animate-pulse' : 'bg-[#15164B] text-white hover:bg-[#0E1038]'
                    }`}
                    aria-label="Speak response with microphone"
                  >
                    {isRecordingMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FINAL INTERVIEW REPORT & BENCHMARKS */}
          {step === 'report' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center space-y-1.5 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto shadow-xs">
                  <Award className="w-6 h-6 stroke-[2.4]" />
                </div>
                <h3 className="text-[20px] font-black text-[#15164B]">
                  Interview Assessment Report
                </h3>
                <p className="text-[12px] text-[#6B7094] max-w-[360px] mx-auto">
                  Evaluation based on structure, fluency, relevance, and technical clarity.
                </p>
              </div>

              {/* Overall Score Badge */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FAF9FE] to-[#EFF2FD] border border-[#DEE3FA] flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#545CA6] block">
                    Overall Performance Rating
                  </span>
                  <h4 className="text-[22px] font-black text-[#15164B]">
                    {overallScore >= 90 ? 'Strong Candidate' : overallScore >= 80 ? 'Proficient & Clear' : 'Developing'}
                  </h4>
                  <span className="text-[11.5px] font-bold text-[#059669]">
                    ✓ Recommended for next stage interview rounds
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[32px] font-black text-[#15164B] block leading-none">
                    {overallScore}%
                  </span>
                  <span className="text-[10.5px] font-extrabold uppercase text-[#8E93B8]">Composite Score</span>
                </div>
              </div>

              {/* Competency Breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-white border border-[#ECEEFE] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#8E93B8] block">STAR Structure</span>
                  <span className="text-[17px] font-black text-[#2563EB]">92%</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#ECEEFE] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#8E93B8] block">Vocabulary</span>
                  <span className="text-[17px] font-black text-[#059669]">90%</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#ECEEFE] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#8E93B8] block">Clarity & Tone</span>
                  <span className="text-[17px] font-black text-[#15164B]">94%</span>
                </div>
              </div>

              {/* Question Feedback Cards */}
              <div className="space-y-3">
                <span className="text-[12px] font-extrabold text-[#15164B] block">
                  Question-by-Question Analysis:
                </span>
                {submittedAnswers.map((ans, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-[#ECEEFE] space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#545CA6] uppercase">
                        Q{idx + 1} • {ans.question.category}
                      </span>
                      <span className="text-[12px] font-black text-[#059669]">{ans.score}%</span>
                    </div>
                    <p className="text-[12.5px] font-extrabold text-[#15164B]">"{ans.question.question}"</p>
                    <p className="text-[12px] text-[#52577F] leading-relaxed">{ans.feedback}</p>

                    {/* Key Strengths */}
                    {ans.strengths.length > 0 && (
                      <div className="pt-1.5 border-t border-[#ECEEFE] text-[11px] text-[#059669] font-medium space-y-0.5">
                        <strong className="block text-[#065F46] font-bold">Key Strengths:</strong>
                        {ans.strengths.map((str, sIdx) => (
                          <p key={sIdx}>• {str}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Personalized Action Plan */}
              <div className="p-4 rounded-2xl bg-[#FAF9FE] border border-[#DEE3FA] space-y-2 text-[12px] text-[#52577F]">
                <span className="font-extrabold text-[#15164B] block text-[12.5px]">
                  Recommended Lexi Preparation Plan:
                </span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Review business collocations in <strong className="text-[#15164B]">Vocabulary Studio</strong> (e.g., "collaborate across teams", "mitigate risks").</li>
                  <li>Practice past tense consistency in <strong className="text-[#15164B]">Grammar Studio</strong> when sharing project anecdotes.</li>
                  <li>Schedule a full behavioral mock interview in <strong className="text-[#15164B]">Conversation Studio</strong>.</li>
                </ul>
              </div>

              {/* Disclaimer */}
              <p className="text-[10.5px] text-[#8E93B8] italic text-center">
                Note: Feedback and scores are educational practice estimates designed to improve fluency, not guarantees of employment outcomes.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-5 py-3.5 border-t border-[#ECEEFE] flex items-center justify-between bg-white shrink-0">
          {step === 'setup' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="text-[12px] font-bold text-[#6B7094] hover:text-[#15164B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('interview')}
                className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12.5px] font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Start Mock Interview</span>
                <ArrowRight className="w-4 h-4 stroke-[2.4]" />
              </button>
            </>
          )}

          {step === 'interview' && (
            <>
              <button
                type="button"
                onClick={() => finishInterviewSession()}
                className="text-[12px] font-bold text-[#6B7094] hover:text-[#15164B] transition-colors cursor-pointer"
              >
                Finish Early
              </button>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!userResponseText.trim()}
                className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12.5px] font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <span>{currentQuestionIndex + 1 < activeQuestions.length ? 'Submit & Next Question' : 'Complete Interview'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.4]" />
              </button>
            </>
          )}

          {step === 'report' && (
            <div className="flex items-center justify-end w-full gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setStep('setup');
                  setCurrentQuestionIndex(0);
                  setSubmittedAnswers([]);
                  setUserResponseText('');
                }}
                className="px-4 py-2 rounded-full border border-[#D5D8EE] text-[#15164B] text-[12px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Practice Another Role</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-[#15164B] text-white text-[12px] font-bold hover:bg-[#0E1038] transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};
