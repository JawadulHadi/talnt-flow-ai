import { jsPDF } from "jspdf";
import { formatDate } from "./analytics";
import type { Candidate, JobDescription, Ratings, Recommendation, StarQuestion } from "./types";

const M = 18;
const W = 210;

class Doc {
  pdf = new jsPDF({ unit: "mm", format: "a4" });
  y = M;

  ensure(h: number) {
    if (this.y + h > 280) {
      this.pdf.addPage();
      this.y = M;
    }
  }
  header(title: string, subtitle: string) {
    this.pdf.setFillColor(22, 30, 46);
    this.pdf.rect(0, 0, W, 34, "F");
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont("helvetica", "bold").setFontSize(18).text(title, M, 16);
    this.pdf.setFont("helvetica", "normal").setFontSize(10).text(subtitle, M, 24);
    this.pdf
      .setFontSize(8)
      .text(`Qeloma Agent for Recruiter · ${formatDate(new Date().toISOString())}`, M, 30);
    this.pdf.setTextColor(30, 30, 30);
    this.y = 44;
  }
  h(text: string) {
    this.ensure(12);
    this.pdf
      .setFont("helvetica", "bold")
      .setFontSize(12)
      .setTextColor(40, 60, 110)
      .text(text, M, this.y);
    this.pdf.setTextColor(30, 30, 30);
    this.y += 7;
  }
  p(text: string, size = 10) {
    this.pdf.setFont("helvetica", "normal").setFontSize(size);
    const lines = this.pdf.splitTextToSize(text, W - M * 2) as string[];
    for (const l of lines) {
      this.ensure(5);
      this.pdf.text(l, M, this.y);
      this.y += 5;
    }
    this.y += 2;
  }
  bullets(items: string[]) {
    this.pdf.setFont("helvetica", "normal").setFontSize(10);
    for (const it of items) {
      const lines = this.pdf.splitTextToSize(it, W - M * 2 - 6) as string[];
      lines.forEach((l, i) => {
        this.ensure(5);
        if (i === 0) this.pdf.text("•", M, this.y);
        this.pdf.text(l, M + 5, this.y);
        this.y += 5;
      });
    }
    this.y += 2;
  }
  newPage() {
    this.pdf.addPage();
    this.y = M;
  }
}

function writeJd(d: Doc, jd: JobDescription) {
  d.h("Overview");
  d.p(jd.overview);
  d.h("Responsibilities");
  d.bullets(jd.responsibilities);
  d.h("Requirements");
  d.bullets(jd.requirements);
  d.h("Why join us");
  d.p(jd.whyJoinUs);
}

function writeGuide(d: Doc, qs: StarQuestion[]) {
  qs.forEach((q, i) => {
    d.h(`${i + 1}. ${q.competency} (weight ${q.weight.toFixed(1).replace(".", ",")})`);
    d.p(q.question);
    d.p(`Look for: ${q.lookFor}`, 9);
    d.p(`Follow-up: ${q.followUp}`, 9);
  });
}

function writeScorecard(d: Doc, c: Candidate, qs: StarQuestion[], r: Ratings, rec: Recommendation) {
  d.h(`Recommendation: ${rec.verdict} — ${rec.weightedScore}/100`);
  d.p(rec.executiveSummary);
  d.h("Key strengths");
  d.bullets(rec.keyStrengths);
  d.h("Areas to probe");
  d.bullets(rec.areasToProbe);
  d.h("Ratings");
  qs.forEach((q) => {
    const x = r[q.id];
    d.p(
      `${q.competency}: ${x?.score ? `${x.score}/5` : "not rated"}${x?.note ? ` — ${x.note}` : ""}`,
      9,
    );
  });
  d.p(`Candidate: ${c.name} · ${c.role} · ${c.stage}`, 9);
}

export function exportJobDescription(jd: JobDescription) {
  const d = new Doc();
  d.header(jd.title, jd.meta);
  writeJd(d, jd);
  d.pdf.save("job-description.pdf");
}

export function exportInterviewGuide(jd: JobDescription, qs: StarQuestion[]) {
  const d = new Doc();
  d.header("STAR interview guide", jd.title);
  writeGuide(d, qs);
  d.pdf.save("interview-guide.pdf");
}

export function exportScorecard(c: Candidate, qs: StarQuestion[], r: Ratings, rec: Recommendation) {
  const d = new Doc();
  d.header(`Candidate scorecard — ${c.name}`, c.role);
  writeScorecard(d, c, qs, r, rec);
  d.pdf.save(`scorecard-${c.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function exportPackage(
  jd: JobDescription,
  qs: StarQuestion[],
  c: Candidate,
  r: Ratings,
  rec: Recommendation,
) {
  const d = new Doc();
  d.header("Complete recruitment package", jd.title);
  writeJd(d, jd);
  d.newPage();
  d.h("STAR interview guide");
  writeGuide(d, qs);
  d.newPage();
  d.h(`Scorecard — ${c.name}`);
  writeScorecard(d, c, qs, r, rec);
  d.pdf.save("recruitment-package.pdf");
}
