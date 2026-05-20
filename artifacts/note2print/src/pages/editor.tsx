import { useState, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useGetDocument,
  useGetExamPaper,
  useUpdateDocument,
  useUpdateExamPaper,
  useAiGrammarCheck,
  getGetDocumentQueryKey,
  getGetExamPaperQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Save, Printer, Download, ArrowLeft, SpellCheck, Sparkles, BookOpen, FileText, Eye, Edit3, Award, Clock, ChevronDown, ChevronUp
} from "lucide-react";

export default function Editor() {
  const params = useParams<{ id: string }>();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const isExam = searchParams.get("type") === "exam";
  const id = parseInt(params.id ?? "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { data: doc, isLoading: docLoading } = useGetDocument(
    id,
    { query: { enabled: !isExam && !!id, queryKey: getGetDocumentQueryKey(id) } }
  );
  const { data: exam, isLoading: examLoading } = useGetExamPaper(
    id,
    { query: { enabled: isExam && !!id, queryKey: getGetExamPaperQueryKey(id) } }
  );

  const updateDocMutation = useUpdateDocument();
  const updateExamMutation = useUpdateExamPaper();
  const grammarMutation = useAiGrammarCheck();

  const isLoading = isExam ? examLoading : docLoading;
  const item = isExam ? exam : doc;

  useEffect(() => {
    if (doc && !isExam) {
      setEditedContent(doc.content ?? "");
      setEditedTitle(doc.title ?? "");
      setSchoolName(doc.schoolName ?? "");
      setTeacherName(doc.teacherName ?? "");
    }
    if (exam && isExam) {
      setEditedTitle(exam.title ?? "");
      setSchoolName(exam.schoolName ?? "");
      setTeacherName(exam.teacherName ?? "");
    }
  }, [doc, exam, isExam]);

  function handleSave() {
    if (isExam && exam) {
      updateExamMutation.mutate(
        { id, data: { title: editedTitle, schoolName: schoolName || undefined, teacherName: teacherName || undefined } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetExamPaperQueryKey(id) });
            toast({ title: "Saved!" });
          },
        }
      );
    } else if (doc) {
      updateDocMutation.mutate(
        { id, data: { title: editedTitle, content: editedContent, schoolName: schoolName || undefined, teacherName: teacherName || undefined } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
            toast({ title: "Saved!" });
          },
        }
      );
    }
  }

  function handleGrammarCheck() {
    if (!editedContent) return;
    grammarMutation.mutate(
      { data: { text: editedContent, language: doc?.language ?? "en" } },
      {
        onSuccess: (result) => {
          setEditedContent(result.correctedText);
          toast({ title: `Grammar checked`, description: `${result.corrections} corrections made.` });
        },
      }
    );
  }

  function handlePrint() {
    window.print();
  }

  let sections: Array<{ sectionId: string; name: string; questionType: string; marksPerQuestion: number; totalMarks: number; questions: Array<{ id: number; question: string; options?: string[]; answer?: string }> }> = [];
  if (isExam && exam?.sections) {
    try { sections = JSON.parse(exam.sections); } catch { sections = []; }
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Document not found.</p>
        <Button onClick={() => setLocation("/saved")}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Saved</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="border-b bg-card px-4 py-3 flex items-center gap-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/saved")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <span className="text-sm font-medium truncate max-w-[200px]">{editedTitle || item.title}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {!isExam && (
            <Button variant="outline" size="sm" onClick={handleGrammarCheck} disabled={grammarMutation.isPending} data-testid="button-grammar">
              <SpellCheck className="h-3.5 w-3.5 mr-1" />
              {grammarMutation.isPending ? "Checking..." : "Grammar Check"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} data-testid="button-preview">
            {previewMode ? <><Edit3 className="h-3.5 w-3.5 mr-1" /> Edit</> : <><Eye className="h-3.5 w-3.5 mr-1" /> Preview</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print">
            <Printer className="h-3.5 w-3.5 mr-1" /> Print
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateDocMutation.isPending || updateExamMutation.isPending} data-testid="button-save">
            <Save className="h-3.5 w-3.5 mr-1" />
            {(updateDocMutation.isPending || updateExamMutation.isPending) ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor / Preview */}
          <div className="lg:col-span-3">
            {/* Header fields */}
            <div className="bg-card border rounded-xl p-6 mb-4 space-y-4 print:border-0 print:p-0">
              <div className="text-center border-b pb-4">
                {schoolName && <h2 className="text-xl font-bold">{schoolName}</h2>}
                <h1 className="text-lg font-semibold mt-1">{editedTitle}</h1>
                {isExam && exam && (
                  <div className="flex justify-center gap-6 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Marks: {exam.totalMarks}</span>
                    {exam.duration && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Time: {exam.duration} min</span>}
                    {exam.grade && <span>Class: {exam.grade}</span>}
                  </div>
                )}
                {teacherName && <p className="text-sm text-muted-foreground mt-1">Teacher: {teacherName}</p>}
              </div>

              {isExam ? (
                <div className="space-y-6">
                  {sections.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No questions yet. Generate an exam paper to see content here.</p>
                  ) : (
                    sections.map((section) => (
                      <div key={section.sectionId} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-4 bg-muted/30 font-semibold text-left hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedSections(prev => ({ ...prev, [section.sectionId]: !prev[section.sectionId] }))}
                          data-testid={`toggle-section-${section.sectionId}`}
                        >
                          <div>
                            <span className="text-primary mr-2">Section {section.sectionId}:</span>
                            <span>{section.name}</span>
                            <Badge variant="outline" className="ml-3 text-xs">{section.totalMarks} marks</Badge>
                          </div>
                          {expandedSections[section.sectionId] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {(expandedSections[section.sectionId] !== false) && (
                          <div className="p-4 space-y-4">
                            {(section.questions ?? []).map((q, qi) => (
                              <div key={q.id ?? qi} className="space-y-1.5">
                                <p className="text-sm font-medium">Q{qi + 1}. {q.question} <span className="text-muted-foreground font-normal">({section.marksPerQuestion}M)</span></p>
                                {q.options && (
                                  <div className="pl-4 grid grid-cols-2 gap-1">
                                    {q.options.map((opt, oi) => (
                                      <p key={oi} className="text-sm text-muted-foreground">{opt}</p>
                                    ))}
                                  </div>
                                )}
                                {section.questionType === "fill-blanks" && (
                                  <div className="pl-4 mt-2 border-b border-dashed w-48 h-6" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                previewMode ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{editedContent}</pre>
                  </div>
                ) : (
                  <Textarea
                    data-testid="textarea-editor"
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    className="min-h-[500px] font-mono text-sm resize-none border-0 p-0 focus-visible:ring-0 shadow-none"
                    placeholder="Start typing your document content here..."
                  />
                )
              )}
            </div>
          </div>

          {/* Right panel: Settings */}
          <div className="space-y-4 print:hidden">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Document Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs mb-1 block">Title</Label>
                  <Input data-testid="input-title" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">School Name</Label>
                  <Input data-testid="input-school" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="h-8 text-sm" placeholder="Optional" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Teacher Name</Label>
                  <Input data-testid="input-teacher" value={teacherName} onChange={e => setTeacherName(e.target.value)} className="h-8 text-sm" placeholder="Optional" />
                </div>
                {isExam && exam && (
                  <>
                    <Separator />
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p><span className="font-medium text-foreground">Subject:</span> {exam.subject}</p>
                      <p><span className="font-medium text-foreground">Grade:</span> {exam.grade}</p>
                      <p><span className="font-medium text-foreground">Board:</span> {exam.board ?? "N/A"}</p>
                      <p><span className="font-medium text-foreground">Marks:</span> {exam.totalMarks}</p>
                      <p><span className="font-medium text-foreground">Difficulty:</span> <span className="capitalize">{exam.difficulty}</span></p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Export & Print</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={handlePrint} data-testid="button-print-side">
                  <Printer className="h-3.5 w-3.5 mr-1.5" /> Print Document
                </Button>
                <Button variant="outline" size="sm" className="w-full text-xs" data-testid="button-download">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
