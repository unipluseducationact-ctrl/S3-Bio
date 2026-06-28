/**
 * Export BioUni+ summary as PDF (html2canvas + jsPDF) or Word (.doc).
 * PDF: each logical block stays on one page (never sliced mid-section).
 */
(function () {
  const FILENAME = "Ch3-Membrane-Transport-Summary";
  const CAPTURE_WIDTH_PX = 794;
  const CAPTURE_SCALE = 2;
  const MARGIN_MM = 12;
  const BLOCK_GAP_MM = 5;

  function statusEl() {
    return document.getElementById("export-status");
  }

  function setStatus(message, isError) {
    const el = statusEl();
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("text-tertiary", !!isError);
    el.classList.toggle("text-secondary", !isError);
  }

  function setButtonsDisabled(disabled) {
    document.querySelectorAll("[data-export-btn]").forEach((btn) => {
      btn.disabled = disabled;
      btn.setAttribute("aria-busy", disabled ? "true" : "false");
    });
  }

  function getExportRoot() {
    return document.getElementById("export-root") || document.querySelector("main");
  }

  async function imageToDataUrl(img) {
    const src = img.getAttribute("src");
    if (!src) return null;
    if (src.startsWith("data:")) return src;
    const absolute = new URL(src, window.location.href).href;
    try {
      const response = await fetch(absolute);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return absolute;
    }
  }

  async function buildExportClone() {
    const root = getExportRoot();
    const clone = root.cloneNode(true);

    clone.querySelectorAll(".no-export").forEach((node) => node.remove());
    clone.querySelectorAll("section").forEach((section) => {
      section.classList.remove(
        "opacity-0",
        "translate-y-4",
        "translate-y-8",
        "translate-y-10"
      );
      section.style.opacity = "1";
      section.style.transform = "none";
    });

    const images = clone.querySelectorAll("img");
    await Promise.all(
      [...images].map(async (img) => {
        const dataUrl = await imageToDataUrl(img);
        if (dataUrl) {
          img.setAttribute("src", dataUrl);
          await new Promise((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = resolve;
              img.onerror = resolve;
            }
          });
        }
      })
    );

    return clone;
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForImages(container) {
    const images = [...container.querySelectorAll("img")];
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 8000);
          })
      )
    );
  }

  function getJsPDF() {
    if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    if (window.jsPDF) return window.jsPDF;
    return null;
  }

  function getHtml2Canvas() {
    return window.html2canvas || null;
  }

  function createBlock(nodes, sectionId, includeTitle) {
    const wrap = document.createElement("div");
    wrap.className = "pdf-block";
    if (sectionId) wrap.dataset.section = sectionId;
    if (includeTitle) wrap.appendChild(includeTitle.cloneNode(true));
    nodes.forEach((node) => wrap.appendChild(node.cloneNode(true)));
    return wrap;
  }

  function expandSection(section) {
    const blocks = [];
    const sectionId = section.id || "";
    const h2 = section.querySelector(":scope > h2");
    let titleUsed = false;

    const nextBlock = (nodes) => {
      const title = h2 && !titleUsed ? h2 : null;
      if (title) titleUsed = true;
      const block = createBlock(nodes, sectionId, title);
      if (block.childNodes.length) blocks.push(block);
    };

    for (const child of section.children) {
      if (child.tagName === "H2" || child.classList?.contains("no-export")) continue;

      if (child.matches("figure.fig-box, .fig-grid")) {
        nextBlock([child]);
        continue;
      }

      const spaced = child.matches(".space-y-4, .space-y-6")
        ? child
        : child.querySelector(":scope > .space-y-4, :scope > .space-y-6");

      if (spaced && spaced.children.length > 1) {
        const before = [...child.children].filter((n) => n !== spaced);
        if (before.length) nextBlock(before);
        for (const sub of spaced.children) {
          nextBlock([sub]);
        }
        continue;
      }

      if (child.querySelector(":scope > h3") && child.children.length > 2) {
        let group = [];
        for (const sub of child.children) {
          if (sub.tagName === "H3" && group.length) {
            nextBlock(group);
            group = [];
          }
          group.push(sub);
        }
        if (group.length) nextBlock(group);
        continue;
      }

      nextBlock([child]);
    }

    return blocks;
  }

  function getExportBlocks(clone) {
    const blocks = [];

    for (const child of clone.children) {
      if (child.classList?.contains("no-export")) continue;
      if (child.tagName === "SECTION") {
        blocks.push(...expandSection(child));
      } else {
        blocks.push(createBlock([child], "", null));
      }
    }

    return blocks.length ? blocks : [clone];
  }

  function splitBlock(block) {
    if (block.children.length <= 1) return [block];

    const sectionId = block.dataset.section || "";
    const h2 = block.querySelector(":scope > h2");
    let titleUsed = false;

    return [...block.children]
      .filter((child) => child.tagName !== "H2")
      .map((child) => {
        const title = h2 && !titleUsed ? h2 : null;
        if (title) titleUsed = true;
        return createBlock([child], sectionId, title);
      });
  }

  function getPageMetrics(pdf) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - MARGIN_MM * 2;
    const contentHeight = pageHeight - MARGIN_MM * 2;
    return { pageWidth, pageHeight, contentWidth, contentHeight };
  }

  function measureCanvasMm(canvas, contentWidthMm) {
    const heightMm = (canvas.height * contentWidthMm) / canvas.width;
    return { widthMm: contentWidthMm, heightMm };
  }

  function placeCanvasOnPdf(pdf, canvas, state) {
    const { contentWidth, contentHeight } = getPageMetrics(pdf);
    const { widthMm, heightMm } = measureCanvasMm(canvas, contentWidth);
    const imgData = canvas.toDataURL("image/png");

    let drawW = widthMm;
    let drawH = heightMm;

    if (drawH > contentHeight) {
      const fit = contentHeight / drawH;
      drawH = contentHeight;
      drawW = widthMm * fit;
    }

    if (state.y + drawH > state.pageHeight - MARGIN_MM) {
      pdf.addPage();
      state.y = MARGIN_MM;
    }

    const x = MARGIN_MM + (contentWidth - drawW) / 2;
    pdf.addImage(imgData, "PNG", x, state.y, drawW, drawH);
    state.y += drawH + BLOCK_GAP_MM;
  }

  async function captureBlock(html2canvas, host, block) {
    host.replaceChildren(block);
    await waitForImages(host);
    await wait(120);

    return html2canvas(host, {
      scale: CAPTURE_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: CAPTURE_WIDTH_PX,
      windowWidth: CAPTURE_WIDTH_PX,
    });
  }

  async function renderBlockToPdf(html2canvas, host, pdf, state, block) {
    const canvas = await captureBlock(html2canvas, host, block);
    if (!canvas || canvas.width < 20 || canvas.height < 20) return false;

    const { contentHeight } = getPageMetrics(pdf);
    const { heightMm } = measureCanvasMm(canvas, getPageMetrics(pdf).contentWidth);

    if (heightMm > contentHeight && block.children.length > 1) {
      const parts = splitBlock(block);
      if (parts.length > 1) {
        for (const part of parts) {
          await renderBlockToPdf(html2canvas, host, pdf, state, part);
        }
        return true;
      }
    }

    placeCanvasOnPdf(pdf, canvas, state);
    return true;
  }

  async function downloadPdfAuto() {
    const html2canvas = getHtml2Canvas();
    const JsPDF = getJsPDF();

    if (!html2canvas || !JsPDF) {
      downloadPdfPrint();
      return;
    }

    setButtonsDisabled(true);
    setStatus("Generating PDF…");

    const overlay = document.createElement("div");
    overlay.id = "pdf-export-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483645;background:rgba(255,255,255,0.85);pointer-events:none;";

    const wrapper = document.createElement("div");
    wrapper.id = "pdf-export-wrapper";
    wrapper.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      `width:${CAPTURE_WIDTH_PX}px`,
      "background:#ffffff",
      "color:#191c1e",
      "padding:20px 24px",
      "z-index:2147483646",
      "box-sizing:border-box",
      "overflow:visible",
    ].join(";");

    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.href = new URL("./pdf-export.css", window.location.href).href;

    const captureHost = document.createElement("div");
    captureHost.className = "pdf-capture-host";

    try {
      const clone = await buildExportClone();
      const blocks = getExportBlocks(clone);
      wrapper.appendChild(styleLink);
      wrapper.appendChild(captureHost);
      document.body.appendChild(overlay);
      document.body.appendChild(wrapper);

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await wait(300);

      const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const state = {
        y: MARGIN_MM,
        pageHeight: pdf.internal.pageSize.getHeight(),
      };

      let captured = 0;
      for (let i = 0; i < blocks.length; i++) {
        setStatus(`Generating PDF… (${i + 1}/${blocks.length})`);
        const ok = await renderBlockToPdf(html2canvas, captureHost, pdf, state, blocks[i]);
        if (ok) captured += 1;
      }

      if (!captured) {
        throw new Error("No content captured for PDF");
      }

      pdf.save(`${FILENAME}.pdf`);
      setStatus("PDF downloaded.");
    } catch (err) {
      console.error("PDF export error:", err);
      setStatus('Opening print dialog — choose "Save as PDF".', true);
      await wait(300);
      downloadPdfPrint();
    } finally {
      wrapper.remove();
      overlay.remove();
      setButtonsDisabled(false);
    }
  }

  async function downloadWord() {
    setButtonsDisabled(true);
    setStatus("Preparing Word file…");
    try {
      const clone = await buildExportClone();
      const styles = `
        body { font-family: Calibri, Inter, Arial, sans-serif; font-size: 11pt; line-height: 1.45; color: #191c1e; }
        h1 { font-size: 22pt; color: #004e9f; margin: 0 0 12pt; }
        h2 { font-size: 16pt; color: #004e9f; margin: 18pt 0 8pt; page-break-after: avoid; }
        h3 { font-size: 13pt; margin: 12pt 0 6pt; }
        p, li { margin: 0 0 8pt; }
        table { border-collapse: collapse; width: 100%; margin: 10pt 0; page-break-inside: avoid; }
        th, td { border: 1px solid #c1c6d5; padding: 6pt 8pt; vertical-align: top; text-align: left; }
        th { background: #e8f0fa; font-weight: 600; }
        img { max-width: 520px; width: 100%; height: auto; display: block; margin: 8pt auto; }
        figure { margin: 12pt 0; page-break-inside: avoid; }
        section { page-break-inside: avoid; }
        .fig-caption { font-size: 9pt; color: #414753; font-style: italic; margin-top: 4pt; }
        strong { font-weight: 700; }
      `;
      const docHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta charset="utf-8">
<title>${FILENAME}</title>
<style>${styles}</style>
</head>
<body>${clone.innerHTML}</body>
</html>`;

      const blob = new Blob(["\ufeff", docHtml], {
        type: "application/msword;charset=utf-8",
      });
      triggerBlobDownload(blob, `${FILENAME}.doc`);
      setStatus("Word downloaded (.doc — open in Microsoft Word).");
    } catch (err) {
      console.error(err);
      setStatus("Word export failed. Try Print / Save PDF.", true);
    } finally {
      setButtonsDisabled(false);
    }
  }

  function downloadPdfPrint() {
    document.body.classList.add("pdf-print-mode");
    setStatus('Print dialog — choose "Save as PDF", then print.');
    const cleanup = () => document.body.classList.remove("pdf-print-mode");
    window.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(() => window.print(), 100);
  }

  function bindExportUi() {
    document.getElementById("btn-download-word")?.addEventListener("click", downloadWord);
    document.getElementById("btn-download-pdf-print")?.addEventListener("click", downloadPdfPrint);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindExportUi);
  } else {
    bindExportUi();
  }

  window.BioSummaryExport = {
    downloadPdfAuto,
    downloadPdfPrint,
    downloadWord,
  };
})();
