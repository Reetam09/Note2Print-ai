import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Globe, School, Save } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [schoolName, setSchoolName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [defaultGrade, setDefaultGrade] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("n2p-settings");
    if (stored) {
      const s = JSON.parse(stored);
      setDarkMode(s.darkMode ?? false);
      setLanguage(s.language ?? "en");
      setSchoolName(s.schoolName ?? "");
      setTeacherName(s.teacherName ?? "");
      setDefaultGrade(s.defaultGrade ?? "");
    }
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  function toggleDarkMode(val: boolean) {
    setDarkMode(val);
    if (val) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function saveSettings() {
    localStorage.setItem("n2p-settings", JSON.stringify({ darkMode, language, schoolName, teacherName, defaultGrade }));
    toast({ title: "Settings saved!", description: "Your preferences have been updated." });
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize Note2Print AI to match your workflow.</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Appearance
          </CardTitle>
          <CardDescription>Control how Note2Print looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} data-testid="switch-darkmode" />
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4" /> Language</CardTitle>
          <CardDescription>Set your default content language for AI formatting.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label className="mb-2 block">Default Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger data-testid="select-language"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="bn">Bengali</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* School Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><School className="h-4 w-4" /> School Information</CardTitle>
          <CardDescription>This will be pre-filled on your documents and exam papers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">School Name</Label>
            <Input
              data-testid="input-school-name"
              placeholder="e.g. Delhi Public School"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block">Teacher / Author Name</Label>
            <Input
              data-testid="input-teacher-name"
              placeholder="e.g. Mrs. Sharma"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block">Default Grade / Class</Label>
            <Input
              data-testid="input-default-grade"
              placeholder="e.g. 10"
              value={defaultGrade}
              onChange={e => setDefaultGrade(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Button onClick={saveSettings} data-testid="button-save-settings" className="w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" /> Save Settings
      </Button>
    </div>
  );
}
