import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, lineHeight: 1.5, fontFamily: "Helvetica" },
  coverTitle: { fontSize: 26, marginBottom: 12, fontFamily: "Helvetica-Bold" },
  coverMeta: { fontSize: 11, color: "#475569", marginBottom: 4 },
  coverPremise: { fontSize: 12, marginTop: 24, color: "#1e293b" },
  chapterTitle: { fontSize: 16, marginBottom: 16, fontFamily: "Helvetica-Bold" },
  paragraph: { marginBottom: 8 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#94a3b8",
  },
});

export type ExportChapter = {
  id: string;
  title: string;
  order: number;
  content: string;
  contentHash: string;
};

export type ExportProject = {
  title: string;
  genre: string | null;
  premise: string;
  authorName: string;
  chapters: ExportChapter[];
};

function ChapterPage({ chapter }: { chapter: ExportChapter }) {
  const paragraphs = chapter.content.split(/\n{2,}/).filter(Boolean);
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.chapterTitle}>{chapter.title}</Text>
      {paragraphs.map((paragraph, i) => (
        <Text key={i} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
      <Text style={styles.footer} fixed>
        {chapter.title} · verified {chapter.contentHash.slice(0, 12)}
      </Text>
    </Page>
  );
}

function ProjectDocument({ project }: { project: ExportProject }) {
  return (
    <Document title={project.title} author={project.authorName}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>{project.title}</Text>
        {project.genre && <Text style={styles.coverMeta}>{project.genre}</Text>}
        <Text style={styles.coverMeta}>by {project.authorName}</Text>
        <Text style={styles.coverPremise}>{project.premise}</Text>
        <View style={{ marginTop: 40 }}>
          <Text style={{ fontSize: 9, color: "#94a3b8" }}>
            Published with C-Vault — every chapter&apos;s hash chain can be independently
            verified against its provenance timeline.
          </Text>
        </View>
      </Page>
      {project.chapters
        .sort((a, b) => a.order - b.order)
        .map((chapter) => (
          <ChapterPage key={chapter.id} chapter={chapter} />
        ))}
    </Document>
  );
}

export async function renderProjectPdf(project: ExportProject): Promise<Buffer> {
  return renderToBuffer(<ProjectDocument project={project} />);
}
