import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useListExamPapers,
  useGenerateExamPaper,
  useDeleteExamPaper,
  getListExamPapersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Sparkles, Trash2, Eye, BookOpen, Clock, Award } from "lucide-react";

const QUESTION_TYPES = [
  { id: "mcq", label: "MCQ (1 mark each)" },
  { id: "fill-blanks", label: "Fill in the Blanks (1 mark each)" },
  { id: "true-false", label: "True or False (1 mark each)" },
  { id: "one-word", label: "One-Word Answers (1 mark each)" },
  { id: "match", label: "Match the Following (2 marks each)" },
  { id: "assertion", label: "Assertion & Reasoning (2 marks each)" },
  { id: "short", label: "Short Answer (3 marks each)" },
  { id: "case-study", label: "Case Study (4 marks each)" },
  { id: "long", label: "Long Answer (5 marks each)" },
];

const BOARDS = ["CBSE", "ICSE", "State Board", "IGCSE", "IB", "Other"];
const DIFFICULTIES = ["easy", "medium", "hard", "mixed"];
const GRADES = ["1","2","3","4","5","6","7","8","9","10","11","12","UG"];

const schema = z.object({
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  board: z.string().optional(),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  totalMarks: z.coerce.number().min(5).max(500),
  duration: z.coerce.number().optional(),
  difficulty: z.string().min(1),
  schoolName: z.string().optional(),
  teacherName: z.string().optional(),
});

export default function ExamGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["mcq", "short", "long"]);

  const { data: papers, isLoading: papersLoading } = useListExamPapers();
  const generateMutation = useGenerateExamPaper();
  const deleteMutation = useDeleteExamPaper();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      grade: "10",
      board: "CBSE",
      chapter: "",
      topic: "",
      totalMarks: 100,
      duration: 180,
      difficulty: "medium",
      schoolName: "",
      teacherName: "",
    },
  });

  function toggleType(id: string) {
    setSelectedTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  function onSubmit(values: z.infer<typeof schema>) {
    if (selectedTypes.length === 0) {
      toast({ title: "Select at least one question type", variant: "destructive" });
      return;
    }
    generateMutation.mutate(
      {
        data: {
          ...values,
          questionTypes: selectedTypes,
          board: values.board || null,
          chapter: values.chapter || null,
          topic: values.topic || null,
          duration: values.duration || null,
          schoolName: values.schoolName || null,
          teacherName: values.teacherName || null,
        },
      },
      {
        onSuccess: (paper) => {
          toast({ title: "Exam paper generated!", description: paper.title });
          queryClient.invalidateQueries({ queryKey: getListExamPapersQueryKey() });
          setLocation(`/editor/${paper.id}?type=exam`);
        },
        onError: () => {
          toast({ title: "Generation failed", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExamPapersQueryKey() });
        toast({ title: "Paper deleted" });
      },
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam Paper Generator</h1>
        <p className="text-muted-foreground mt-1">AI generates complete question papers with answer keys in seconds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Generate New Paper
              </CardTitle>
              <CardDescription>Fill in the details and AI will create a complete exam paper.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="subject" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <FormControl><Input data-testid="input-subject" placeholder="e.g. Mathematics" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="grade" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class/Grade *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-grade"><SelectValue placeholder="Select grade" /></SelectTrigger></FormControl>
                          <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>Class {g}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="board" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Board</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-board"><SelectValue placeholder="Select board" /></SelectTrigger></FormControl>
                          <SelectContent>{BOARDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="difficulty" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger data-testid="select-difficulty"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="chapter" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter / Unit</FormLabel>
                        <FormControl><Input data-testid="input-chapter" placeholder="e.g. Chapter 5" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="topic" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl><Input data-testid="input-topic" placeholder="e.g. Photosynthesis" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="totalMarks" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks *</FormLabel>
                        <FormControl><Input data-testid="input-marks" type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="duration" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl><Input data-testid="input-duration" type="number" placeholder="180" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="schoolName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name</FormLabel>
                        <FormControl><Input data-testid="input-school" placeholder="Optional" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="teacherName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher Name</FormLabel>
                        <FormControl><Input data-testid="input-teacher" placeholder="Optional" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Question Types *</Label>
                    <p className="text-xs text-muted-foreground mb-3">Select which types to include. Marks are auto-distributed.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUESTION_TYPES.map(qt => (
                        <label key={qt.id} className="flex items-center gap-2 p-2.5 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors">
                          <Checkbox
                            checked={selectedTypes.includes(qt.id)}
                            onCheckedChange={() => toggleType(qt.id)}
                            data-testid={`checkbox-qtype-${qt.id}`}
                          />
                          <span className="text-sm">{qt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={generateMutation.isPending}
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <><span className="animate-spin mr-2">⚙</span> Generating with AI...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Generate Exam Paper</>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Saved Papers */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Generated Papers</h2>
          {papersLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
          ) : papers && papers.length > 0 ? (
            <div className="space-y-3">
              {papers.map(paper => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow" data-testid={`card-exam-${paper.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold leading-tight line-clamp-2">{paper.title}</h3>
                      <Badge variant={paper.status === "ready" ? "default" : "secondary"} className="text-xs shrink-0">
                        {paper.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{paper.subject}</span>
                      <span className="flex items-center gap-1"><Award className="h-3 w-3" />{paper.totalMarks}M</span>
                      {paper.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{paper.duration}min</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setLocation(`/editor/${paper.id}?type=exam`)} data-testid={`button-view-exam-${paper.id}`}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(paper.id)} data-testid={`button-delete-exam-${paper.id}`}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No papers yet. Generate your first one!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
