import JSZip from "jszip";
import type { ExportProject } from "@/lib/pdf";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function contentToXhtmlBody(content: string): string {
  return content
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeXml(paragraph).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

function chapterFileName(order: number): string {
  return `chapter-${String(order).padStart(3, "0")}.xhtml`;
}

/**
 * Builds a valid, minimal EPUB3 archive: uncompressed mimetype file first (required
 * by the spec), container.xml pointing at the package document, the package
 * document itself (metadata + manifest + spine), a nav document, and one XHTML
 * file per chapter. Kept dependency-free beyond JSZip so the format is easy to
 * inspect/debug rather than depending on a heavier epub-generation library.
 */
export async function renderProjectEpub(project: ExportProject): Promise<Buffer> {
  const zip = new JSZip();

  // Must be the first entry, stored (not deflated), with this exact content.
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  zip.file(
    "OEBPS/styles.css",
    `body { font-family: Georgia, serif; line-height: 1.6; margin: 1.5em; }
h1 { font-size: 1.4em; }
p { margin: 0 0 1em 0; }
.hash { font-family: monospace; font-size: 0.75em; color: #64748b; }`
  );

  const sortedChapters = [...project.chapters].sort((a, b) => a.order - b.order);
  const bookId = `urn:uuid:cvault-${Buffer.from(project.title).toString("hex").slice(0, 24)}`;
  const modified = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  // Cover / title page
  zip.file(
    "OEBPS/title.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(project.title)}</title><link rel="stylesheet" href="styles.css"/></head>
<body>
  <h1>${escapeXml(project.title)}</h1>
  ${project.genre ? `<p><em>${escapeXml(project.genre)}</em></p>` : ""}
  <p>by ${escapeXml(project.authorName)}</p>
  <p>${escapeXml(project.premise)}</p>
  <p class="hash">Published with C-Vault — each chapter's hash chain can be verified against its provenance timeline.</p>
</body>
</html>`
  );

  // One XHTML file per chapter
  for (const chapter of sortedChapters) {
    zip.file(
      `OEBPS/${chapterFileName(chapter.order)}`,
      `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(chapter.title)}</title><link rel="stylesheet" href="styles.css"/></head>
<body>
  <h1>${escapeXml(chapter.title)}</h1>
  ${contentToXhtmlBody(chapter.content)}
  <p class="hash">verified ${chapter.contentHash.slice(0, 12)}</p>
</body>
</html>`
    );
  }

  // Navigation document (EPUB3 requirement)
  const navItems = sortedChapters
    .map((c) => `<li><a href="${chapterFileName(c.order)}">${escapeXml(c.title)}</a></li>`)
    .join("\n");

  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
      <li><a href="title.xhtml">Title page</a></li>
      ${navItems}
    </ol>
  </nav>
</body>
</html>`
  );

  // Package document: metadata + manifest + spine
  const manifestChapterItems = sortedChapters
    .map(
      (c) =>
        `<item id="chapter-${c.order}" href="${chapterFileName(c.order)}" media-type="application/xhtml+xml"/>`
    )
    .join("\n");
  const spineChapterItems = sortedChapters
    .map((c) => `<itemref idref="chapter-${c.order}"/>`)
    .join("\n");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${bookId}</dc:identifier>
    <dc:title>${escapeXml(project.title)}</dc:title>
    <dc:creator>${escapeXml(project.authorName)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    ${manifestChapterItems}
  </manifest>
  <spine>
    <itemref idref="title"/>
    ${spineChapterItems}
  </spine>
</package>`
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });
  return buffer;
}
