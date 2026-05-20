import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, FileText, CheckCircle2, Mic, Image as ImageIcon, Zap, Printer } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const [, setLocation] = useLocation();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-2xl text-primary tracking-tight">Note2Print AI</div>
          <div className="hidden md:flex gap-6 items-center">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#document-types" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Document Types</a>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setLocation("/dashboard")}>Log in</Button>
            <Button onClick={() => setLocation("/dashboard")}>Get Started</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-24 md:py-32 container mx-auto px-4 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <motion.div initial="initial" animate="animate" variants={staggerContainer} className="max-w-4xl mx-auto">
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Zap className="h-4 w-4" /> The smart assistant for educators
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              Turn teaching chaos into <br className="hidden md:block" />
              <span className="text-primary">polished documents.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload a blurry photo of hand-written notes or record your voice. Note2Print AI generates print-ready exam papers, class notes, and assignments in seconds.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto" onClick={() => setLocation("/dashboard")}>
                Start Creating Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto bg-background" onClick={() => setLocation("/exam-generator")}>
                Try Exam Generator
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How it works</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">From raw thought to print-ready paper in four simple steps.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { title: "Capture", desc: "Snap a photo of notes or record your voice.", icon: Mic },
                { title: "Process", desc: "AI extracts text and understands context.", icon: Zap },
                { title: "Format", desc: "Select a document type and template.", icon: FileText },
                { title: "Print", desc: "Export as PDF with your school's branding.", icon: Printer }
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className="flex flex-col items-center text-center z-10 relative">
                    <div className="w-16 h-16 rounded-2xl bg-background shadow-sm border flex items-center justify-center mb-6 text-primary">
                      <step.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full border-t-2 border-dashed border-primary/20 -z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to teach better</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Powerful AI features designed specifically for the Indian education system and beyond.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { title: "Smart OCR", desc: "Extract text accurately from blurry photos, handwritten notes, and old question papers." },
                { title: "Voice Transcription", desc: "Dictate your questions or notes and let our AI turn them into formatted text instantly." },
                { title: "Exam Generator", desc: "Specify subject, grade, and marks. Get a complete, balanced question paper with an answer key." },
                { title: "School Branding", desc: "Automatically add your school logo, header, footer, and student detail fields." },
                { title: "Multi-language", desc: "Support for English, Hindi, and regional languages. Teach in the language you prefer." },
                { title: "One-click Export", desc: "Download as a perfectly formatted PDF or DOCX file, ready for the school printer." }
              ].map((feature, i) => (
                <Card key={i} className="border-border/50 hover:border-primary/50 transition-colors shadow-sm">
                  <CardContent className="p-6">
                    <CheckCircle2 className="h-6 w-6 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-primary text-primary-foreground text-center">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-4xl font-bold mb-6">Ready to save hours every week?</h2>
            <p className="text-primary-foreground/80 text-xl mb-10">Join thousands of teachers who have already transformed their workflow with Note2Print AI.</p>
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg text-primary" onClick={() => setLocation("/dashboard")}>
              Create Your First Document
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="font-bold text-xl text-foreground tracking-tight mb-4">Note2Print AI</div>
          <p className="mb-6">The smart assistant for modern educators.</p>
          <div className="text-sm">&copy; {new Date().getFullYear()} Note2Print AI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
