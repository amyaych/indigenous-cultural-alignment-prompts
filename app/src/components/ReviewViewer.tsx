'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Annotation, AnnotationType, ReviewResult } from '@/lib/types';

const TYPE_LABELS: Record<AnnotationType, string> = {
  positive: 'Strength',
  observation: 'Observation',
  provocation: 'Provocation',
  action: 'Action Required',
};

// --- Text segmentation for inline highlights ---

interface Segment {
  text: string;
  annotationId: string | null;
}

function buildSegments(text: string, annotations: Annotation[]): Segment[] {
  const intervals: { start: number; end: number; id: string }[] = [];

  for (const ann of annotations) {
    if (!ann.quote) continue;
    const idx = text.indexOf(ann.quote);
    if (idx === -1) continue;
    // Skip if overlapping with an already-placed interval
    const overlaps = intervals.some((iv) => iv.start < idx + ann.quote.length && iv.end > idx);
    if (overlaps) continue;
    intervals.push({ start: idx, end: idx + ann.quote.length, id: ann.id });
  }

  intervals.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let pos = 0;

  for (const iv of intervals) {
    if (iv.start > pos) {
      segments.push({ text: text.slice(pos, iv.start), annotationId: null });
    }
    segments.push({ text: text.slice(iv.start, iv.end), annotationId: iv.id });
    pos = iv.end;
  }

  if (pos < text.length) {
    segments.push({ text: text.slice(pos), annotationId: null });
  }

  return segments;
}

// --- Score display ---

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max((score / 5) * 100, 0), 100);
  const label =
    score >= 4 ? 'Strong alignment' :
    score >= 3 ? 'Moderate alignment' :
    score >= 2 ? 'Developing alignment' :
    'Significant gaps identified';

  return (
    <div className="score-bar-wrapper">
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="score-bar-value">{score.toFixed(1)} / 5</span>
      <span className="score-bar-label">{label}</span>
    </div>
  );
}

// --- Annotation card ---

interface CardProps {
  annotation: Annotation;
  active: boolean;
  onClick: () => void;
}

function AnnotationCard({ annotation, active, onClick }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [active]);

  return (
    <div
      ref={ref}
      className={`ann-card ann-card--${annotation.type} ${active ? 'ann-card--active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="ann-card-header">
        <span className={`ann-type-badge ann-type-badge--${annotation.type}`}>
          {TYPE_LABELS[annotation.type]}
        </span>
        {annotation.reference && (
          <span className="ann-reference">{annotation.reference}</span>
        )}
      </div>
      {annotation.quote && (
        <blockquote className="ann-quote">{annotation.quote}</blockquote>
      )}
      <p className="ann-comment">{annotation.comment}</p>
    </div>
  );
}

// --- Text document renderer with inline highlights ---

interface TextDocumentProps {
  text: string;
  annotations: Annotation[];
  activeId: string | null;
  onHighlightClick: (id: string) => void;
  markRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
}

function TextDocument({ text, annotations, activeId, onHighlightClick, markRefs }: TextDocumentProps) {
  const segments = buildSegments(text, annotations);

  return (
    <div className="text-document">
      {segments.map((seg, i) => {
        if (seg.annotationId === null) {
          return <span key={i}>{seg.text}</span>;
        }
        const ann = annotations.find((a) => a.id === seg.annotationId)!;
        return (
          <mark
            key={i}
            ref={(el) => { markRefs.current[seg.annotationId!] = el; }}
            className={`highlight highlight--${ann.type} ${activeId === seg.annotationId ? 'highlight--active' : ''}`}
            onClick={() => onHighlightClick(seg.annotationId!)}
            title={TYPE_LABELS[ann.type]}
          >
            {seg.text}
          </mark>
        );
      })}
    </div>
  );
}

// --- PDF document renderer ---

function PdfDocument({ url }: { url: string }) {
  return (
    <iframe
      className="pdf-iframe"
      src={url}
      title="Document under review"
    />
  );
}

// --- Main viewer ---

interface ReviewViewerProps {
  result: ReviewResult;
  documentText: string | null;
  pdfUrl: string | null;
  onNewReview: () => void;
}

export default function ReviewViewer({ result, documentText, pdfUrl, onNewReview }: ReviewViewerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const markRefs = useRef<Record<string, HTMLElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const handleHighlightClick = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleCardClick = useCallback((id: string) => {
    setActiveId(id);
    const mark = markRefs.current[id];
    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handlePrint = () => window.print();

  const generalAnnotations = result.annotations.filter((a) => !a.quote);
  const specificAnnotations = result.annotations.filter((a) => a.quote && documentText);

  return (
    <div className="viewer">
      {/* Header bar */}
      <div className="viewer-header">
        <div className="viewer-header-left">
          <span className="viewer-title">Cultural Alignment Review</span>
          <ScoreBar score={result.overallScore} />
        </div>
        <div className="viewer-header-right">
          <button type="button" className="viewer-btn" onClick={onNewReview}>
            New Review
          </button>
          <button type="button" className="viewer-btn viewer-btn--primary" onClick={handlePrint}>
            Download PDF
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="viewer-summary">
        <p>{result.summary}</p>
      </div>

      {/* Body */}
      <div className="viewer-body">
        {/* Document panel */}
        <div className="viewer-document">
          {pdfUrl ? (
            <PdfDocument url={pdfUrl} />
          ) : documentText ? (
            <TextDocument
              text={documentText}
              annotations={specificAnnotations}
              activeId={activeId}
              onHighlightClick={handleHighlightClick}
              markRefs={markRefs}
            />
          ) : null}
        </div>

        {/* Annotation panel */}
        <div className="viewer-annotations">
          <div className="ann-panel-label">
            {result.annotations.length} annotation{result.annotations.length !== 1 ? 's' : ''}
          </div>

          {result.annotations.map((ann) => (
            <AnnotationCard
              key={ann.id}
              annotation={ann}
              active={activeId === ann.id}
              onClick={() => handleCardClick(ann.id)}
            />
          ))}

          <div className="ann-panel-footer">
            This review is a starting point for your thinking. The most important step is always
            one that involves real people and real relationships.
          </div>
        </div>
      </div>

      {/* Print-only: all annotations listed below the document */}
      <div className="print-annotations">
        <h2>Annotations</h2>
        <p className="print-summary">{result.summary}</p>
        {result.annotations.map((ann) => (
          <div key={ann.id} className={`print-ann print-ann--${ann.type}`}>
            <div className="print-ann-header">
              <strong>{TYPE_LABELS[ann.type]}</strong>
              {ann.reference && <span> · {ann.reference}</span>}
            </div>
            {ann.quote && <blockquote className="print-ann-quote">"{ann.quote}"</blockquote>}
            <p>{ann.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
