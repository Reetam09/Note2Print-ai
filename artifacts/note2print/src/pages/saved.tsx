import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useListDocuments,
  useListExamPapers,
  useDeleteDocument,
  useDeleteExamPaper,
  getListDocumentsQueryKey,
  getListExamPapersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, Eye, Search, BookOpen, Award, Clock, FilePlus } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  "class-notes": "Class Notes",
  "homework": "Homework",
  "assignment": "Assignment",
  "worksheet": "Worksheet",
  "question-bank": "Question Bank",
  "project": "Project",
  "practical": "Practical",
  "exam": "Exam",
};

export default function Saved() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: documents, isLoading: docsLoading } = useListDocuments();
  const { data: examPapers, isLoading: examsLoading } = useListExamPapers();
  const deleteDocMutation = useDeleteDocument();
  const deleteExamMutation = useDeleteExamPaper();

  const filteredDocs = (documents ?? []).filter(d =>
    (filterType === "all" || d.type === filterType) &&
    (search === "" || d.title.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredExams = (examPapers ?? []).filter(e =>
    (search === "" || e.title.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase()))
  );

  function handleDeleteDoc(id: number) {
    deleteDocMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: "Document deleted" });
      },
    });
  }

  function handleDeleteExam(id: number) {
    deleteExamMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExamPapersQueryKey() });
        toast({ title: "Exam paper deleted" });
      },
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Papers</h1>
          <p className="text-muted-foreground mt-1">All your documents and exam papers in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation("/assignment-builder")} variant="outline">
            <FilePlus className="h-4 w-4 mr-2" /> New Document
          </Button>
          <Button onClick={() => setLocation("/exam-generator")}>
            <FilePlus className="h-4 w-4 mr-2" /> New Exam
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search"
            placeholder="Search by title, subject..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-filter-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-documents">
            Documents {documents && <Badge variant="secondary" className="ml-1.5 text-xs">{documents.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="exams" data-testid="tab-exams">
            Exam Papers {examPapers && <Badge variant="secondary" className="ml-1.5 text-xs">{examPapers.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          {docsLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : filteredDocs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No documents found. Create one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-card rounded-lg border shadow-sm divide-y">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors" data-testid={`row-doc-${doc.id}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{TYPE_LABELS[doc.type] ?? doc.type}</Badge>
                        {doc.subject && <span className="text-xs text-muted-foreground">{doc.subject}</span>}
                        <span className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={doc.status === "ready" ? "default" : "secondary"} className="text-xs hidden sm:flex">
                      {doc.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/editor/${doc.id}`)} data-testid={`button-view-doc-${doc.id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteDoc(doc.id)} data-testid={`button-delete-doc-${doc.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exams" className="mt-4">
          {examsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : filteredExams.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No exam papers yet. Generate one from the Exam Generator.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-card rounded-lg border shadow-sm divide-y">
              {filteredExams.map(paper => (
                <div key={paper.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors" data-testid={`row-exam-${paper.id}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{paper.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Award className="h-3 w-3" />{paper.totalMarks}M</span>
                        {paper.duration && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{paper.duration}min</span>}
                        <span className="text-xs text-muted-foreground capitalize">{paper.difficulty}</span>
                        <span className="text-xs text-muted-foreground">{new Date(paper.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={paper.status === "ready" ? "default" : "secondary"} className="text-xs hidden sm:flex">
                      {paper.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/editor/${paper.id}?type=exam`)} data-testid={`button-view-exam-${paper.id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteExam(paper.id)} data-testid={`button-delete-exam-${paper.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
