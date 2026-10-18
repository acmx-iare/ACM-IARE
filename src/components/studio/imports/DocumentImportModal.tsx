"use client";

import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Check,
  AlertCircle,
  X,
  ArrowRight,
  Code2,
  Sparkles,
  Eye,
  CheckCircle2,
  Layers,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (mappedData: Record<string, any>) => void;
  targetSection: "about" | "home";
  currentData: Record<string, any>;
}

export function DocumentImportModal({
  isOpen,
  onClose,
  onImport,
  targetSection,
  currentData,
}: DocumentImportModalProps) {
  const [step, setStep] = useState<"input" | "mapping" | "preview">("input");
  const [rawText, setRawText] = useState("");
  const [fileType, setFileType] = useState<"markdown" | "txt" | "html" | "json">("markdown");
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  // Extracted Fields
  const [parsedFields, setParsedFields] = useState<{
    title?: string;
    tagline?: string;
    lead?: string;
    mission?: string;
    vision?: string;
    pillars?: Array<{ title: string; description: string }>;
  }>({});

  // Field selection toggles
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    title: true,
    tagline: true,
    lead: true,
    mission: true,
    vision: true,
    pillars: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Safe HTML parsing using DOMParser
  const parseSafeHtml = (htmlContent: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      // Strip dangerous elements
      const dangerousTags = ["script", "style", "iframe", "object", "embed", "link"];
      dangerousTags.forEach((tag) => {
        const elems = doc.querySelectorAll(tag);
        elems.forEach((el) => el.remove());
      });

      // Strip dangerous attributes
      const allElements = doc.querySelectorAll("*");
      allElements.forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          if (attr.name.startsWith("on") || attr.value.startsWith("javascript:")) {
            el.removeAttribute(attr.name);
          }
        });
      });

      const h1 = doc.querySelector("h1")?.textContent?.trim() || "";
      const h2 = doc.querySelector("h2")?.textContent?.trim() || "";
      const paragraphs = Array.from(doc.querySelectorAll("p"))
        .map((p) => p.textContent?.trim() || "")
        .filter(Boolean);

      // Look for mission/vision keywords
      let mission = "";
      let vision = "";
      let lead = "";

      paragraphs.forEach((p) => {
        const lower = p.toLowerCase();
        if (lower.includes("mission")) {
          mission = p.replace(/^mission[:\s-]*/i, "").trim();
        } else if (lower.includes("vision")) {
          vision = p.replace(/^vision[:\s-]*/i, "").trim();
        } else if (!lead && p.length > 50) {
          lead = p;
        }
      });

      // Look for list items (pillars)
      const listItems = Array.from(doc.querySelectorAll("li"))
        .map((li) => li.textContent?.trim() || "")
        .filter(Boolean);

      const pillars = listItems.slice(0, 4).map((text, idx) => {
        const parts = text.split(/[:-]/);
        return {
          title: parts[0]?.trim() || `Pillar ${idx + 1}`,
          description: parts[1]?.trim() || parts[0]?.trim() || "",
        };
      });

      return {
        title: h1 || undefined,
        tagline: h2 || undefined,
        lead: lead || paragraphs[0] || undefined,
        mission: mission || undefined,
        vision: vision || undefined,
        pillars: pillars.length > 0 ? pillars : undefined,
      };
    } catch (err: any) {
      throw new Error(`HTML parsing failed: ${err.message}`);
    }
  };

  // Markdown & TXT parsing
  const parseMarkdownOrText = (content: string) => {
    const lines = content.split(/\r?\n/);
    let title = "";
    let tagline = "";
    let lead = "";
    let mission = "";
    let vision = "";
    const pillars: Array<{ title: string; description: string }> = [];

    let currentSection = "";
    const bodyParagraphs: string[] = [];
    let currentParagraph = "";

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      // H1 detection
      if (line.startsWith("# ") && !title) {
        title = line.replace(/^#\s+/, "").trim();
        return;
      }

      // H2 detection
      if (line.startsWith("## ")) {
        const headingText = line.replace(/^##\s+/, "").trim().toLowerCase();
        if (headingText.includes("mission")) {
          currentSection = "mission";
        } else if (headingText.includes("vision")) {
          currentSection = "vision";
        } else if (headingText.includes("pillar") || headingText.includes("value") || headingText.includes("focus")) {
          currentSection = "pillars";
        } else if (!tagline) {
          tagline = line.replace(/^##\s+/, "").trim();
          currentSection = "narrative";
        } else {
          currentSection = "narrative";
        }
        return;
      }

      // Bullets (Pillars)
      if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line)) {
        const bulletText = line.replace(/^[-*]\s+|\d+\.\s+/, "").trim();
        if (currentSection === "pillars" || !currentSection) {
          const parts = bulletText.split(/[:-]/);
          pillars.push({
            title: parts[0]?.trim() || `Pillar ${pillars.length + 1}`,
            description: parts.length > 1 ? parts.slice(1).join(":").trim() : bulletText,
          });
          return;
        }
      }

      // Paragraph gathering
      if (line === "") {
        if (currentParagraph) {
          if (currentSection === "mission") mission = currentParagraph;
          else if (currentSection === "vision") vision = currentParagraph;
          else bodyParagraphs.push(currentParagraph);
          currentParagraph = "";
        }
      } else {
        currentParagraph = currentParagraph ? `${currentParagraph} ${line}` : line;
      }
    });

    if (currentParagraph) {
      if (currentSection === "mission") mission = currentParagraph;
      else if (currentSection === "vision") vision = currentParagraph;
      else bodyParagraphs.push(currentParagraph);
    }

    if (!lead && bodyParagraphs.length > 0) {
      lead = bodyParagraphs[0];
    }

    return {
      title: title || undefined,
      tagline: tagline || undefined,
      lead: lead || undefined,
      mission: mission || undefined,
      vision: vision || undefined,
      pillars: pillars.length > 0 ? pillars : undefined,
    };
  };

  // JSON schema parsing
  const parseJsonContent = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      return {
        title: data.hero?.title || data.title,
        tagline: data.hero?.tagline || data.tagline,
        lead: data.narrative?.lead || data.lead || data.narrativeLead,
        mission: data.mission,
        vision: data.vision,
        pillars: data.academicPillars || data.pillars || data.features,
      };
    } catch (err: any) {
      throw new Error(`Invalid JSON syntax: ${err.message}`);
    }
  };

  // Execute parsing based on detected or selected type
  const handleParseDocument = () => {
    setParseError(null);
    if (!rawText.trim()) {
      setParseError("Please enter text or select a file to import.");
      return;
    }

    try {
      let result;
      if (fileType === "json") {
        result = parseJsonContent(rawText);
      } else if (fileType === "html") {
        result = parseSafeHtml(rawText);
      } else {
        result = parseMarkdownOrText(rawText);
      }

      setParsedFields(result);
      setStep("mapping");
    } catch (err: any) {
      setParseError(err.message || "Failed to parse document content.");
    }
  };

  // Handle local file selection
  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension === "json") setFileType("json");
    else if (extension === "html" || extension === "htm") setFileType("html");
    else if (extension === "txt") setFileType("txt");
    else setFileType("markdown");

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawText(content || "");
    };
    reader.readAsText(file);
  };

  // Apply mapped fields to form data
  const handleApplyImport = () => {
    const updated: Record<string, any> = JSON.parse(JSON.stringify(currentData));

    if (targetSection === "about") {
      if (selectedFields.title && parsedFields.title) {
        updated.hero = { ...(updated.hero || {}), title: parsedFields.title };
      }
      if (selectedFields.tagline && parsedFields.tagline) {
        updated.hero = { ...(updated.hero || {}), tagline: parsedFields.tagline };
      }
      if (selectedFields.lead && parsedFields.lead) {
        updated.narrative = { ...(updated.narrative || {}), lead: parsedFields.lead };
      }
      if (selectedFields.mission && parsedFields.mission) {
        updated.mission = parsedFields.mission;
      }
      if (selectedFields.vision && parsedFields.vision) {
        updated.vision = parsedFields.vision;
      }
      if (selectedFields.pillars && parsedFields.pillars) {
        updated.academicPillars = parsedFields.pillars;
      }
    } else if (targetSection === "home") {
      if (selectedFields.title && parsedFields.title) {
        updated.hero = { ...(updated.hero || {}), titlePrefix: parsedFields.title };
      }
      if (selectedFields.lead && parsedFields.lead) {
        updated.hero = { ...(updated.hero || {}), description: parsedFields.lead };
      }
    }

    onImport(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Import Document Content
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 uppercase">
                  Target: {targetSection} Section
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Markdown, Plain Text, Clean HTML or JSON • Safe Parsing &amp; Block Mapping
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center gap-3 text-xs text-slate-600">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === "input" ? "bg-purple-600 text-white" : "bg-emerald-600 text-white"
            }`}
          >
            1
          </span>
          <span className={step === "input" ? "font-bold text-slate-900" : ""}>Select File or Paste</span>

          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === "mapping"
                ? "bg-purple-600 text-white"
                : step === "preview"
                ? "bg-emerald-600 text-white"
                : "bg-slate-300 text-slate-700"
            }`}
          >
            2
          </span>
          <span className={step === "mapping" ? "font-bold text-slate-900" : ""}>Review Detected Blocks</span>

          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === "preview" ? "bg-purple-600 text-white" : "bg-slate-300 text-slate-700"
            }`}
          >
            3
          </span>
          <span className={step === "preview" ? "font-bold text-slate-900" : ""}>Diff &amp; Confirm</span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* STEP 1: INPUT */}
          {step === "input" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Format:</span>
                  {(["markdown", "txt", "html", "json"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFileType(t)}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold uppercase transition-colors ${
                        fileType === t
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.markdown,.txt,.html,.htm,.json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    {fileName ? `Loaded: ${fileName}` : "Upload Document File"}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Content (or paste raw text below)
                </label>
                <textarea
                  rows={10}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={
                    fileType === "markdown"
                      ? "# Chapter Overview\n## Advancing computing at IARE\n\nThe ACM Student Chapter unites passionate student developers...\n\n## Official Mission\nTo cultivate an intellectually rigorous computing ecosystem...\n\n## Vision Statement\nTo be the premier collegiate computing organization in Telangana..."
                      : fileType === "html"
                      ? "<h1>Chapter Overview</h1>\n<p>The ACM Student Chapter at IARE...</p>\n<h2>Mission</h2>\n<p>To cultivate computing excellence...</p>"
                      : "Paste raw document content here..."
                  }
                  className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-slate-50/50"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MAPPING BLOCKS */}
          {step === "mapping" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                The document parser identified the following content blocks. Check the sections you wish to apply to your draft:
              </p>

              <div className="space-y-3">
                {/* Title */}
                {parsedFields.title && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-900">
                        Page Title: &quot;{parsedFields.title}&quot;
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedFields.title}
                        onChange={(e) =>
                          setSelectedFields({ ...selectedFields, title: e.target.checked })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                  </div>
                )}

                {/* Tagline */}
                {parsedFields.tagline && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-900">
                        Tagline / Subheading
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedFields.tagline}
                        onChange={(e) =>
                          setSelectedFields({ ...selectedFields, tagline: e.target.checked })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                    <p className="text-xs text-slate-600 italic">&quot;{parsedFields.tagline}&quot;</p>
                  </div>
                )}

                {/* Lead Narrative */}
                {parsedFields.lead && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-900">
                        Narrative Lead Paragraph
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedFields.lead}
                        onChange={(e) =>
                          setSelectedFields({ ...selectedFields, lead: e.target.checked })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                    <p className="text-xs text-slate-600 line-clamp-3">{parsedFields.lead}</p>
                  </div>
                )}

                {/* Mission */}
                {parsedFields.mission && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-900">
                        Mission Statement
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedFields.mission}
                        onChange={(e) =>
                          setSelectedFields({ ...selectedFields, mission: e.target.checked })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                    <p className="text-xs text-slate-600">{parsedFields.mission}</p>
                  </div>
                )}

                {/* Vision */}
                {parsedFields.vision && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-900">
                        Vision Statement
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedFields.vision}
                        onChange={(e) =>
                          setSelectedFields({ ...selectedFields, vision: e.target.checked })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                    <p className="text-xs text-slate-600">{parsedFields.vision}</p>
                  </div>
                )}

                {/* Academic Pillars */}
                {parsedFields.pillars && parsedFields.pillars.length > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-900">
                        Academic Pillars / Focus Areas ({parsedFields.pillars.length})
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedFields.pillars}
                        onChange={(e) =>
                          setSelectedFields({ ...selectedFields, pillars: e.target.checked })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {parsedFields.pillars.map((p, idx) => (
                        <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-[11px]">
                          <span className="font-bold text-slate-800 block">{p.title}</span>
                          <span className="text-slate-500">{p.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: DIFF & PREVIEW */}
          {step === "preview" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Review the proposed updates before injecting into your working draft:
              </p>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
                {selectedFields.lead && parsedFields.lead && (
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Current Draft Lead
                      </span>
                      <p className="text-slate-600 line-clamp-3">
                        {currentData.narrative?.lead || currentData.hero?.description || "Empty"}
                      </p>
                    </div>
                    <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                        Proposed Replacement
                      </span>
                      <p className="text-emerald-900">{parsedFields.lead}</p>
                    </div>
                  </div>
                )}

                {selectedFields.mission && parsedFields.mission && (
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Current Draft Mission
                      </span>
                      <p className="text-slate-600 line-clamp-3">{currentData.mission || "Empty"}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                        Proposed Replacement
                      </span>
                      <p className="text-emerald-900">{parsedFields.mission}</p>
                    </div>
                  </div>
                )}

                {selectedFields.vision && parsedFields.vision && (
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Current Draft Vision
                      </span>
                      <p className="text-slate-600 line-clamp-3">{currentData.vision || "Empty"}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                        Proposed Replacement
                      </span>
                      <p className="text-emerald-900">{parsedFields.vision}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500">
            {step === "input" && <span>Supported: Markdown, TXT, HTML, JSON</span>}
            {step === "mapping" && <span>Select which content blocks to import</span>}
            {step === "preview" && <span>Changes will be applied to your editor draft</span>}
          </div>

          <div className="flex items-center gap-2">
            {step !== "input" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (step === "mapping") setStep("input");
                  if (step === "preview") setStep("mapping");
                }}
                className="text-xs"
              >
                Back
              </Button>
            )}

            {step === "input" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleParseDocument}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
                >
                  Parse Document <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}

            {step === "mapping" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setStep("preview")}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
              >
                Preview Diff <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}

            {step === "preview" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleApplyImport}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Apply to Draft
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
