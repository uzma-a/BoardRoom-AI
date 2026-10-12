import type { jsPDF as JsPDFType } from "jspdf";
import type { AgentFinding, BoardResolution } from "@/types/board";

const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Colors matching the product's own palette, expressed as RGB for jsPDF.
const COLOR_PRIMARY: [number, number, number] = [99, 102, 241];
const COLOR_TEXT: [number, number, number] = [17, 24, 39];
const COLOR_MUTED: [number, number, number] = [107, 114, 128];

/**
 * jsPDF's built-in fonts (Helvetica/Times/Courier) use WinAnsiEncoding,
 * which does not include the RUPEE SIGN (U+20B9) or several other
 * Unicode characters Gemini commonly produces (smart quotes, en/em
 * dashes). Left unsanitized, these silently render as broken boxes or
 * missing glyphs. Every string that reaches jsPDF's text() call is
 * passed through this first.
 */
function sanitizeForPdf(text: string): string {
  if (!text) return text;
  return text
    .replace(/₹/g, "Rs. ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/[^\x00-\xFF]/g, "?"); // catch-all: any other unsupported character
}

/**
 * A small stateful cursor wrapper around jsPDF so the rest of this file
 * reads as "write this, then this" instead of manually tracking a `y`
 * variable and page breaks at every call site.
 */
class ReportWriter {
  doc: JsPDFType;
  y = MARGIN;

  private constructor(doc: JsPDFType) {
    this.doc = doc;
  }

  static async create(): Promise<ReportWriter> {
    const { jsPDF } = await import("jspdf");
    return new ReportWriter(new jsPDF({ unit: "mm", format: "a4" }));
  }

  private ensureSpace(height: number) {
    if (this.y + height > PAGE_HEIGHT - MARGIN) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  spacer(height: number) {
    this.y += height;
  }

  divider() {
    this.ensureSpace(6);
    this.doc.setDrawColor(229, 231, 235);
    this.doc.line(MARGIN, this.y, PAGE_WIDTH - MARGIN, this.y);
    this.y += 6;
  }

  title(text: string) {
    const clean = sanitizeForPdf(text);
    this.ensureSpace(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(20);
    this.doc.setTextColor(...COLOR_TEXT);
    this.doc.text(clean, MARGIN, this.y);
    this.y += 9;
  }

  subtitle(text: string) {
    const clean = sanitizeForPdf(text);
    this.ensureSpace(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLOR_MUTED);
    this.doc.text(clean, MARGIN, this.y);
    this.y += 8;
  }

  sectionHeading(text: string) {
    const clean = sanitizeForPdf(text);
    this.ensureSpace(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(13);
    this.doc.setTextColor(...COLOR_PRIMARY);
    this.doc.text(clean, MARGIN, this.y);
    this.y += 7;
  }

  subheading(text: string) {
    const clean = sanitizeForPdf(text);
    this.ensureSpace(7);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(...COLOR_TEXT);
    this.doc.text(clean, MARGIN, this.y);
    this.y += 5.5;
  }

  paragraph(text: string) {
    const clean = sanitizeForPdf(text);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLOR_TEXT);
    const lines = this.doc.splitTextToSize(clean, CONTENT_WIDTH) as string[];
    for (const line of lines) {
      this.ensureSpace(5.2);
      this.doc.text(line, MARGIN, this.y);
      this.y += 5.2;
    }
    this.y += 2;
  }

  bulletList(items: string[]) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...COLOR_TEXT);
    for (const item of items) {
      const clean = sanitizeForPdf(item);
      const lines = this.doc.splitTextToSize(`•  ${clean}`, CONTENT_WIDTH - 4) as string[];
      for (const line of lines) {
        this.ensureSpace(5);
        this.doc.text(line, MARGIN + 2, this.y);
        this.y += 5;
      }
    }
    this.y += 2;
  }

  metricRow(label: string, percent: number) {
    const cleanLabel = sanitizeForPdf(label);
    this.ensureSpace(7);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLOR_TEXT);
    this.doc.text(cleanLabel, MARGIN, this.y);

    const barX = MARGIN + 85;
    const barWidth = 60;
    this.doc.setFillColor(229, 231, 235);
    this.doc.roundedRect(barX, this.y - 3.2, barWidth, 3.2, 1, 1, "F");
    this.doc.setFillColor(...COLOR_PRIMARY);
    this.doc.roundedRect(barX, this.y - 3.2, barWidth * (percent / 100), 3.2, 1, 1, "F");

    this.doc.setTextColor(...COLOR_MUTED);
    this.doc.text(`${percent}%`, barX + barWidth + 4, this.y);
    this.y += 7;
  }

  voteRow(label: string, vote: string) {
    const cleanLabel = sanitizeForPdf(label);
    const cleanVote = sanitizeForPdf(vote);
    this.ensureSpace(6.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLOR_TEXT);
    this.doc.text(cleanLabel, MARGIN, this.y);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLOR_PRIMARY);
    this.doc.text(cleanVote, MARGIN + 85, this.y);
    this.y += 6.5;
  }
}

function writeFindingSection(writer: ReportWriter, heading: string, finding: AgentFinding) {
  writer.sectionHeading(heading);
  writer.paragraph(`Confidence: ${Math.round(finding.confidence * 100)}%${finding.vote ? `   ·   Vote: ${finding.vote}` : ""}`);
  writer.paragraph(finding.summary);
  if (finding.key_points.length > 0) {
    writer.subheading("Key Points");
    writer.bulletList(finding.key_points);
  }
  if (finding.risks_identified.length > 0) {
    writer.subheading("Risks Identified");
    writer.bulletList(finding.risks_identified);
  }
  writer.spacer(4);
}

/**
 * Generates a professionally laid-out PDF of the Board Resolution and
 * triggers a browser download. Built with jsPDF's programmatic text/shape
 * API rather than rasterizing the DOM (html2canvas) -- the output is
 * crisp, selectable text at any zoom level, and the file size stays tiny.
 */
export async function generateExecutiveReportPdf(resolution: BoardResolution, ideaSummary: string): Promise<void> {
  const writer = await ReportWriter.create();
  const generatedAt = new Date().toLocaleString();

  writer.title("Boardroom AI — Board Resolution");
  writer.subtitle(`Generated ${generatedAt}`);
  if (ideaSummary) {
    writer.paragraph(ideaSummary);
  }
  writer.divider();

  writer.sectionHeading("Executive Summary");
  writer.paragraph(resolution.executive_summary);
  writer.spacer(2);

  writer.subheading(`Final Decision (Overall Confidence: ${Math.round(resolution.overall_confidence * 100)}%)`);
  writer.paragraph(resolution.final_decision);
  writer.divider();

  writer.sectionHeading("Board Scorecard");
  writer.metricRow("Technical Feasibility", Math.round(resolution.technical_analysis.confidence * 100));
  writer.metricRow("Financial Viability", Math.round(resolution.financial_analysis.confidence * 100));
  writer.metricRow("Market Opportunity", Math.round(resolution.marketing_analysis.confidence * 100));
  writer.metricRow("Legal Risk Assessment", Math.round(resolution.legal_analysis.confidence * 100));
  writer.metricRow("Execution Risk Assessment", Math.round(resolution.risk_analysis.confidence * 100));
  writer.metricRow("Overall Confidence", Math.round(resolution.overall_confidence * 100));
  writer.divider();

  writer.sectionHeading("Board Votes");
  const voteLabels: Record<string, string> = {
    cto: "CTO", cfo: "CFO", marketing: "Marketing", legal: "Legal", risk: "Risk",
  };
  for (const [agent, vote] of Object.entries(resolution.board_votes)) {
    if (vote) writer.voteRow(voteLabels[agent] ?? agent, vote.toUpperCase());
  }
  writer.divider();

  writeFindingSection(writer, "Technical Analysis (CTO)", resolution.technical_analysis);
  writeFindingSection(writer, "Financial Analysis (CFO)", resolution.financial_analysis);
  writeFindingSection(writer, "Marketing Analysis", resolution.marketing_analysis);
  writeFindingSection(writer, "Legal Analysis", resolution.legal_analysis);
  writeFindingSection(writer, "Risk Analysis", resolution.risk_analysis);

  writer.divider();
  writer.sectionHeading("Recommended Next Steps");
  if (resolution.recommended_next_steps.length > 0) {
    writer.bulletList(resolution.recommended_next_steps);
  } else {
    writer.paragraph("The board did not specify next steps for this session.");
  }

  const filename = `boardroom-ai-resolution-${Date.now()}.pdf`;
  writer.doc.save(filename);
}