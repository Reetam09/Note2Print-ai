import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Upload, Mic, Image as ImageIcon, FileEdit } from "lucide-react";
import {
  useGetDashboardStats,
  useGetRecentActivity,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { motion } from "framer-motion";

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

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();

  const QUICK_ACTIONS = [
    { label: "Image to Notes", desc: "Extract text from photos", icon: ImageIcon, color: "text-blue-500 bg-blue-500/10", href: "/assignment-builder" },
    { label: "Voice to Document", desc: "Dictate your content", icon: Mic, color: "text-green-500 bg-green-500/10", href: "/assignment-builder" },
    { label: "AI Exam Builder", desc: "Generate papers instantly", icon: FileEdit, color: "text-purple-500 bg-purple-500/10", href: "/exam-generator" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setLocation("/exam-generator")} data-testid="button-new-exam">
            <Plus className="h-4 w-4 mr-2" /> New Exam
          </Button>
          <Button variant="outline" onClick={() => setLocation("/assignment-builder")} data-testid="button-new-document">
            <FileText className="h-4 w-4 mr-2" /> New Document
          </Button>
        </div>
      </motion.div>

      {/* Upload Zone + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card
          className="col-span-1 md:col-span-2 border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => setLocation("/assignment-builder")}
          data-testid="card-upload-zone"
        >
          <CardContent className="flex flex-col items-center justify-center h-44 text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Drag & drop files or click to upload</h3>
            <p className="text-sm text-muted-foreground">Images (JPG, PNG), Audio (MP3, WAV), PDFs</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.label}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(action.href)}
                data-testid={`card-action-${action.label.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card data-testid="stat-total-docs">
              <CardContent className="p-5">
                <div className="text-xs font-medium text-muted-foreground mb-1">Total Documents</div>
                <div className="text-3xl font-bold">{stats?.totalDocuments ?? 0}</div>
                <div className="text-xs text-green-600 mt-1">+{stats?.documentsThisWeek ?? 0} this week</div>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-exams">
              <CardContent className="p-5">
                <div className="text-xs font-medium text-muted-foreground mb-1">Exam Papers</div>
                <div className="text-3xl font-bold">{stats?.totalExamPapers ?? 0}</div>
                <div className="text-xs text-green-600 mt-1">+{stats?.examPapersThisWeek ?? 0} this week</div>
              </CardContent>
            </Card>
            <Card data-testid="stat-this-week">
              <CardContent className="p-5">
                <div className="text-xs font-medium text-muted-foreground mb-1">Created This Week</div>
                <div className="text-3xl font-bold text-primary">
                  {(stats?.documentsThisWeek ?? 0) + (stats?.examPapersThisWeek ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">documents + papers</div>
              </CardContent>
            </Card>
            <Card data-testid="stat-doc-types">
              <CardContent className="p-5">
                <div className="text-xs font-medium text-muted-foreground mb-1">Document Types</div>
                <div className="text-3xl font-bold">{stats?.byType?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">different types</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/saved")}>View All</Button>
        </div>

        {activityLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : activity && activity.length > 0 ? (
          <div className="bg-card rounded-xl border shadow-sm divide-y">
            {activity.map((item) => (
              <motion.div
                key={`${item.kind}-${item.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                data-testid={`activity-item-${item.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${item.kind === "exam-paper" ? "bg-purple-500/10" : "bg-primary/10"}`}>
                    {item.kind === "exam-paper"
                      ? <FileEdit className="h-5 w-5 text-purple-500" />
                      : <FileText className="h-5 w-5 text-primary" />
                    }
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {item.kind === "exam-paper" ? "Exam Paper" : (TYPE_LABELS[item.type] ?? item.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setLocation(item.kind === "exam-paper" ? `/editor/${item.id}?type=exam` : `/editor/${item.id}`)}
                  data-testid={`button-open-activity-${item.id}`}
                >
                  Open
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs mt-1">Create your first document or exam paper to see it here.</p>
            <Button className="mt-4" size="sm" onClick={() => setLocation("/assignment-builder")}>
              <Plus className="h-4 w-4 mr-1" /> Create First Document
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
