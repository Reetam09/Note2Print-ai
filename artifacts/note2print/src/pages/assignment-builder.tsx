import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useListTemplates,
  useCreateDocument,
  useUploadImageToText,
  useUploadVoiceToText,
  useAiFormatDocument,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Mic, MicOff, FileText, Sparkles, Image as ImageIcon, CheckCircle } from "lucide-react";

const DOC_TYPES = [
  { value: "class-notes", label: "Class Notes" },
  { value: "homework", label: "Homework Sheet" },
  { value: "assignment", label: "Assignment" },
  { value: "worksheet", label: "Worksheet" },
  { value: "question-bank", label: "Question Bank" },
  { value: "project", label: "School Project" },
  { value: "practical", label: "Practical File" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bengali" },
];

export default function AssignmentBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState("assignment");
  const [language, setLanguage] = useState("en");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [rawText, setRawText] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState("");

  const { data: templates } = useListTemplates();
  const createDocMutation = useCreateDocument();
  const imageToTextMutation = useUploadImageToText();
  const voiceToTextMutation = useUploadVoiceToText();
  const formatDocMutation = useAiFormatDocument();

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(20);
    setProcessingStep("Reading image...");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setUploadProgress(50);
      setProcessingStep("Extracting text with AI...");
      imageToTextMutation.mutate(
        { data: { imageBase64: base64, mimeType: file.type as "image/jpeg" | "image/png" | "application/pdf", language, documentType: docType } },
        {
          onSuccess: (result) => {
            setRawText(result.rawText);
            setExtractedText(result.cleanedText);
            setUploadProgress(100);
            setProcessingStep("Text extracted!");
            toast({ title: "Text extracted!", description: "Review and format below." });
            setTimeout(() => { setUploadProgress(0); setProcessingStep(""); }, 2000);
          },
          onError: () => {
            setUploadProgress(0); setProcessingStep("");
            toast({ title: "Extraction failed", variant: "destructive" });
          },
        }
      );
    };
    reader.readAsDataURL(file);
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorder?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          setProcessingStep("Transcribing voice...");
          voiceToTextMutation.mutate(
            { data: { audioBase64: base64, mimeType: "audio/webm", language } },
            {
              onSuccess: (result) => {
                setRawText(result.rawText);
                setExtractedText(result.cleanedText);
                setProcessingStep("Transcription complete!");
                toast({ title: "Voice transcribed!", description: result.cleanedText.slice(0, 80) + "..." });
                setTimeout(() => setProcessingStep(""), 2000);
              },
              onError: () => {
                setProcessingStep("");
                toast({ title: "Transcription failed", variant: "destructive" });
              },
            }
          );
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      toast({ title: "Microphone access denied", variant: "destructive" });
    }
  }

  async function handleFormatAndSave() {
    const textToFormat = extractedText || rawText;
    if (!textToFormat.trim()) {
      toast({ title: "Please add some text first", variant: "destructive" });
      return;
    }
    setProcessingStep("Formatting with AI...");
    formatDocMutation.mutate(
      { data: { rawText: textToFormat, documentType: docType, subject: subject || null, grade: grade || null, language } },
      {
        onSuccess: (result) => {
          setProcessingStep("Saving document...");
          createDocMutation.mutate(
            {
              data: {
                title: result.title,
                type: docType,
                content: result.formattedContent,
                rawText: textToFormat,
                subject: subject || undefined,
                grade: grade || undefined,
                language,
                status: "ready",
              },
            },
            {
              onSuccess: (doc) => {
                queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
                setProcessingStep("");
                toast({ title: "Document created!", description: result.title });
                setLocation(`/editor/${doc.id}`);
              },
            }
          );
        },
        onError: () => {
          setProcessingStep("");
          toast({ title: "Formatting failed", variant: "destructive" });
        },
      }
    );
  }

  const isProcessing = imageToTextMutation.isPending || voiceToTextMutation.isPending || formatDocMutation.isPending || createDocMutation.isPending;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignment & Document Builder</h1>
        <p className="text-muted-foreground mt-1">Upload, dictate, or type your content — AI formats it into a professional document.</p>
      </div>

      {processingStep && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm font-medium text-primary">{processingStep}</span>
          {uploadProgress > 0 && <Progress value={uploadProgress} className="flex-1 h-2" />}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings */}
        <Card>
          <CardHeader><CardTitle className="text-base">Document Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger data-testid="select-doctype" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger data-testid="select-language" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input data-testid="input-subject" className="mt-1" placeholder="e.g. Biology" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>Grade / Class</Label>
              <Input data-testid="input-grade" className="mt-1" placeholder="e.g. 9" value={grade} onChange={e => setGrade(e.target.value)} />
            </div>

            {templates && templates.length > 0 && (
              <div>
                <Label className="mb-2 block">Templates</Label>
                <div className="space-y-2">
                  {templates.slice(0, 4).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setDocType(t.type)}
                      className="w-full text-left p-2.5 rounded-md border hover:bg-muted/50 transition-colors"
                      data-testid={`button-template-${t.id}`}
                    >
                      <div className="text-xs font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Input Area */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="type">
            <TabsList className="w-full">
              <TabsTrigger value="type" className="flex-1"><FileText className="h-4 w-4 mr-1" />Type / Paste</TabsTrigger>
              <TabsTrigger value="image" className="flex-1"><ImageIcon className="h-4 w-4 mr-1" />Upload Image</TabsTrigger>
              <TabsTrigger value="voice" className="flex-1"><Mic className="h-4 w-4 mr-1" />Voice</TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <Label className="mb-2 block">Your raw notes / content</Label>
                  <Textarea
                    data-testid="textarea-content"
                    placeholder="Paste your rough notes here, or type your content. AI will clean, format, and organize it into a professional document..."
                    className="min-h-[250px] font-mono text-sm resize-none"
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="image" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <input type="file" ref={fileInputRef} accept="image/*,.pdf" onChange={handleImageUpload} className="hidden" />
                  <div
                    className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="dropzone-image"
                  >
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">JPG, PNG, PDF (up to 50MB)</p>
                    <p className="text-xs text-muted-foreground mt-2">AI will extract text from handwriting or printed content</p>
                  </div>
                  {extractedText && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Text extracted</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{extractedText}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voice" className="mt-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-300 ${isRecording ? "bg-red-100 dark:bg-red-950 animate-pulse" : "bg-muted"}`}>
                    {isRecording ? <MicOff className="h-10 w-10 text-red-500" /> : <Mic className="h-10 w-10 text-muted-foreground" />}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{isRecording ? "Recording..." : "Ready to record"}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {isRecording ? "Click to stop and transcribe" : "Click to start recording your notes"}
                  </p>
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="lg"
                    data-testid="button-record"
                    disabled={voiceToTextMutation.isPending}
                  >
                    {isRecording ? <><MicOff className="h-4 w-4 mr-2" /> Stop Recording</> : <><Mic className="h-4 w-4 mr-2" /> Start Recording</>}
                  </Button>
                  {extractedText && (
                    <div className="mt-6 p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Transcription complete</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{extractedText.slice(0, 200)}...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleFormatAndSave}
              disabled={isProcessing || (!rawText.trim() && !extractedText.trim())}
              data-testid="button-format-save"
            >
              {isProcessing ? (
                <><span className="animate-spin mr-2">⚙</span> Processing...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Format with AI & Save</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
