import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import { formatRange } from "@/lib/format";
import type { Item } from "@/lib/content/types";

import type { ResumeContent } from "./build";

/*
 * .docx generation. Plain single-column ATS-friendly output: no tables, no
 * text boxes, no headers carrying content, real paragraph styles.
 */

function entryParagraphs(item: Item): Paragraph[] {
  const meta = [item.org, item.location].filter(Boolean).join(" · ");
  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 160, after: 40 },
      children: [
        new TextRun({ text: item.title, bold: true, size: 22 }),
        new TextRun({
          text: `   ${formatRange(item.startDate, item.endDate)}`,
          size: 18,
          color: "555555",
        }),
      ],
    }),
  ];

  if (meta) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: meta, italics: true, size: 18 })],
      }),
    );
  }

  if (item.summaryShort) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: item.summaryShort, size: 19 })],
      }),
    );
  }

  for (const body of item.bullets) {
    paragraphs.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 20 },
        children: [new TextRun({ text: body, size: 19 })],
      }),
    );
  }

  return paragraphs;
}

function section(title: string, items: Item[]): Paragraph[] {
  if (items.length === 0) return [];
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: title, bold: true, size: 22 })],
    }),
    ...items.flatMap(entryParagraphs),
  ];
}

export function resumeDocument(resume: ResumeContent): Document {
  const skills = resume.skills.map(
    (group) =>
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({ text: `${group.category}: `, bold: true, size: 19 }),
          new TextRun({ text: group.skills.join(", "), size: 19 }),
        ],
      }),
  );

  return new Document({
    creator: resume.name,
    title: `${resume.name} — Resume`,
    description: "Generated from bchbenjamin.in",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 40 },
            children: [new TextRun({ text: resume.name, bold: true, size: 40 })],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: resume.headline, size: 20 })],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: resume.email, size: 18, color: "555555" }),
              ...resume.links.flatMap((link) => [
                new TextRun({ text: "  ·  ", size: 18, color: "555555" }),
                new TextRun({ text: link.url, size: 18, color: "555555" }),
              ]),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: resume.summary, size: 19 })],
          }),
          ...section("Experience", resume.experience),
          ...section("Projects", resume.projects),
          ...section("Education", resume.education),
          ...section("Other", resume.achievements),
          ...(skills.length > 0
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 240, after: 80 },
                  children: [
                    new TextRun({ text: "Skills", bold: true, size: 22 }),
                  ],
                }),
                ...skills,
              ]
            : []),
        ],
      },
    ],
  });
}

export async function resumeBuffer(resume: ResumeContent): Promise<ArrayBuffer> {
  const buffer = await Packer.toBuffer(resumeDocument(resume));
  const bytes = new Uint8Array(buffer);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
