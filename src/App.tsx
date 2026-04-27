/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  HelpCircle, 
  Layers, 
  Library, 
  Loader2, 
  Play, 
  Search, 
  Star,
  ChevronRight,
  ExternalLink,
  Target,
  Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Subtopic {
  name: string;
  summary: string;
  difficulty: "easy" | "medium" | "hard";
  est_hours: number;
}

interface Resource {
  subtopic: string;
  title: string;
  format: "video" | "article" | "book" | "course" | "interactive";
  why: string;
}

interface ScheduleDay {
  day: number;
  focus: string;
  blocks: { subtopic: string; activity: string; minutes: number }[];
  reflection: string;
}

interface QuizQuestion {
  subtopic: string;
  question: string;
  type: "multiple_choice" | "short_answer";
  options: string[];
  answer: string;
}

interface StudyPlan {
  subtopics: Subtopic[];
  resources: Resource[];
  schedule: ScheduleDay[];
  quiz: QuizQuestion[];
}

const AGENTS = [
  { id: "analyzer", name: "Topic Analyzer", icon: Layers, desc: "Breaking down the subject..." },
  { id: "curator", name: "Resource Curator", icon: Library, desc: "Finding the best sources..." },
  { id: "scheduler", name: "Schedule Builder", icon: Calendar, desc: "Optimizing your time..." },
  { id: "quizzer", name: "Quiz Generator", icon: HelpCircle, desc: "Preparing assessments..." },
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [days, setDays] = useState(7);
  const [hours, setHours] = useState(2);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Input, 1: Loading/Agents, 2: Report
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setActiveAgentIndex((prev) => (prev < AGENTS.length - 1 ? prev + 1 : prev));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(1);
    setActiveAgentIndex(0);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          skillLevel,
          daysAvailable: days,
          hoursPerDay: hours
        }),
      });

      if (!response.ok) throw new Error("Failed to generate plan");
      
      const data = await response.json();
      setPlan(data);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please check your API key and try again.");
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "hard": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const currentDayPlan = plan?.schedule.find(d => d.day === selectedDay);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-slate-800 tracking-tight">Multi-Agent Planner</h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
          <span>V1.0</span>
          <div className="w-[1px] h-4 bg-slate-200" />
          <span>LLAMA-3.3-70B</span>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {/* STEP 0: INPUT FORM */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Architect your learning journey</h2>
                <p className="text-slate-500 max-w-md mx-auto">Enter a topic and our AI agent swarm will curate a personalized curriculum and schedule for you.</p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject Topic</label>
                  <input 
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Quantum Physics, Modern Art History, React Architecture"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Skill Level</label>
                    <select 
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Duration (Days)</label>
                    <input 
                      type="number"
                      min="1"
                      max="30"
                      value={days}
                      onChange={(e) => setDays(parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hours / Day</label>
                    <input 
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={hours}
                      onChange={(e) => setHours(parseFloat(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Initialize Agent Swarm
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 1: LOADING AGENTS */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="relative mb-12">
                <div className="w-24 h-24 border-4 border-indigo-100 rounded-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                </div>
              </div>

              <div className="space-y-4 w-full max-w-md">
                {AGENTS.map((agent, i) => {
                  const isActive = i === activeAgentIndex;
                  const isDone = i < activeAgentIndex;
                  return (
                    <div 
                      key={agent.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                        isActive ? "bg-white border-indigo-200 shadow-lg scale-105" : "bg-white/50 border-transparent opacity-50"
                      } ${isDone ? "bg-emerald-50 border-emerald-100 opacity-100" : ""}`}
                    >
                      <div className={`p-2 rounded-lg ${isActive ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400"} ${isDone ? "bg-emerald-500 text-white" : ""}`}>
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : <agent.icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{agent.name}</h4>
                        <p className="text-xs text-slate-500">{isActive ? agent.desc : isDone ? "Task completed" : "Waiting for input..."}</p>
                      </div>
                      {isActive && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 2: THE REPORT */}
          {step === 2 && plan && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Report Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">Report Finalized</span>
                    <span className="text-slate-400 text-sm font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">{topic}</h2>
                  <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>{skillLevel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{days} Days / {hours}h Daily</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>Optimized Curriculum</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setStep(0)}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
                >
                  Generate New Plan
                </button>
              </div>

              {/* GRID LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Subtopics & Resources */}
                <div className="lg:col-span-8 space-y-12">
                  
                  {/* Curated Subtopics */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-6 bg-slate-900 rounded-full" />
                      <h3 className="text-xl font-bold tracking-tight">Curated Subtopics</h3>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">#</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Module / Concept</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Difficulty</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Est. Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {plan.subtopics.map((s, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-5 font-mono text-xs text-slate-400">0{i+1}</td>
                              <td className="px-6 py-5">
                                <p className="font-semibold text-slate-800 leading-tight mb-1">{s.name}</p>
                                <p className="text-sm text-slate-500 line-clamp-1">{s.summary}</p>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getDifficultyColor(s.difficulty)}`}>
                                  {s.difficulty}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  {s.est_hours}h
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Resource Library */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-6 bg-slate-900 rounded-full" />
                      <h3 className="text-xl font-bold tracking-tight">Resource Library</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.resources.map((r, i) => (
                        <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl flex gap-4 hover:border-indigo-300 transition-all group">
                          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                            <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded tracking-wide">{r.format}</span>
                              <span className="text-[10px] font-medium text-slate-400">• {r.subtopic}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1 leading-snug group-hover:text-indigo-900">{r.title}</h4>
                            <p className="text-xs text-slate-500 italic">"{r.why}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Daily Schedule */}
                <div className="lg:col-span-4 space-y-8">
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-6 bg-slate-900 rounded-full" />
                      <h3 className="text-xl font-bold tracking-tight">Active Schedule</h3>
                    </div>
                    
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                      {/* Day Selector */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
                        {plan.schedule.map(d => (
                          <button
                            key={d.day}
                            onClick={() => setSelectedDay(d.day)}
                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                              selectedDay === d.day 
                                ? "bg-slate-900 text-white shadow-lg" 
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {d.day}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-6">
                        <div className="pb-4 border-b border-slate-100">
                          <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1">Focus Mode</p>
                          <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{currentDayPlan?.focus}</h4>
                        </div>

                        <div className="space-y-4">
                          {currentDayPlan?.blocks.map((block, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 bg-slate-200 rounded-full border-4 border-white shadow-sm ring-1 ring-slate-100" />
                                {i !== currentDayPlan.blocks.length - 1 && <div className="w-[1px] flex-1 bg-slate-100 my-1" />}
                              </div>
                              <div className="pb-4">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="font-mono text-xs font-bold text-slate-900">{block.minutes}m</span>
                                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">/ {block.subtopic}</span>
                                </div>
                                <p className="text-sm text-slate-600 leading-tight">{block.activity}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Reflection</span>
                          </div>
                          <p className="text-sm text-slate-700 italic">"{currentDayPlan?.reflection}"</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Knowledge Check */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-6 bg-slate-900 rounded-full" />
                      <h3 className="text-xl font-bold tracking-tight">Practice Quiz</h3>
                    </div>
                    <div className="space-y-4">
                      {plan.quiz.map((q, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">{q.subtopic}</p>
                          <h5 className="font-bold text-slate-800 mb-4">{q.question}</h5>
                          {q.type === "multiple_choice" && (
                            <div className="grid grid-cols-1 gap-2">
                              {q.options.map((opt, idx) => (
                                <div key={idx} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 flex justify-between group cursor-help">
                                  {opt}
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 font-bold tracking-tighter uppercase text-[10px]">Verify</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <details className="mt-4">
                            <summary className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors list-none flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" /> Reveal Correct Answer
                            </summary>
                            <div className="mt-2 p-3 bg-indigo-50 text-indigo-900 rounded-xl text-sm font-semibold border border-indigo-100">
                              {q.answer}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="mt-20 border-t border-slate-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="text-sm font-bold text-slate-400 tracking-tight">AGENTIC STUDY PLANNER</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Safety Guidelines</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Groq API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

