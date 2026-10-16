"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Settings2,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  Type,
  AlignLeft,
  ListOrdered,
  CheckSquare,
  Sliders,
  SplitSquareVertical,
  X,
  Info,
} from "lucide-react";
import { FormConfiguration, FormQuestion, QuestionType } from "@/types";
import { FORM_TEMPLATES, FormTemplate, getTemplateById } from "@/data/form-templates";

interface FormBuilderProps {
  config: FormConfiguration;
  onChange: (updated: FormConfiguration) => void;
  eventTitle?: string;
  eventDescription?: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
}

let questionIdCounter = 0;
function createUniqueQuestionId(): string {
  questionIdCounter += 1;
  return `q_custom_${questionIdCounter}_${Math.random().toString(36).substring(2, 7)}`;
}

export function FormBuilder({
  config,
  onChange,
  eventTitle = "",
  eventDescription = "",
  eventDate = "",
  eventTime = "",
  eventVenue = "",
}: FormBuilderProps) {
  const [activeTab, setActiveTab] = useState<"questions" | "settings" | "templates">("questions");
  const [showPreview, setShowPreview] = useState(false);

  // Apply a template
  const handleSelectTemplate = (template: FormTemplate) => {
    if (
      config.questions.length > 2 &&
      !confirm(
        `Apply "${template.name}" template? This will replace your current questionnaire with the template's questions.`
      )
    ) {
      return;
    }

    onChange({
      ...config,
      templateId: template.id,
      settings: { ...template.defaultSettings },
      questions: template.questions.map((q) => ({
        ...q,
        id: createUniqueQuestionId(),
        options: q.options ? [...q.options] : undefined,
      })),
    });
    setActiveTab("questions");
  };

  // Sync Form Title with Event Title
  const handleSyncTitle = () => {
    if (!eventTitle.trim()) return;
    onChange({
      ...config,
      formTitle: `Registration: ${eventTitle} | ACM IARE`,
    });
  };

  // Sync Form Description with Event Logistics
  const handleSyncDescription = () => {
    const parts: string[] = [];
    if (eventDescription) parts.push(eventDescription);
    if (eventDate) parts.push(`📅 Date: ${eventDate}`);
    if (eventTime) parts.push(`⏰ Time: ${eventTime}`);
    if (eventVenue) parts.push(`📍 Venue: ${eventVenue}`);
    parts.push(
      "Organized by: ACM Student Chapter, Institute of Aeronautical Engineering (IARE), Dundigal, Hyderabad.\n" +
        "Please fill out this form accurately to reserve your seat."
    );

    onChange({
      ...config,
      formDescription: parts.join("\n\n"),
    });
  };

  // Question manipulation
  const addQuestion = (type: QuestionType = "text") => {
    const newQ: FormQuestion = {
      id: createUniqueQuestionId(),
      title: "",
      type,
      required: false,
      options:
        type === "multiple_choice" || type === "checkboxes" || type === "dropdown"
          ? ["Option 1", "Option 2"]
          : undefined,
      scaleMin: type === "scale" ? 1 : undefined,
      scaleMax: type === "scale" ? 5 : undefined,
      scaleMinLabel: type === "scale" ? "Low" : undefined,
      scaleMaxLabel: type === "scale" ? "High" : undefined,
    };
    onChange({
      ...config,
      questions: [...config.questions, newQ],
    });
  };

  const removeQuestion = (id: string) => {
    onChange({
      ...config,
      questions: config.questions.filter((q) => q.id !== id),
    });
  };

  const duplicateQuestion = (q: FormQuestion) => {
    const clone: FormQuestion = {
      ...q,
      id: createUniqueQuestionId(),
      title: `${q.title} (Copy)`,
      options: q.options ? [...q.options] : undefined,
    };
    const idx = config.questions.findIndex((item) => item.id === q.id);
    const newQuestions = [...config.questions];
    newQuestions.splice(idx + 1, 0, clone);
    onChange({
      ...config,
      questions: newQuestions,
    });
  };

  const moveQuestion = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= config.questions.length) return;
    const newQuestions = [...config.questions];
    const [moved] = newQuestions.splice(idx, 1);
    newQuestions.splice(targetIdx, 0, moved);
    onChange({
      ...config,
      questions: newQuestions,
    });
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    onChange({
      ...config,
      questions: config.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    });
  };

  // Option manipulation for choice questions
  const addOption = (questionId: string) => {
    const q = config.questions.find((item) => item.id === questionId);
    if (!q) return;
    const current = q.options || [];
    updateQuestion(questionId, {
      options: [...current, `Option ${current.length + 1}`],
    });
  };

  const updateOption = (questionId: string, optIdx: number, val: string) => {
    const q = config.questions.find((item) => item.id === questionId);
    if (!q || !q.options) return;
    const updated = [...q.options];
    updated[optIdx] = val;
    updateQuestion(questionId, { options: updated });
  };

  const removeOption = (questionId: string, optIdx: number) => {
    const q = config.questions.find((item) => item.id === questionId);
    if (!q || !q.options || q.options.length <= 1) return;
    const updated = q.options.filter((_, idx) => idx !== optIdx);
    updateQuestion(questionId, { options: updated });
  };

  // Helper icon for question type
  const getTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "text":
        return <Type className="w-3.5 h-3.5 text-blue-600" />;
      case "paragraph":
        return <AlignLeft className="w-3.5 h-3.5 text-blue-600" />;
      case "multiple_choice":
        return <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />;
      case "checkboxes":
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case "dropdown":
        return <ListOrdered className="w-3.5 h-3.5 text-amber-600" />;
      case "scale":
        return <Sliders className="w-3.5 h-3.5 text-indigo-600" />;
      case "date":
        return <Calendar className="w-3.5 h-3.5 text-teal-600" />;
      case "time":
        return <Clock className="w-3.5 h-3.5 text-cyan-600" />;
      case "section":
        return <SplitSquareVertical className="w-3.5 h-3.5 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      {/* Form Builder Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-[#14213d] flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            Advanced Google Forms Customizer
          </h3>
          <p className="text-xs text-slate-500">
            Define dynamic registration questions, attendee data collection rules, and Google Form confirmation text.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Preview</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "questions"
              ? "border-[#14213d] text-[#14213d]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <span>Questions ({config.questions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "settings"
              ? "border-[#14213d] text-[#14213d]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Form Information &amp; Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "templates"
              ? "border-[#14213d] text-[#14213d]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Starter Templates (6)</span>
        </button>
      </div>

      {/* TAB 1: QUESTIONS EDITOR */}
      {activeTab === "questions" && (
        <div className="space-y-4 pt-2">
          {/* Quick Add Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-700">
              Registration Questions: {config.questions.length} total (
              {config.questions.filter((q) => q.required).length} required)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addQuestion("text")}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-[#14213d] text-white rounded hover:bg-[#1f325c] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Question Cards List */}
          {config.questions.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-slate-600">No questions configured yet.</p>
              <p className="text-xs text-slate-400">
                Pick a template from the &quot;Starter Templates&quot; tab or click &quot;Add Question&quot; to build
                your form.
              </p>
              <button
                type="button"
                onClick={() => handleSelectTemplate(getTemplateById("workshop"))}
                className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100"
              >
                Load Default Workshop Questions
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {config.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded capitalize">
                        {getTypeIcon(q.type)}
                        {q.type.replace("_", " ")}
                      </span>
                      {q.required && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                          Required *
                        </span>
                      )}
                    </div>

                    {/* Controls: Reorder, Duplicate, Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, "down")}
                        disabled={idx === config.questions.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateQuestion(q)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Duplicate Question"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Title */}
                    <div className="sm:col-span-8">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Question Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={q.title}
                        onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                        placeholder="e.g., IARE Roll Number, Problem Track, etc."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    {/* Question Type */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Question Type
                      </label>
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const newType = e.target.value as QuestionType;
                          updateQuestion(q.id, {
                            type: newType,
                            options:
                              newType === "multiple_choice" ||
                              newType === "checkboxes" ||
                              newType === "dropdown"
                                ? q.options && q.options.length > 0
                                  ? q.options
                                  : ["Option 1", "Option 2"]
                                : undefined,
                            scaleMin: newType === "scale" ? 1 : undefined,
                            scaleMax: newType === "scale" ? 5 : undefined,
                            scaleMinLabel: newType === "scale" ? "Low" : undefined,
                            scaleMaxLabel: newType === "scale" ? "High" : undefined,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="text">Short Answer</option>
                        <option value="paragraph">Paragraph (Long Text)</option>
                        <option value="multiple_choice">Multiple Choice (Single Pick)</option>
                        <option value="checkboxes">Checkboxes (Multi Pick)</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="scale">Linear Scale (Rating)</option>
                        <option value="date">Date Picker</option>
                        <option value="time">Time Picker</option>
                        <option value="section">Section Header (Information block)</option>
                      </select>
                    </div>

                    {/* Help Text / Description */}
                    <div className="sm:col-span-9">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Help Text / Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={q.helpText || ""}
                        onChange={(e) => updateQuestion(q.id, { helpText: e.target.value })}
                        placeholder="Sub-label displayed below the question to guide respondents..."
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 bg-slate-50 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    {/* Required Checkbox */}
                    <div className="sm:col-span-3 flex items-end pb-1.5">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-600 border-slate-300"
                        />
                        <span>Required Field</span>
                      </label>
                    </div>
                  </div>

                  {/* Choice Options Editor (For Multiple Choice, Checkboxes, Dropdown) */}
                  {(q.type === "multiple_choice" || q.type === "checkboxes" || q.type === "dropdown") && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Answer Choices:
                      </label>
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs">
                              {q.type === "multiple_choice" ? "○" : q.type === "checkboxes" ? "□" : `${optIdx + 1}.`}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                              className="w-full max-w-md px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                            />
                            {(q.options || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOption(q.id, optIdx)}
                                className="text-slate-400 hover:text-red-500 p-1"
                                title="Remove Choice"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => addOption(q.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline pt-1"
                      >
                        <Plus className="w-3 h-3" /> Add Choice
                      </button>
                    </div>
                  )}

                  {/* Linear Scale Editor */}
                  {q.type === "scale" && (
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Min Value
                        </label>
                        <select
                          value={q.scaleMin ?? 1}
                          onChange={(e) => updateQuestion(q.id, { scaleMin: parseInt(e.target.value, 10) })}
                          className="w-full px-2 py-1 border border-slate-300 rounded"
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Max Value
                        </label>
                        <select
                          value={q.scaleMax ?? 5}
                          onChange={(e) => updateQuestion(q.id, { scaleMax: parseInt(e.target.value, 10) })}
                          className="w-full px-2 py-1 border border-slate-300 rounded"
                        >
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                          <option value={7}>7</option>
                          <option value={10}>10</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Lower Label (e.g. Poor)
                        </label>
                        <input
                          type="text"
                          value={q.scaleMinLabel || ""}
                          onChange={(e) => updateQuestion(q.id, { scaleMinLabel: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Upper Label (e.g. Excellent)
                        </label>
                        <input
                          type="text"
                          value={q.scaleMaxLabel || ""}
                          onChange={(e) => updateQuestion(q.id, { scaleMaxLabel: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FORM INFORMATION & SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-5 pt-2">
          {/* Form Title & Description */}
          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Google Form Public Header Title</label>
              {eventTitle && (
                <button
                  type="button"
                  onClick={handleSyncTitle}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Sync with Event Title
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={config.formTitle}
              onChange={(e) => onChange({ ...config, formTitle: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-bold text-slate-800">
                Google Form Header Description &amp; Instructions
              </label>
              <button
                type="button"
                onClick={handleSyncDescription}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Auto-fill from Event Logistics
              </button>
            </div>
            <textarea
              rows={4}
              value={config.formDescription}
              onChange={(e) => onChange({ ...config, formDescription: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-sans"
            />
          </div>

          {/* Confirmation Message */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              Submission Confirmation Message (FormApp.setConfirmationMessage)
            </label>
            <p className="text-[11px] text-slate-500">
              The customized notice attendees see immediately upon submitting their registration form.
            </p>
            <textarea
              rows={3}
              value={config.settings.confirmationMessage}
              onChange={(e) =>
                onChange({
                  ...config,
                  settings: { ...config.settings, confirmationMessage: e.target.value },
                })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Registration Settings Toggles */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Registration Policies (Supported by Google FormApp)
            </h4>

            <div className="space-y-3">
              {/* Collect Email */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.settings.collectEmail}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      settings: { ...config.settings, collectEmail: e.target.checked },
                    })
                  }
                  className="rounded mt-0.5 text-blue-600 focus:ring-blue-600 border-slate-300"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Collect Verified Respondent Email Addresses
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Automatically logs attendee Google Account email addresses with the response.
                  </span>
                </div>
              </label>

              {/* Limit One Response */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.settings.limitOneResponsePerUser}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      settings: { ...config.settings, limitOneResponsePerUser: e.target.checked },
                    })
                  }
                  className="rounded mt-0.5 text-blue-600 focus:ring-blue-600 border-slate-300"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Limit to 1 Response per Attendee
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Requires respondents to sign into Google to prevent duplicate ballot/registration stuffing.
                  </span>
                </div>
              </label>

              {/* Allow Response Edits */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.settings.allowResponseEdits}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      settings: { ...config.settings, allowResponseEdits: e.target.checked },
                    })
                  }
                  className="rounded mt-0.5 text-blue-600 focus:ring-blue-600 border-slate-300"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Allow Attendees to Edit Responses After Submitting
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Permits students to correct typos or update their GitHub link after initial registration.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Form Styling Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Google Forms Visual Theme &amp; Header Banner Note:</strong>
              <p className="text-[11px] text-blue-800 mt-0.5">
                The Google Apps Script FormApp API programmatically provisions titles, descriptions, confirmation
                messages, and all question item types. Custom background images or custom color hex overrides are
                controlled directly in the Google Forms web editor using the private Edit URL provided in your
                dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STARTER TEMPLATES */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
          {FORM_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className={`border rounded-lg p-4 flex flex-col justify-between transition-all ${
                config.templateId === tmpl.id
                  ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {tmpl.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {tmpl.questions.length} Questions
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{tmpl.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-3">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="w-full py-1.5 px-3 rounded text-xs font-semibold text-center bg-slate-100 hover:bg-[#14213d] hover:text-white transition-colors"
                >
                  Load Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INTERACTIVE FORM PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Interactive Google Form Preview
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body simulating Google Form */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Form Top Banner Card */}
              <div className="bg-white rounded-xl shadow-xs border-t-8 border-t-[#14213d] border border-slate-200 p-6 space-y-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#14213d] tracking-tight">
                  {config.formTitle || "Event Registration | ACM IARE"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {config.formDescription || "Please complete the registration form below."}
                </p>

                {config.settings.collectEmail && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>The name and email associated with your Google account will be recorded on submission.</span>
                  </div>
                )}
                <div className="text-[11px] text-red-600 font-semibold">* Indicates required question</div>
              </div>

              {/* Questions Simulated */}
              {config.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-2.5"
                >
                  <label className="text-xs sm:text-sm font-semibold text-slate-800 block">
                    {q.title || "Untitled Question"}
                    {q.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                  </label>

                  {q.helpText && (
                    <p className="text-[11px] text-slate-500 italic">{q.helpText}</p>
                  )}

                  {/* Render Mock Inputs */}
                  {q.type === "text" && (
                    <input
                      type="text"
                      disabled
                      placeholder="Your answer"
                      className="w-full sm:w-80 px-2 py-1.5 border-b-2 border-slate-300 bg-transparent text-xs text-slate-400 focus:outline-none"
                    />
                  )}

                  {q.type === "paragraph" && (
                    <textarea
                      disabled
                      rows={2}
                      placeholder="Your long answer text"
                      className="w-full px-2 py-1.5 border-b-2 border-slate-300 bg-transparent text-xs text-slate-400 focus:outline-none"
                    />
                  )}

                  {q.type === "multiple_choice" && (
                    <div className="space-y-1.5 pt-1">
                      {(q.options || ["Option 1", "Option 2"]).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 text-xs text-slate-700">
                          <input type="radio" disabled name={`q_${q.id}`} className="text-blue-600" />
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "checkboxes" && (
                    <div className="space-y-1.5 pt-1">
                      {(q.options || ["Option 1", "Option 2"]).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 text-xs text-slate-700">
                          <input type="checkbox" disabled className="rounded text-blue-600" />
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "dropdown" && (
                    <select
                      disabled
                      className="w-full sm:w-72 px-3 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-500"
                    >
                      <option>Choose...</option>
                      {(q.options || []).map((opt, oIdx) => (
                        <option key={oIdx}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {q.type === "scale" && (
                    <div className="overflow-x-auto py-2">
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>{q.scaleMinLabel || "1"}</span>
                        {Array.from(
                          { length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 },
                          (_, i) => (q.scaleMin ?? 1) + i
                        ).map((num) => (
                          <div key={num} className="flex flex-col items-center gap-1">
                            <span className="text-[11px] font-mono">{num}</span>
                            <input type="radio" disabled name={`scale_${q.id}`} />
                          </div>
                        ))}
                        <span>{q.scaleMaxLabel || "5"}</span>
                      </div>
                    </div>
                  )}

                  {q.type === "date" && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 border border-slate-200 rounded px-3 py-1.5 w-48">
                      <Calendar className="w-4 h-4" />
                      <span>YYYY-MM-DD</span>
                    </div>
                  )}

                  {q.type === "time" && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 border border-slate-200 rounded px-3 py-1.5 w-48">
                      <Clock className="w-4 h-4" />
                      <span>Time (AM / PM)</span>
                    </div>
                  )}

                  {q.type === "section" && (
                    <div className="p-3 bg-slate-50 border-l-4 border-l-blue-600 rounded text-xs text-slate-600">
                      Section Header / Page Break
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Button preview */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled
                  className="px-6 py-2 bg-[#14213d] text-white rounded font-bold text-xs shadow-xs opacity-80 cursor-not-allowed"
                >
                  Submit
                </button>
                <span className="text-[11px] text-slate-400 italic">
                  Clear form
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Interactive Draft Preview — Generated real form will be hosted on Google Forms.</span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
