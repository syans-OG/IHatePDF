import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Flame,
  CheckCircle2,
  RefreshCcw,
  FileArchive,
  Layers,
  Settings,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import type { ToolDef } from '../data/tools';
import { FileUploader } from './FileUploader';
import {
  mergePDFs,
  splitPDF,
  jpgToPdf,
  pdfToJpg,
  wordToPdf,
  pdfToWord,
  pptToPdf,
  pdfToPpt,
  compressPdf,
  pdfToMd,
  mdToPdf,
} from '../services/pdfServices';

interface ToolWorkspaceProps {
  tool: ToolDef;
  onBack: () => void;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({ tool, onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const [splitRange, setSplitRange] = useState<string>('');
  const [compressLevel, setCompressLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const [singleOutput, setSingleOutput] = useState<{
    bytes?: Uint8Array;
    blob?: Blob;
    filename: string;
  } | null>(null);

  const [multiOutput, setMultiOutput] = useState<{
    items: { filename: string; bytes?: Uint8Array; blob?: Blob; dataUrl?: string }[];
    zipBlob?: Blob;
  } | null>(null);

  const handleProcess = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(5);
    setStatusMsg('Starting processing...');
    setSingleOutput(null);
    setMultiOutput(null);

    const firstFile = files[0];
    const baseName = firstFile.name.replace(/\.[^/.]+$/, '');

    try {
      switch (tool.id) {
        case 'merge-pdf': {
          const bytes = await mergePDFs(files, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });
          setSingleOutput({
            bytes,
            filename: `Merged_${baseName}.pdf`,
          });
          break;
        }

        case 'split-pdf': {
          const items = await splitPDF(firstFile, splitRange, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });

          const zip = new JSZip();
          items.forEach((item) => {
            if (item.bytes) {
              zip.file(item.filename, item.bytes);
            }
          });
          const zipBlob = await zip.generateAsync({ type: 'blob' });

          setMultiOutput({ items, zipBlob });
          break;
        }

        case 'jpg-to-pdf': {
          const bytes = await jpgToPdf(files, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });
          setSingleOutput({
            bytes,
            filename: `Images_${baseName}.pdf`,
          });
          break;
        }

        case 'pdf-to-jpg': {
          const items = await pdfToJpg(firstFile, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });

          const formattedItems = items.map((item) => ({
            filename: `${baseName}_page_${item.pageNum}.jpg`,
            blob: item.blob,
            dataUrl: item.dataUrl,
          }));

          const zip = new JSZip();
          formattedItems.forEach((item) => {
            zip.file(item.filename, item.blob);
          });
          const zipBlob = await zip.generateAsync({ type: 'blob' });

          setMultiOutput({ items: formattedItems, zipBlob });
          break;
        }

        case 'word-to-pdf': {
          const bytes = await wordToPdf(firstFile, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });
          setSingleOutput({
            bytes,
            filename: `${baseName}.pdf`,
          });
          break;
        }

        case 'pdf-to-word': {
          const blob = await pdfToWord(firstFile, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });
          setSingleOutput({
            blob,
            filename: `${baseName}.docx`,
          });
          break;
        }

        case 'ppt-to-pdf': {
          const bytes = await pptToPdf(firstFile, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });
          setSingleOutput({
            bytes,
            filename: `${baseName}_presentation.pdf`,
          });
          break;
        }

        case 'pdf-to-ppt': {
          const blob = await pdfToPpt(firstFile, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });
          setSingleOutput({
            blob,
            filename: `${baseName}_presentation.pptx`,
          });
          break;
        }

        case 'pdf-to-md': {
          const bytes = await pdfToMd(firstFile, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });
          const blob = new Blob([bytes as unknown as BlobPart], { type: 'text/markdown' });
          setSingleOutput({
            blob,
            filename: `${baseName}.md`,
          });
          break;
        }

        case 'md-to-pdf': {
          const bytes = await mdToPdf(firstFile, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });
          setSingleOutput({
            bytes,
            filename: `${baseName}.pdf`,
          });
          break;
        }

        case 'compress-pdf': {
          const bytes = await compressPdf(firstFile, compressLevel, (prog, msg) => {
            setProgress(prog);
            setStatusMsg(msg);
          });
          setSingleOutput({
            bytes,
            filename: `${baseName}_compressed.pdf`,
          });
          break;
        }

        default:
          throw new Error('Tool not implemented yet.');
      }

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error(err);
      setStatusMsg('Error processing file: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = () => {
    if (!singleOutput) return;
    let url: string;
    if (singleOutput.bytes) {
      const blob = new Blob([singleOutput.bytes as BlobPart], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
    } else if (singleOutput.blob) {
      url = URL.createObjectURL(singleOutput.blob);
    } else {
      return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = singleOutput.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = () => {
    if (!multiOutput?.zipBlob) return;
    const url = URL.createObjectURL(multiOutput.zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.id}_output.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setFiles([]);
    setSingleOutput(null);
    setMultiOutput(null);
    setProgress(0);
    setStatusMsg('');
  };

  const hasOutput = singleOutput !== null || multiOutput !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium text-text-secondary hover:text-text-primary bg-transparent hover:bg-bg-surface transition-colors border border-transparent hover:border-border-hover cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="text-[10px] text-accent-red font-medium uppercase tracking-wide px-2 py-0.5 rounded-sm bg-accent-red/10 border border-accent-red/20">
          {tool.nameIndo}
        </span>
      </div>

      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tighter text-text-primary">
          {tool.name}
        </h1>
        <p className="text-[15px] text-text-secondary max-w-lg mx-auto leading-relaxed">
          {tool.description}
        </p>
      </div>

      <div className="impeccable-card p-6 sm:p-10 rounded-3xl space-y-8">
        {!hasOutput && (
          <div className="space-y-6">
            <FileUploader
              accept={tool.accept}
              multiple={tool.multiple}
              files={files}
              onFilesChange={setFiles}
              title={`Upload for ${tool.name}`}
              subtitle={
                tool.multiple
                  ? 'Drag & drop multiple files to combine'
                  : 'Select a file to convert'
              }
            />

            {files.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-slate-800">
                {tool.id === 'split-pdf' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-rose-400" />
                      <span>Page Range to Split (Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1-3, 5, 8-12 (Leave blank to split all pages)"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                {tool.id === 'compress-pdf' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-rose-400" />
                      <span>Compression Level</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['low', 'medium', 'high'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setCompressLevel(lvl)}
                          className={`py-2 px-4 rounded-md border text-[13px] font-medium capitalize transition-colors cursor-pointer ${
                            compressLevel === lvl
                              ? 'bg-text-primary text-bg-main border-text-primary'
                              : 'bg-transparent text-text-secondary border-border-hover hover:border-text-muted'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                      <span className="flex items-center gap-2">
                        <Flame className="w-4 h-4 animate-spin" />
                        {statusMsg}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full hate-gradient transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProcess}
                  className="w-full py-4 rounded-xl font-semibold text-bg-main bg-text-primary hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Flame className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Processing File...' : `EXECUTE ${tool.name.toUpperCase()}`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {hasOutput && (
          <div className="text-center space-y-6 py-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/40 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/30">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">
                Conversion Successful! 🎉
              </h3>
              <p className="text-xs text-slate-400">
                Your file is processed and ready for download.
              </p>
            </div>

            {singleOutput && (
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-bg-main bg-text-primary hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {singleOutput.filename}</span>
                </button>

                <button
                  type="button"
                  onClick={resetAll}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-text-secondary bg-bg-surface border border-border-hover hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Convert Another File</span>
                </button>
              </div>
            )}

            {multiOutput && (
              <div className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {multiOutput.zipBlob && (
                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-bg-main bg-text-primary hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileArchive className="w-4 h-4" />
                      <span>Download All Files (.ZIP)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={resetAll}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-text-secondary bg-bg-surface border border-border-hover hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span>Convert Another</span>
                  </button>
                </div>

                {tool.id === 'pdf-to-jpg' && (
                  <div className="pt-6 border-t border-slate-800 text-left">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-rose-400" />
                      Extracted Images ({multiOutput.items.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {multiOutput.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-[3/4] p-2 flex flex-col justify-between"
                        >
                          {item.dataUrl && (
                            <img
                              src={item.dataUrl}
                              alt={item.filename}
                              className="w-full h-full object-contain rounded-xl"
                            />
                          )}
                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a
                              href={item.dataUrl}
                              download={item.filename}
                              className="p-3 rounded-full bg-rose-600 text-white shadow-lg"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
