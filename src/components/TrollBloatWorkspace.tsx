import React, { useState } from 'react';
import {
  Bomb,
  Flame,
  Download,
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FileUploader } from './FileUploader';
import { inflatePdf, formatBytes } from '../services/pdfServices';

const TROLL_PRESETS = [
  { id: '10', label: '+10 MB', value: 10, desc: 'Standard Tier' },
  { id: '50', label: '+50 MB', value: 50, desc: 'Enterprise Tier' },
  { id: '250', label: '+250 MB', value: 250, desc: 'Maximum Capacity' },
  { id: '500', label: '+500 MB', value: 500, desc: 'Uncapped Payload' },
];

const FUNNY_ROASTS = [
  "Compressing files is for cowards. We make files THICC! 🏋️‍♂️",
  "Satisfying arbitrary minimum file size requirements like a boss. 😎",
  "Injecting 100% certified organic binary garbage streams...",
  "Your boss asked for a heavy report? Say no more.",
  "Warning: Downloading this file may cause localized internet gravity. 🌌",
  "Bypassing upload filters with sheer uncompressed dominance.",
];

export const TrollBloatWorkspace: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [targetMB, setTargetMB] = useState<number>(50);
  const [trollMessage, setTrollMessage] = useState<string>(
    'This PDF has been bloated by iHatePDF Bloater [MAX SIZE]'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [swollenFilename, setSwollenFilename] = useState<string>('');
  const [currentRoast, setCurrentRoast] = useState<string>(FUNNY_ROASTS[0]);

  const handleBloat = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(5);
    setStatusMsg('Warming up the binary payload generator...');
    setResultBytes(null);

    const randomRoast = FUNNY_ROASTS[Math.floor(Math.random() * FUNNY_ROASTS.length)];
    setCurrentRoast(randomRoast);

    try {
      const file = files[0];
      const result = await inflatePdf(file, targetMB, trollMessage, (prog, msg) => {
        setProgress(prog);
        setStatusMsg(msg);
      });

      setResultBytes(result);
      const originalName = file.name.replace(/\.[^/.]+$/, '');
      setSwollenFilename(`${originalName}_BLOATED_${targetMB}MB.pdf`);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00ff88', '#00b8ff', '#ff3b5c', '#9d4edd'],
      });
    } catch (err: any) {
      console.error(err);
      setStatusMsg('Error bloating PDF: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    const blob = new Blob([resultBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = swollenFilename || 'Bloated_Document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setFiles([]);
    setResultBytes(null);
    setProgress(0);
    setStatusMsg('');
  };

  const selectedFile = files[0];
  const currentBytes = selectedFile ? selectedFile.size : 0;
  const targetBytesCalculated = Math.max(
    currentBytes + 1024 * 1024,
    targetMB * 1024 * 1024
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent-troll/10 text-accent-troll border border-accent-troll/20 text-[11px] font-medium uppercase tracking-wide">
          <Bomb className="w-3.5 h-3.5" />
          <span>Advanced Capacity Enhancer</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tighter text-text-primary">
          PDF <span className="text-accent-troll">Bloater</span>
        </h1>
        <p className="text-text-secondary text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Reverse compression! Intentionally expand your PDF file size from{' '}
          <span className="text-text-primary font-medium">500 KB</span> to{' '}
          <span className="text-accent-troll font-medium">50 MB or 500 MB</span> with valid payload streams.
        </p>
      </div>

      <div className="impeccable-card troll-accent p-6 sm:p-10 rounded-3xl relative overflow-hidden">

        {!resultBytes && (
          <div className="space-y-8 relative z-10">
            <FileUploader
              accept=".pdf"
              multiple={false}
              files={files}
              onFilesChange={setFiles}
              title="Drop PDF to Bloat"
              subtitle="Select any normal PDF file to inject heavy payload streams"
            />

            {files.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-border-main">
                <div className="p-4 rounded-xl bg-bg-surface border border-border-strong flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <span className="text-[11px] text-text-muted uppercase font-medium tracking-wide">
                      Current Size
                    </span>
                    <p className="text-lg font-semibold text-text-primary">
                      {formatBytes(currentBytes)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-accent-troll font-medium text-xs tracking-wide">
                    <ArrowRight className="w-4 h-4" />
                    <span>INFLATING TO</span>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="text-[11px] text-text-muted uppercase font-medium tracking-wide">
                      Target Swollen Size
                    </span>
                    <p className="text-2xl font-bold text-accent-troll">
                      {formatBytes(targetBytesCalculated)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wide flex items-center justify-between">
                    <span>Select Bloat Target</span>
                    <span className="text-accent-troll">{targetMB} MB</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TROLL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setTargetMB(preset.value)}
                        className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                          targetMB === preset.value
                            ? 'bg-accent-troll/10 text-accent-troll border-accent-troll/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                            : 'bg-transparent border-border-hover text-text-secondary hover:border-text-muted hover:text-text-primary'
                        }`}
                      >
                        <div className="text-[13px] font-medium">{preset.label}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {preset.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                    <span>Custom Target (5 - 500 MB)</span>
                    <span className="text-text-primary">{targetMB} MB</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={targetMB}
                    onChange={(e) => setTargetMB(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-border-strong rounded-lg appearance-none cursor-pointer accent-accent-troll"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                    Invisible Metadata Signature
                  </label>
                  <input
                    type="text"
                    value={trollMessage}
                    onChange={(e) => setTrollMessage(e.target.value)}
                    placeholder="Enter funny watermark..."
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-border-strong text-text-primary text-sm focus:outline-none focus:border-accent-troll/50 transition-colors"
                  />
                </div>

                {isProcessing && (
                  <div className="space-y-3 p-4 rounded-xl bg-bg-surface border border-accent-troll/20">
                    <div className="flex items-center justify-between text-[11px] font-medium tracking-wide text-accent-troll uppercase">
                      <span className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 animate-spin" />
                        {statusMsg}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-border-strong rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-troll transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted text-center mt-2 italic">
                      "{currentRoast}"
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleBloat}
                  className="w-full py-4 rounded-xl font-semibold text-bg-main bg-accent-troll hover:bg-accent-troll-hover transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Bomb className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Synthesizing Payload...' : 'INFLATE PDF'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {resultBytes && (
          <div className="text-center space-y-6 py-6 animate-fade-in relative z-10">
            <div className="w-16 h-16 rounded-full bg-accent-troll/10 text-accent-troll border border-accent-troll/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,229,255,0.15)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight text-text-primary">
                PDF Swollen!
              </h3>
              <p className="text-[13px] text-text-secondary">
                Your file has been inflated with 100% valid PDF structures.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-xl bg-bg-surface border border-border-strong grid grid-cols-2 gap-4 divide-x divide-border-strong">
              <div>
                <span className="text-[10px] text-text-muted font-medium tracking-wide uppercase">Original Size</span>
                <p className="text-lg font-semibold text-text-primary">
                  {formatBytes(currentBytes)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-accent-troll uppercase font-bold tracking-wide">
                  New Size 💣
                </span>
                <p className="text-xl font-bold text-accent-troll">
                  {formatBytes(resultBytes.byteLength)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-bg-main bg-accent-troll hover:bg-accent-troll-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Swollen PDF</span>
              </button>

              <button
                type="button"
                onClick={resetAll}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-text-secondary bg-bg-surface border border-border-hover hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Bloat Another</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
