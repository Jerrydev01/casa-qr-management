import { QRCodeRecord } from "@/lib/types/inventory";
import { buildQrUrl } from "@/lib/utils";
import { DownloadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import NextImage from "next/image";
import React from "react";
import QRCode from "react-qr-code";
import { appToast } from "../custom/toast-ui";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const LOGO_SRC = "/casalogo.png";
const LOGO_SIZE = 32;
const QR_SIZE = 220;

const QRCodePreviewDialog = ({
  open,
  onOpenChange,
  qrCode,
  qrBaseUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: QRCodeRecord | null;
  qrBaseUrl: string;
}) => {
  const qrWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const logoDataUrlRef = React.useRef<string | null>(null);

  const qrUrl = qrCode ? buildQrUrl(qrBaseUrl, qrCode.slug) : "";

  const getSvgMarkup = React.useCallback(() => {
    const svg = qrWrapperRef.current?.querySelector("svg");

    if (!svg) {
      throw new Error("QR code preview is not ready yet.");
    }

    return new XMLSerializer().serializeToString(svg);
  }, []);

  const blobToDataUrl = React.useCallback((blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Unable to read the QR logo."));
      };

      reader.onerror = () => {
        reject(new Error("Unable to read the QR logo."));
      };

      reader.readAsDataURL(blob);
    });
  }, []);

  const getLogoDataUrl = React.useCallback(async () => {
    if (logoDataUrlRef.current) {
      return logoDataUrlRef.current;
    }

    const response = await fetch(LOGO_SRC);

    if (!response.ok) {
      throw new Error("The QR logo could not be loaded.");
    }

    const dataUrl = await blobToDataUrl(await response.blob());
    logoDataUrlRef.current = dataUrl;

    return dataUrl;
  }, [blobToDataUrl]);

  const getExportSvgMarkup = React.useCallback(async () => {
    const svgMarkup = getSvgMarkup();
    const logoDataUrl = await getLogoDataUrl();
    const parser = new DOMParser();
    const svgDocument = parser.parseFromString(svgMarkup, "image/svg+xml");
    const svg = svgDocument.documentElement;

    if (svg.nodeName.toLowerCase() !== "svg") {
      throw new Error("Unable to prepare the QR code for export.");
    }

    const svgNamespace = "http://www.w3.org/2000/svg";
    const xlinkNamespace = "http://www.w3.org/1999/xlink";
    const viewBox = svg.getAttribute("viewBox");

    let minX = 0;
    let minY = 0;
    let width = QR_SIZE;
    let height = QR_SIZE;

    if (viewBox) {
      const [parsedMinX, parsedMinY, parsedWidth, parsedHeight] = viewBox
        .split(/[\s,]+/)
        .map(Number);

      if (
        Number.isFinite(parsedMinX) &&
        Number.isFinite(parsedMinY) &&
        Number.isFinite(parsedWidth) &&
        Number.isFinite(parsedHeight)
      ) {
        minX = parsedMinX;
        minY = parsedMinY;
        width = parsedWidth;
        height = parsedHeight;
      }
    }

    // Logo size expressed in viewBox units (not CSS pixels).
    // react-qr-code uses a module-count viewBox (e.g. "0 0 21 21"), so we
    // must derive sizes as a fraction of that space. 20% keeps the logo
    // inside the ~30% error-correction budget of level H.
    const logoSizeVB = Math.min(width, height) * 0.2;
    const logoPaddingVB = logoSizeVB * 0.05;
    const backgroundSize = logoSizeVB + logoPaddingVB * 2;
    const backgroundX = minX + (width - backgroundSize) / 2;
    const backgroundY = minY + (height - backgroundSize) / 2;
    const imageX = minX + (width - logoSizeVB) / 2;
    const imageY = minY + (height - logoSizeVB) / 2;

    const background = svgDocument.createElementNS(svgNamespace, "rect");
    background.setAttribute("x", backgroundX.toString());
    background.setAttribute("y", backgroundY.toString());
    background.setAttribute("width", backgroundSize.toString());
    background.setAttribute("height", backgroundSize.toString());
    background.setAttribute("rx", (backgroundSize * 0.15).toString());
    background.setAttribute("fill", "#ffffff");

    const logoImage = svgDocument.createElementNS(svgNamespace, "image");
    logoImage.setAttribute("x", imageX.toString());
    logoImage.setAttribute("y", imageY.toString());
    logoImage.setAttribute("width", logoSizeVB.toString());
    logoImage.setAttribute("height", logoSizeVB.toString());
    logoImage.setAttribute("preserveAspectRatio", "xMidYMid meet");
    logoImage.setAttribute("href", logoDataUrl);
    logoImage.setAttributeNS(xlinkNamespace, "xlink:href", logoDataUrl);

    svg.append(background, logoImage);

    return new XMLSerializer().serializeToString(svg);
  }, [getLogoDataUrl, getSvgMarkup]);

  const copyLink = async () => {
    if (!qrUrl) return;

    try {
      await navigator.clipboard.writeText(qrUrl);
      appToast.success("QR link copied", {
        description: qrUrl,
      });
    } catch {
      appToast.error("Failed to copy link", {
        description: "Copy the URL manually from the field below.",
      });
    }
  };

  const downloadSvg = async () => {
    if (!qrCode) return;

    try {
      const svgMarkup = await getExportSvgMarkup();
      const blob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `${qrCode.slug}.svg`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      appToast.error("Download failed", {
        description:
          error instanceof Error ? error.message : "Unable to export the SVG.",
      });
    }
  };

  const downloadPng = async () => {
    if (!qrCode) return;

    try {
      const svgMarkup = await getExportSvgMarkup();
      const svgBlob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });
      const objectUrl = URL.createObjectURL(svgBlob);
      const image = new window.Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 1200;
        const context = canvas.getContext("2d");

        canvas.width = size;
        canvas.height = size;

        if (!context) {
          URL.revokeObjectURL(objectUrl);
          appToast.error("Download failed", {
            description: "Canvas is not available in this browser.",
          });
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, size, size);
        context.drawImage(image, 0, 0, size, size);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);

          if (!blob) {
            appToast.error("Download failed", {
              description: "Unable to render a PNG file.",
            });
            return;
          }

          const pngUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.href = pngUrl;
          link.download = `${qrCode.slug}.png`;
          link.click();
          URL.revokeObjectURL(pngUrl);
        }, "image/png");
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        appToast.error("Download failed", {
          description: "Unable to render the QR code as an image.",
        });
      };

      image.src = objectUrl;
    } catch (error) {
      appToast.error("Download failed", {
        description:
          error instanceof Error ? error.message : "Unable to export the PNG.",
      });
    }
  };

  const printQrCode = async () => {
    if (!qrCode) return;

    try {
      const svgMarkup = await getExportSvgMarkup();
      const iframe = document.createElement("iframe");

      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";

      document.body.appendChild(iframe);

      const printDocument = iframe.contentWindow?.document;

      if (!printDocument || !iframe.contentWindow) {
        iframe.remove();
        appToast.error("Print failed", {
          description: "Unable to open the browser print dialog.",
        });
        return;
      }

      printDocument.open();
      printDocument.write(`
        <html>
          <head>
            <title>${qrCode.slug}</title>
            <style>
              @page {
                size: auto;
                margin: 12mm;
              }
              body {
                font-family: Arial, sans-serif;
                display: flex;
                min-height: 100vh;
                margin: 0;
                align-items: center;
                justify-content: center;
                background: #ffffff;
              }
              .sheet {
                display: grid;
                gap: 16px;
                justify-items: center;
                text-align: center;
              }
              .sheet svg {
                width: 280px;
                height: 280px;
              }
            </style>
          </head>
          <body>
            <div class="sheet">
              <div>${svgMarkup}</div>
              <strong>${qrCode.slug}</strong>
            </div>
          </body>
        </html>
      `);
      printDocument.close();

      const cleanup = () => {
        window.removeEventListener("afterprint", cleanup);
        iframe.remove();
      };

      window.addEventListener("afterprint", cleanup, { once: true });

      window.setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        window.setTimeout(cleanup, 1000);
      }, 150);
    } catch (error) {
      appToast.error("Print failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unable to print this QR code.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{qrCode?.slug ?? "QR preview"}</DialogTitle>
          <DialogDescription>
            Print this QR code anywhere you want to send guests to the latest
            landing page for this campaign.
          </DialogDescription>
        </DialogHeader>
        {qrCode ? (
          <div className="flex flex-col gap-6">
            <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
              <div
                ref={qrWrapperRef}
                className="relative mx-auto rounded-2xl border border-border bg-white p-4 shadow-xs"
              >
                <QRCode size={QR_SIZE} value={qrUrl} level="H" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-md bg-white p-1">
                    <NextImage
                      src={LOGO_SRC}
                      width={LOGO_SIZE}
                      height={LOGO_SIZE}
                      alt="Casa logo"
                      className="block h-8 w-8 object-contain"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-public-link">Public QR URL</Label>
                  <Input id="qr-public-link" readOnly value={qrUrl} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-destination-link">Destination URL</Label>
                  <Input
                    id="qr-destination-link"
                    readOnly
                    value={qrCode.destination_url}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={copyLink} type="button" variant="outline">
                    Copy link
                  </Button>
                  <Button onClick={downloadSvg} type="button" variant="outline">
                    Download SVG
                  </Button>
                  <Button onClick={downloadPng} type="button" variant="outline">
                    <HugeiconsIcon icon={DownloadIcon} strokeWidth={2} />
                    Download PNG
                  </Button>
                  <Button
                    onClick={printQrCode}
                    type="button"
                    className="text-white"
                  >
                    Print QR code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default QRCodePreviewDialog;
