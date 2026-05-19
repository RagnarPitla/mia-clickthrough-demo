import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { KzkPlaybook } from '../types/domain';
import { stashFiles } from '../utils/fileStash';
import { isMiaDemoPlaybook, MIA_DEMO_DOCUMENTS, MIA_DEMO_SETUP_DEFAULTS } from '../services/miaDemoData';
import { getDemoSetupDefaults, isScm2DemoPlaybookId, SCM2_DEMO_DOCUMENTS } from '../services/demoPlaybooks';
import { isDemoModeCached } from '../services/demoBootstrap';

interface SetupPageProps {
  playbook?: KzkPlaybook;
  onBack?: () => void;
  onSubmit?: (formData: {
    projectName: string;
    customerName: string;
    description: string;
    devopsUrl: string;
    uploadedFiles: string[];
    playbook: KzkPlaybook;
  }) => void;
}

export default function SetupPage({ playbook: playbookProp, onBack, onSubmit }: SetupPageProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const playbook = playbookProp ?? (location.state as { playbook?: KzkPlaybook } | null)?.playbook ?? null;
  const isMiaDemo = isMiaDemoPlaybook(playbook);
  const isScm2Demo = isScm2DemoPlaybookId(playbook?.id);

  // In demo mode, every playbook (Mia SBD + the Microsoft examples) auto-populates
  // the form so the user just hits Create and the project flows on.
  const demoDefaults = isMiaDemo
    ? MIA_DEMO_SETUP_DEFAULTS
    : (isDemoModeCached() ? getDemoSetupDefaults(playbook?.id) : null);

  // Form state
  const [projectName, setProjectName] = useState(demoDefaults?.projectName ?? '');
  const [customerName, setCustomerName] = useState(demoDefaults?.customerName ?? '');
  const [description, setDescription] = useState(demoDefaults?.description ?? '');
  const [devopsUrl, setDevopsUrl] = useState(demoDefaults?.devopsUrl ?? '');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const isValid = projectName.trim().length > 0 && customerName.trim().length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (!isValid || !playbook) return;
    try { stashFiles(uploadedFiles); } catch { /* File stash not critical */ }
    const formData = {
      projectName: projectName.trim(),
      customerName: customerName.trim(),
      description: description.trim(),
      devopsUrl: devopsUrl.trim(),
      uploadedFiles: Array.from(new Set([
        ...(demoDefaults?.uploadedFiles ?? []),
        ...uploadedFiles.map(f => f.name),
      ])),
      playbook,
    };
    if (onSubmit) {
      onSubmit(formData);
    } else {
      navigate('/creating', { state: formData });
    }
  };

  const handleBack = () => {
    if (onBack) { onBack(); } else { navigate('/'); }
  };

  // No playbook selected
  if (!playbook) {
    return (
      <div data-testid="setup-page" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>No playbook selected.</p>
        <button onClick={handleBack} data-testid="back-to-playbooks" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>← Back to Playbooks</button>
      </div>
    );
  }

  // Parse phases from playbook
  const phases = playbook.phases?.length ? playbook.phases : [];
  const e2eCount = playbook.scopeTrees ? playbook.scopeTrees.split(',').filter(Boolean).length : 0;

  return (
    <div data-testid="setup-page" style={{ flex: 1, display: 'flex', flexDirection: 'column', animation: 'fade-in 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--glass-border)' }}>
        <button onClick={handleBack} data-testid="back-to-playbooks" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>← Back</button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {isMiaDemo || isScm2Demo ? 'Start with Documents' : 'New Project'}
        </h1>
        <div style={{ width: 60 }} />
      </div>

      {/* ═══ SPLIT LAYOUT ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>

        {/* ═══ LEFT: Playbook Info ═══ */}
        <div style={{ padding: '28px 32px', overflow: 'auto', borderRight: '1px solid var(--glass-border)' }}>

          {/* Playbook header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
              background: playbook.layer === 'Microsoft' ? 'linear-gradient(135deg, #007AFF, #5856D6)' : playbook.layer === 'Partner' ? 'linear-gradient(135deg, #30D158, #0B84A5)' : 'linear-gradient(135deg, #8E8E93, #636366)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
            }}>
              {playbook.iconEmoji || '📋'}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{playbook.displayName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                {playbook.publisher ? `by ${playbook.publisher}` : ''} {playbook.version ? `· v${playbook.version}` : ''}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            <div style={sectionLabel}>About this Playbook</div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {playbook.description || 'No description available.'}
            </p>
          </div>

          {/* What's included */}
          <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
            <div style={sectionLabel}>What's Included</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={statBox}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{e2eCount}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>E2E Processes</div>
              </div>
              <div style={statBox}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{playbook.waveCount || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Waves</div>
              </div>
              <div style={statBox}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{playbook.taskCount || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Tasks</div>
              </div>
              <div style={statBox}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{phases.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Phases</div>
              </div>
            </div>
          </div>

          {/* Phases preview */}
          {phases.length > 0 && (
            <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div style={sectionLabel}>Phase Progression</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {phases.map((phase, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'rgba(0,122,255,0.06)', color: 'var(--accent)',
                      border: '1px solid rgba(0,122,255,0.12)',
                    }}>
                      {phase}
                    </span>
                    {i < phases.length - 1 && <span style={{ color: 'var(--text-quaternary)', fontSize: 10 }}>→</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modules covered */}
          {playbook.modulesCovered && (
            <div className="glass" style={{ padding: 20, borderRadius: 'var(--radius-md)' }}>
              <div style={sectionLabel}>Modules Covered</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {playbook.modulesCovered.split(',').map((mod, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}>
                    {mod.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Project Details Form ═══ */}
        <div style={{ padding: '28px 32px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Project Details card */}
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius-md)' }}>
            <div style={sectionLabel}>Project Details</div>

            {/* Project Name */}
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="project-name" style={labelStyle}>Project Name <span style={{ color: 'var(--failed)' }}>*</span></label>
              <input id="project-name" data-testid="input-project-name" type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Zava US Legal Entity Setup" style={inputStyle} />
            </div>

            {/* Customer Name */}
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="customer-name" style={labelStyle}>Customer Name <span style={{ color: 'var(--failed)' }}>*</span></label>
              <input id="customer-name" data-testid="input-customer-name" type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Zava Agentic Retailer" style={inputStyle} />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" style={labelStyle}>Description</label>
              <textarea id="description" data-testid="input-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the implementation scope and goals…" rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
            </div>

            {/* DevOps Repo URL */}
            <div>
              <label htmlFor="devops-url" style={labelStyle}>DevOps Repo URL <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span></label>
              <input id="devops-url" data-testid="input-devops-url" type="url" value={devopsUrl} onChange={e => setDevopsUrl(e.target.value)} placeholder="https://dev.azure.com/org/project/_git/repo" style={inputStyle} />
              <p style={{ fontSize: 11, color: 'rgba(60,60,67,0.42)', marginTop: 4, lineHeight: 1.4 }}>
                Azure DevOps repo where the Worker will commit project artifacts. Create the repo first in ADO, then paste the URL here.
              </p>
            </div>
          </div>

          {/* Document Upload card */}
          <div className="glass" style={{ padding: 24, borderRadius: 'var(--radius-md)' }}>
            <div style={sectionLabel}>Upload Documents</div>
            <p style={{ fontSize: 13, color: '#3c3c43', opacity: 0.6, marginBottom: 16, lineHeight: 1.5 }}>
              {isMiaDemo || isScm2Demo
                ? 'Seeded customer documents are staged for the click-through. Add more files only if you want them shown in this browser session.'
                : 'SOW, RFP, requirements, asset registers, policy docs — AI will ingest these during initialization.'}
            </p>

            {isScm2Demo && (
              <div data-testid="scm2-seeded-documents" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {SCM2_DEMO_DOCUMENTS.map(doc => (
                  <div
                    key={doc.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,122,255,0.06)',
                      border: '1px solid rgba(0,122,255,0.16)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span style={{ color: 'var(--accent)', fontSize: 22, lineHeight: 1 }}>📄</span>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{doc.displayName}</span>
                    <span style={{ padding: '4px 10px', borderRadius: 12, background: 'rgba(0,122,255,0.10)', border: '1px solid rgba(0,122,255,0.20)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      {doc.type}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isMiaDemo && (
              <div data-testid="mia-seeded-documents" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {MIA_DEMO_DOCUMENTS.map(doc => (
                  <div
                    key={doc.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0,122,255,0.06)',
                      border: '1px solid rgba(0,122,255,0.16)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span style={{ color: 'var(--accent)', fontSize: 22, lineHeight: 1 }}>📄</span>
                    <span
                      style={{
                        flex: 1,
                        color: '#1c1c1e',
                        fontWeight: 700,
                        fontSize: 17,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {doc.displayName ?? doc.name}
                    </span>
                    <span
                      style={{
                        color: 'var(--accent)',
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'rgba(0,122,255,0.10)',
                        border: '1px solid rgba(0,122,255,0.22)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.type}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <label htmlFor="file-upload" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '16px 20px', borderRadius: 'var(--radius-sm)',
              border: '2px dashed rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--accent)',
              transition: 'border-color 0.2s, background 0.2s',
            }}>
              📎 Choose files or drag & drop
              <input id="file-upload" type="file" multiple accept=".pdf,.docx,.xlsx,.csv,.txt,.md" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>

            {/* File list */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {uploadedFiles.map((file, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 'var(--radius-xs)',
                    background: 'rgba(0,122,255,0.04)', border: '1px solid rgba(0,122,255,0.10)',
                    fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--accent)' }}>📄</span>
                    <span style={{ flex: 1, color: '#1c1c1e', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    <span style={{ fontSize: 10, color: '#3c3c43', opacity: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>
                      {(file.size / 1024).toFixed(0)}KB
                    </span>
                    <button onClick={() => removeFile(i)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#3c3c43',
                      fontSize: 14, padding: '0 4px', lineHeight: 1, opacity: 0.5,
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
            <button onClick={handleBack} style={{
              padding: '10px 24px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--glass-border)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button data-testid="create-project-btn" onClick={handleCreate} disabled={!isValid} style={{
              padding: '10px 28px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: isValid ? 'var(--accent)' : 'var(--pending)',
              color: isValid ? '#fff' : 'var(--text-tertiary)',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: isValid ? '0 2px 8px rgba(0,122,255,0.20)' : 'none',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}>
              {isMiaDemo || isScm2Demo ? 'Start Implementation →' : 'Create Project →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
  textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3c3c43',
  opacity: 0.55, marginBottom: 14,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#1c1c1e', display: 'block', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-xs, 8px)',
  border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(255,255,255,0.6)',
  fontSize: 14, color: '#1c1c1e', outline: 'none',
  fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const statBox: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 'var(--radius-xs)',
  background: 'rgba(0,122,255,0.03)', border: '1px solid rgba(0,122,255,0.06)',
  textAlign: 'center',
};
