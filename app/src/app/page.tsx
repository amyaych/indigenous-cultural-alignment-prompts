'use client';

import { useState, useRef, useCallback, useEffect, ChangeEvent } from 'react';
import type { Region, ReviewType, ReviewResult, DocumentInputValue } from '@/lib/types';
import { REGIONS } from '@/lib/types';
import ReviewViewer from '@/components/ReviewViewer';

function hasContent(v: DocumentInputValue): boolean {
  return v.kind === 'file' || v.content.trim().length > 0;
}

const EMPTY_DOC: DocumentInputValue = { kind: 'text', content: '' };

interface DocumentInputProps {
  value: DocumentInputValue;
  onChange: (v: DocumentInputValue) => void;
  placeholder: string;
  acceptPdf?: boolean;
  disabled?: boolean;
}

function DocumentInput({ value, onChange, placeholder, acceptPdf, disabled }: DocumentInputProps) {
  const [mode, setMode] = useState<'paste' | 'upload'>('paste');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accept = acceptPdf ? '.pdf,.txt,.md' : '.txt,.md';

  const switchMode = (next: 'paste' | 'upload') => {
    if (disabled) return;
    setMode(next);
    onChange(EMPTY_DOC);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt');
      if (!isPdf && !isText) {
        alert('Please upload a PDF, .txt, or .md file.');
        e.target.value = '';
        return;
      }
      onChange({ kind: 'file', file });
    },
    [onChange],
  );

  const fileName = value.kind === 'file' ? value.file.name : null;

  return (
    <div className="doc-input">
      <div className="input-toggle">
        <button type="button" className={mode === 'paste' ? 'active' : ''} onClick={() => switchMode('paste')} disabled={disabled}>Paste text</button>
        <button type="button" className={mode === 'upload' ? 'active' : ''} onClick={() => switchMode('upload')} disabled={disabled}>Upload file</button>
      </div>

      {mode === 'paste' ? (
        <textarea
          value={value.kind === 'text' ? value.content : ''}
          onChange={(e) => onChange({ kind: 'text', content: e.target.value })}
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : (
        <div className={`file-row ${disabled ? 'file-row--disabled' : ''}`} onClick={() => !disabled && fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept={accept} onChange={handleFile} disabled={disabled} />
          <span className="file-choose">Choose file</span>
          <span className="file-name">{fileName ?? (acceptPdf ? 'PDF, .txt, or .md' : '.txt or .md')}</span>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="page-bg">
      <div className="glass-card loading-card">
        <div className="loading-dots"><span /><span /><span /></div>
        <p className="loading-heading">Reviewing your document</p>
        <p className="loading-sub">Reading against the cultural framework. This usually takes 20-40 seconds.</p>
      </div>
    </div>
  );
}

export default function Page() {
  const toolSectionRef = useRef<HTMLElement | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);

  const [generalRegion, setGeneralRegion] = useState<Region | ''>('');
  const [workplaceRegion, setWorkplaceRegion] = useState<Region | ''>('');
  const [generalDoc, setGeneralDoc] = useState<DocumentInputValue>(EMPTY_DOC);
  const [workplaceDoc, setWorkplaceDoc] = useState<DocumentInputValue>(EMPTY_DOC);
  const [workplaceOrg, setWorkplaceOrg] = useState<DocumentInputValue>(EMPTY_DOC);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);

  useEffect(() => {
    if (!showStartModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowStartModal(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [showStartModal]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const runReview = async (reviewType: ReviewType) => {
    const region = reviewType === 'general' ? generalRegion : workplaceRegion;
    const documentInput = reviewType === 'general' ? generalDoc : workplaceDoc;

    if (!dataConsent) return;
    if (!region || !hasContent(documentInput)) return;
    if (reviewType === 'workplace' && !hasContent(workplaceOrg)) return;

    setLoading(true);
    setError('');
    setResult(null);
    setPdfUrl(null);
    setDocumentText(null);

    if (documentInput.kind === 'file') {
      const isPdf = documentInput.file.type === 'application/pdf' || documentInput.file.name.endsWith('.pdf');
      if (isPdf) {
        setPdfUrl(URL.createObjectURL(documentInput.file));
      } else {
        setDocumentText(await documentInput.file.text());
      }
    } else {
      setDocumentText(documentInput.content);
    }

    const fd = new FormData();
    fd.append('region', region);
    fd.append('reviewType', reviewType);

    if (documentInput.kind === 'file') fd.append('documentFile', documentInput.file);
    else fd.append('documentText', documentInput.content);

    if (reviewType === 'workplace' && hasContent(workplaceOrg)) {
      if (workplaceOrg.kind === 'file') fd.append('orgFile', workplaceOrg.file);
      else fd.append('orgText', workplaceOrg.content);
    }

    try {
      const res = await fetch('/api/review', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.text()) || `Error ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewReview = () => {
    setResult(null);
    setGeneralRegion('');
    setWorkplaceRegion('');
    setGeneralDoc(EMPTY_DOC);
    setWorkplaceDoc(EMPTY_DOC);
    setWorkplaceOrg(EMPTY_DOC);
    setError('');
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setDocumentText(null);
  };

  if (loading) return <LoadingState />;

  if (result) {
    return (
      <ReviewViewer
        result={result}
        documentText={documentText}
        pdfUrl={pdfUrl}
        onNewReview={handleNewReview}
      />
    );
  }

  const generalCanAnalyze = dataConsent && !!generalRegion && hasContent(generalDoc) && !loading;
  const workplaceCanAnalyze = dataConsent && !!workplaceRegion && hasContent(workplaceDoc) && hasContent(workplaceOrg) && !loading;

  return (
    <div className="page-bg">
      <div className="glass-card home-shell">
        <section className="hero-purpose section-block">
          <h1 className="hero-title">Indigenous Cultural Alignment Review</h1>
          <p className="hero-subhead">
            A pre-engagement tool to help you catch cultural risks and strengths in your work, before you sit down with community.
          </p>
          <p className="hero-why">
            Bring named, verifiable cultural frameworks into your planning early. Ask better questions, close the gaps, and show up with more integrity before the first conversation happens.
          </p>
          <button type="button" className="start-btn" onClick={() => setShowStartModal(true)}>Start</button>
        </section>

        <section className="how-it-works section-block" aria-label="How it works">
          <h2 className="section-title">How it Works</h2>
          <div className="how-grid">
            <article className="how-item">
              <div className="how-icon" aria-hidden="true">1</div>
              <div className="how-item-text">
                <h3>Select Region</h3>
                <p>Choose the Indigenous cultural framework that matches your project's location.</p>
              </div>
            </article>
            <article className="how-item">
              <div className="how-icon" aria-hidden="true">2</div>
              <div className="how-item-text">
                <h3>Upload Content</h3>
                <p>Paste or upload your project document. Add workplace policies for a Workplace Review.</p>
              </div>
            </article>
            <article className="how-item">
              <div className="how-icon" aria-hidden="true">3</div>
              <div className="how-item-text">
                <h3>Review Results</h3>
                <p>Receive an annotated analysis with strengths, observations, provocations, and actions.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="read-before-section section-block" aria-label="Read before starting">
          <h2 className="section-title">Important: Data Sovereignty &amp; Privacy</h2>
          <ul className="important-list">
            <li>Submitting your document won&apos;t expose or harm the communities named in your work. This tool reviews your approach, not theirs.</li>
            <li>Remove personally identifiable information before uploading.</li>
            <li>
              Check with your IT or Policy lead before uploading internal organisational documents.
            </li>
          </ul>
          <label className="consent-check">
            <input
              type="checkbox"
              checked={dataConsent}
              onChange={(e) => setDataConsent(e.target.checked)}
            />
            <span>I have read and agree to the data sovereignty guidelines.</span>
          </label>
        </section>

        <section className={`tool-section section-block ${!dataConsent ? 'tool-section--locked' : ''}`} ref={toolSectionRef}>
          <h2 className="section-title">Start Your Review</h2>
          <div className="tool-paths">
            <article className="tool-card">
              <h3>General Review</h3>
              <p>Apply regional cultural prompts to your project.</p>

              <label className="field-label">Region</label>
              <select
                className="glass-select"
                value={generalRegion}
                onChange={(e) => setGeneralRegion(e.target.value as Region)}
                disabled={!dataConsent}
              >
                <option value="">Choose a region</option>
                {REGIONS.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>

              <label className="field-label">Project document</label>
              <DocumentInput
                value={generalDoc}
                onChange={setGeneralDoc}
                placeholder="Paste your project text here..."
                acceptPdf
                disabled={!dataConsent}
              />

              <button
                type="button"
                className="submit-btn"
                onClick={() => runReview('general')}
                disabled={!generalCanAnalyze}
              >
                Analyse General Review
              </button>
            </article>

            <article className="tool-card">
              <h3>Workplace Review</h3>
              <p>Compare your work against both regional prompts and your own organisational strategies.</p>

              <label className="field-label">Region</label>
              <select
                className="glass-select"
                value={workplaceRegion}
                onChange={(e) => setWorkplaceRegion(e.target.value as Region)}
                disabled={!dataConsent}
              >
                <option value="">Choose a region</option>
                {REGIONS.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>

              <label className="field-label">Project document</label>
              <DocumentInput
                value={workplaceDoc}
                onChange={setWorkplaceDoc}
                placeholder="Paste your project text here..."
                acceptPdf
                disabled={!dataConsent}
              />

              <label className="field-label">Workplace policies and strategies</label>
              <DocumentInput
                value={workplaceOrg}
                onChange={setWorkplaceOrg}
                placeholder="Paste your workplace strategy and policy documents here..."
                acceptPdf
                disabled={!dataConsent}
              />

              <button
                type="button"
                className="submit-btn"
                onClick={() => runReview('workplace')}
                disabled={!workplaceCanAnalyze}
              >
                Analyse Workplace Review
              </button>
            </article>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </section>

        <section className="what-to-expect section-block">
          <h2 className="section-title">What to Expect</h2>
          <ol className="expect-list">
            <li>Choose your region and review path.</li>
            <li>Add your project text or upload your files.</li>
            <li>Submit to analyse your content against cultural frameworks.</li>
            <li>Receive strengths, observations, provocations, and areas needing review.</li>
          </ol>
          <p className="expect-thankyou">Thank you for taking the time to review with care.</p>
        </section>

        <section className="annotation-legend section-block" aria-label="Review annotation guide">
          <h2 className="section-title">Reading Your Review</h2>
          <div className="legend-grid">
            <div className="legend-item legend-item--positive">
              <span className="legend-label legend-label--positive">Strength</span>
              <span className="legend-desc">Something done well. A genuine alignment with cultural values or rights.</span>
            </div>
            <div className="legend-item legend-item--observation">
              <span className="legend-label legend-label--observation">Observation</span>
              <span className="legend-desc">A neutral finding worth noting. Context that shapes interpretation.</span>
            </div>
            <div className="legend-item legend-item--provocation">
              <span className="legend-label legend-label--provocation">Provocation</span>
              <span className="legend-desc">A challenging question to sit with. No right answer, but important to consider.</span>
            </div>
            <div className="legend-item legend-item--action">
              <span className="legend-label legend-label--action">Action</span>
              <span className="legend-desc">An area that needs change. A gap between intent and cultural alignment.</span>
            </div>
          </div>
        </section>

        <footer className="story-footer section-block">
          <h2 className="section-title">Why this was created</h2>
          <p>
            Many professionals want to do the right thing but feel cultural anxiety. This project helps move from intent to action by
            surfacing named, verifiable frameworks and prompting reflection before engagement.
          </p>
          <p>
            This is a pre-engagement tool, not a replacement for community authority or relationships. It supports better preparation,
            clearer questions, and stronger accountability in project planning.
          </p>
        </footer>
      </div>

      {showStartModal && (
        <div className="start-modal-backdrop" role="presentation" onClick={() => setShowStartModal(false)}>
          <div
            className="start-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="start-modal-title">Before You Begin</h2>
            <p>This process usually takes around 2-4 minutes to complete and 20-40 seconds to analyse.</p>
            <ol>
              <li>Read the data sovereignty guidance and confirm consent.</li>
              <li>Choose General or Workplace review.</li>
              <li>Select your region and upload your content.</li>
              <li>Submit and review the annotated results.</li>
            </ol>
            <div className="start-modal-actions">
              <button type="button" className="viewer-btn" onClick={() => setShowStartModal(false)}>Close</button>
              <button
                type="button"
                className="viewer-btn viewer-btn--primary"
                onClick={() => {
                  setShowStartModal(false);
                  toolSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
