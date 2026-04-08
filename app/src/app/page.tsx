'use client';

import { useState, useRef, useCallback, ChangeEvent } from 'react';
import type { Region, ReviewType, ReviewResult, DocumentInputValue, IntakeFields } from '@/lib/types';
import { REGIONS } from '@/lib/types';
import ReviewViewer from '@/components/ReviewViewer';

// --- Helpers ---

function hasContent(v: DocumentInputValue): boolean {
  return v.kind === 'file' || v.content.trim().length > 0;
}

const EMPTY_DOC: DocumentInputValue = { kind: 'text', content: '' };

const EMPTY_INTAKE: IntakeFields = { role: '', sector: '', localGroup: '', iwiContext: '' };

const SECTORS = ['Government', 'Private', 'Non-profit', 'Community'];

// --- Step wrapper ---

function Step({ number, label, children }: { number: number; label: string; children: React.ReactNode }) {
  return (
    <div className="step">
      <div className="step-header">
        <span className="step-number">{number}</span>
        <span className="step-label">{label}</span>
      </div>
      <div className="step-body">{children}</div>
    </div>
  );
}

// --- Document input ---

interface DocumentInputProps {
  value: DocumentInputValue;
  onChange: (v: DocumentInputValue) => void;
  placeholder: string;
  acceptPdf?: boolean;
}

function DocumentInput({ value, onChange, placeholder, acceptPdf }: DocumentInputProps) {
  const [mode, setMode] = useState<'paste' | 'upload'>('paste');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accept = acceptPdf ? '.pdf,.txt,.md' : '.txt,.md';

  const switchMode = (next: 'paste' | 'upload') => {
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
        <button type="button" className={mode === 'paste' ? 'active' : ''} onClick={() => switchMode('paste')}>Paste text</button>
        <button type="button" className={mode === 'upload' ? 'active' : ''} onClick={() => switchMode('upload')}>Upload file</button>
      </div>

      {mode === 'paste' ? (
        <textarea
          value={value.kind === 'text' ? value.content : ''}
          onChange={(e) => onChange({ kind: 'text', content: e.target.value })}
          placeholder={placeholder}
        />
      ) : (
        <div className="file-row" onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept={accept} onChange={handleFile} />
          <span className="file-choose">Choose file</span>
          <span className="file-name">{fileName ?? (acceptPdf ? 'PDF, .txt, or .md' : '.txt or .md')}</span>
        </div>
      )}
    </div>
  );
}

// --- Loading ---

function LoadingState() {
  return (
    <div className="page-bg">
      <div className="glass-card loading-card">
        <div className="loading-dots"><span /><span /><span /></div>
        <p className="loading-heading">Reviewing your document</p>
        <p className="loading-sub">Reading against the cultural framework. This usually takes 20–40 seconds.</p>
      </div>
    </div>
  );
}

// --- Main page ---

export default function Page() {
  const [region, setRegion] = useState<Region | null>(null);
  const [reviewType, setReviewType] = useState<ReviewType | null>(null);
  const [intake, setIntake] = useState<IntakeFields>(EMPTY_INTAKE);
  const [docInput, setDocInput] = useState<DocumentInputValue>(EMPTY_DOC);
  const [orgInput, setOrgInput] = useState<DocumentInputValue>(EMPTY_DOC);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);

  const canSubmit = region && reviewType && hasContent(docInput) && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    setResult(null);
    setPdfUrl(null);
    setDocumentText(null);

    if (docInput.kind === 'file') {
      const isPdf = docInput.file.type === 'application/pdf' || docInput.file.name.endsWith('.pdf');
      if (isPdf) {
        setPdfUrl(URL.createObjectURL(docInput.file));
      } else {
        setDocumentText(await docInput.file.text());
      }
    } else {
      setDocumentText(docInput.content);
    }

    const fd = new FormData();
    fd.append('region', region!);
    fd.append('reviewType', reviewType!);
    if (docInput.kind === 'file') fd.append('documentFile', docInput.file);
    else fd.append('documentText', docInput.content);
    if (hasContent(orgInput)) {
      if (orgInput.kind === 'file') fd.append('orgFile', orgInput.file);
      else fd.append('orgText', orgInput.content);
    }
    if (intake.role) fd.append('role', intake.role);
    if (intake.sector) fd.append('sector', intake.sector);
    if (intake.localGroup) fd.append('localGroup', intake.localGroup);
    if (intake.iwiContext) fd.append('iwiContext', intake.iwiContext);

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
    setDocInput(EMPTY_DOC);
    setOrgInput(EMPTY_DOC);
    setIntake(EMPTY_INTAKE);
    setRegion(null);
    setReviewType(null);
    setError('');
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
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

  return (
    <div className="page-bg">
      <div className="glass-card">

        {/* Hero */}
        <section className="hero">
          <div className="hero-left">
            <p className="hero-eyebrow">Cultural Alignment Tool</p>
            <h1 className="hero-title">Indigenous Cultural<br />Alignment Review</h1>
            <p className="hero-tagline">
              A pre-engagement tool to help you identify cultural risks, gaps, and strengths
              in your work, before you engage with community.
            </p>
          </div>
          <div className="hero-right">
            <div className="option-card">
              <div className="option-card-label">General Review</div>
              <p className="option-card-desc">
                I want a general cultural review of my project, document, or brief, checked
                against publicly documented cultural frameworks, legislation, and rights instruments
                for the region I am working in.
              </p>
            </div>
            <div className="option-card">
              <div className="option-card-label">Workplace Review</div>
              <p className="option-card-desc">
                I want to review my work against cultural frameworks AND my own organisation's
                strategies and policies, to ensure alignment with both external expectations
                and our internal commitments.
              </p>
            </div>
          </div>
          <div className="hero-scroll">Scroll to begin</div>
        </section>

        {/* Legend */}
        <section className="legend-section">
          <p className="legend-title">Your review will annotate your document using these categories:</p>
          <div className="legend-items">
            <div className="legend-item legend-item--positive">Strength: areas of good alignment</div>
            <div className="legend-item legend-item--observation">Observation: neutral findings to note</div>
            <div className="legend-item legend-item--provocation">Provocation: questions to deepen your thinking</div>
            <div className="legend-item legend-item--action">Action Required: areas that need attention</div>
          </div>
        </section>

        {/* Form steps */}
        <div className="form-steps">

          {/* Step 1 */}
          <Step number={1} label="Choose your region">
            <div className="pill-group">
              {REGIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`pill-btn ${region === id ? 'active' : ''}`}
                  onClick={() => { setRegion(id); setReviewType(null); }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Step>

          {/* Step 2 */}
          {region && (
            <Step number={2} label="Choose your review type">
              <div className="type-options">
                <button
                  type="button"
                  className={`type-option ${reviewType === 'general' ? 'active' : ''}`}
                  onClick={() => setReviewType('general')}
                >
                  <span className="type-option-name">General Review</span>
                  <span className="type-option-desc">Review against cultural frameworks and legislation</span>
                </button>
                <button
                  type="button"
                  className={`type-option ${reviewType === 'workplace' ? 'active' : ''}`}
                  onClick={() => setReviewType('workplace')}
                >
                  <span className="type-option-name">Workplace Review</span>
                  <span className="type-option-desc">Review against cultural frameworks AND your organisation's policies</span>
                </button>
              </div>
            </Step>
          )}

          {/* Step 3 — Intake */}
          {reviewType && (
            <Step number={3} label="Tell us about your work">
              <p className="step-hint">
                This context helps the reviewer give you a more accurate assessment. All fields are optional
                but the more you share, the more specific the review.
              </p>
              <div className="intake-grid">
                <div className="intake-field">
                  <label className="intake-label">Your role and industry</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. Policy Analyst in Health, Startup Founder in Tech"
                    value={intake.role}
                    onChange={(e) => setIntake((p) => ({ ...p, role: e.target.value }))}
                  />
                </div>
                <div className="intake-field">
                  <label className="intake-label">Sector</label>
                  <div className="pill-group">
                    {SECTORS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`pill-btn pill-btn--sm ${intake.sector === s ? 'active' : ''}`}
                        onClick={() => setIntake((p) => ({ ...p, sector: p.sector === s ? '' : s }))}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="intake-field">
                  <label className="intake-label">
                    {region === 'maori-aotearoa' ? 'Mana Whenua (iwi or hapū)' :
                     region === 'aboriginal-torres-strait-islander-australia' ? 'Aboriginal Nation or Country' :
                     region === 'first-nations-metis-inuit-canada' ? 'First Nation, Métis Nation, or Inuit region' :
                     'Relevant community group or region'}
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. Ngāti Whātua, Wiradjuri, Cree Nation..."
                    value={intake.localGroup}
                    onChange={(e) => setIntake((p) => ({ ...p, localGroup: e.target.value }))}
                  />
                </div>
                <div className="intake-field">
                  <label className="intake-label">Community documents you are referencing (if any)</label>
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="e.g. Ngāti Porou Environmental Plan, Healing to Wellness Court framework..."
                    value={intake.iwiContext}
                    onChange={(e) => setIntake((p) => ({ ...p, iwiContext: e.target.value }))}
                  />
                </div>
              </div>
            </Step>
          )}

          {/* Step 4 — Document */}
          {reviewType && (
            <Step number={4} label="Upload your document">
              <p className="step-hint">
                Upload or paste the document, policy, product brief, or content you want reviewed.
                PDFs, plain text, and Markdown files are supported.
              </p>
              <DocumentInput
                value={docInput}
                onChange={setDocInput}
                placeholder="Paste your document content here..."
                acceptPdf
              />
            </Step>
          )}

          {/* Step 5 — Org docs (workplace only) */}
          {reviewType === 'workplace' && (
            <Step number={5} label="Upload your organisation's documents">
              <p className="step-hint">
                Upload or paste your organisation's internal strategies, policies, or frameworks
                (e.g. Māori Strategy, Reconciliation Action Plan, Te Tiriti framework). The review
                will cross-reference your document against these alongside the cultural framework.
              </p>
              <DocumentInput
                value={orgInput}
                onChange={setOrgInput}
                placeholder="Paste your organisation's strategies and policies here..."
                acceptPdf
              />
            </Step>
          )}

          {/* Submit */}
          {reviewType && (
            <div className="submit-section">
              {error && <p className="error-msg">{error}</p>}
              <button
                type="button"
                className="submit-btn"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                Run Review
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <div className="disclaimer-section">
            <div className="disclaimer-block">
              <strong>Data Sovereignty.</strong> Do not upload sensitive, sacred, or private community
              documents without explicit community consent. Anonymise names and specific locations where
              appropriate. These prompts are a pre-engagement tool. They do not store or manage community knowledge.
            </div>
            <div className="disclaimer-block">
              <strong>AI Policy.</strong> Before submitting community-related material to this or any
              third-party AI service, check your organisation's AI policy. Read the prompts in this
              tool before adding them to any company system or Claude Project. Outputs are guidance
              only. They do not replace legal advice or authentic community relationships.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
