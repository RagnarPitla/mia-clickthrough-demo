import { useEffect, useMemo, useState } from 'react';
import type { CustomerDataFile, CustomerDataSourceType } from '../types/domain';
import { fetchProjectCustomerData, uploadProjectCustomerDataFiles } from '../services/dataverse';

interface CustomerDataPageProps {
  projectId: string | null;
  demoFiles?: CustomerDataFile[];
}

const SOURCE_COLORS: Record<CustomerDataSourceType, { bg: string; fg: string }> = {
  Seeded: { bg: 'rgba(0,122,255,0.10)', fg: '#007AFF' },
  Uploaded: { bg: 'rgba(48,209,88,0.12)', fg: '#248A3D' },
  Reference: { bg: 'rgba(142,142,147,0.12)', fg: '#636366' },
};

function contentPreview(body: string): string {
  const marker = '\nContent:\n';
  const index = body.indexOf(marker);
  return index >= 0 ? body.slice(index + marker.length) : body;
}

function formatDate(value: string): string {
  if (!value) return 'unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function CustomerDataPage({ projectId, demoFiles }: CustomerDataPageProps) {
  const [files, setFiles] = useState<CustomerDataFile[]>(demoFiles ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CustomerDataSourceType | 'All'>('All');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (demoFiles) {
      setFiles(demoFiles);
      setSelectedId(current => current && demoFiles.some(row => row.id === current) ? current : demoFiles[0]?.id ?? null);
      setError(null);
      setLoading(false);
      return;
    }
    if (!projectId) {
      setFiles([]);
      setSelectedId(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchProjectCustomerData(projectId);
      setFiles(rows);
      setSelectedId(current => current && rows.some(row => row.id === current) ? current : rows[0]?.id ?? null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId, demoFiles]);

  const filteredFiles = useMemo(
    () => filter === 'All' ? files : files.filter(file => file.sourceType === filter),
    [files, filter],
  );
  const selected = files.find(file => file.id === selectedId) ?? filteredFiles[0] ?? null;

  const handleUpload = async (items: FileList | null) => {
    if (!projectId || !items || items.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await uploadProjectCustomerDataFiles(projectId, Array.from(items));
      await load();
      setFilter('Uploaded');
    } catch (e: any) {
      setError(e.message ?? 'Failed to upload customer data');
    } finally {
      setUploading(false);
    }
  };

  if (!projectId && !demoFiles) {
    return (
      <div className="glass" style={{ borderRadius: 14, padding: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Customer Data</h2>
        <p style={{ color: 'rgba(60,60,67,0.62)' }}>Select a project to view customer files.</p>
      </div>
    );
  }

  return (
    <div data-testid="customer-data-page" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 12, minHeight: 0 }}>
      <section className="glass" style={{ borderRadius: 14, padding: 16, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
          <div>
            <div className="label" style={{ color: 'rgba(60,60,67,0.42)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Customer Data
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: 18, color: '#1c1c1e' }}>
              Files in system
            </h2>
          </div>
          <button
            onClick={load}
            disabled={loading || Boolean(demoFiles)}
            style={{
              padding: '6px 10px',
              borderRadius: 9,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.6)',
              cursor: loading || demoFiles ? 'default' : 'pointer',
              color: '#007AFF',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Refresh
          </button>
        </div>

        {demoFiles ? (
          <div
            data-testid="customer-data-demo-note"
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(0,122,255,0.16)',
              background: 'rgba(0,122,255,0.05)',
              color: '#007AFF',
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 12,
              lineHeight: 1.45,
            }}
          >
            Seeded Zava document pack. This view is self-contained and does not upload to Dataverse.
          </div>
        ) : (
          <label
            htmlFor="customer-data-upload"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 16px',
              borderRadius: 12,
              border: '2px dashed rgba(0,122,255,0.22)',
              background: 'rgba(0,122,255,0.05)',
              cursor: uploading ? 'default' : 'pointer',
              color: '#007AFF',
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {uploading ? 'Uploading...' : '+ Upload customer data'}
            <input
              id="customer-data-upload"
              data-testid="customer-data-upload"
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.json,.yaml,.yml"
              disabled={uploading}
              onChange={e => { handleUpload(e.target.files); e.currentTarget.value = ''; }}
              style={{ display: 'none' }}
            />
          </label>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {(['All', 'Seeded', 'Uploaded', 'Reference'] as const).map(item => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              style={{
                padding: '5px 10px',
                borderRadius: 9,
                border: '1px solid rgba(0,0,0,0.08)',
                background: filter === item ? 'rgba(0,122,255,0.10)' : 'rgba(255,255,255,0.55)',
                color: filter === item ? '#007AFF' : 'rgba(60,60,67,0.72)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: 10, padding: 10, borderRadius: 10, background: 'rgba(255,59,48,0.08)', color: '#C01B13', fontSize: 12 }}>
            {error}
          </div>
        )}

        {loading && files.length === 0 ? (
          <div style={{ padding: 24, color: '#007AFF', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            Loading customer data...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ padding: 24, color: 'rgba(60,60,67,0.62)', fontSize: 13, textAlign: 'center' }}>
            No files match this filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredFiles.map(file => {
              const color = SOURCE_COLORS[file.sourceType];
              return (
                <button
                  key={file.id}
                  data-testid={`customer-data-file-${file.id}`}
                  onClick={() => setSelectedId(file.id)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 12,
                    border: selected?.id === file.id ? '1px solid rgba(0,122,255,0.35)' : '1px solid rgba(0,0,0,0.06)',
                    background: selected?.id === file.id ? 'rgba(0,122,255,0.07)' : 'rgba(255,255,255,0.64)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1c1c1e', wordBreak: 'break-word' }}>{file.name}</span>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: color.fg, background: color.bg, padding: '2px 7px', borderRadius: 999 }}>
                      {file.sourceType}
                    </span>
                    {file.fileType && <span style={{ fontSize: 10, color: 'rgba(60,60,67,0.52)', fontFamily: "'JetBrains Mono', monospace" }}>{file.fileType}</span>}
                    {file.truncated && <span style={{ fontSize: 10, color: '#FF9500', fontWeight: 700 }}>truncated</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="glass" style={{ borderRadius: 14, padding: 18, overflow: 'auto' }}>
        {selected ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div>
                <div className="label" style={{ color: 'rgba(60,60,67,0.42)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Preview
                </div>
                <h3 style={{ margin: '4px 0 6px', fontSize: 17, color: '#1c1c1e' }}>{selected.name}</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'rgba(60,60,67,0.62)' }}>
                  <span>{selected.sourceType}</span>
                  <span>Modified {formatDate(selected.modifiedOn || selected.createdOn)}</span>
                  {selected.mimeType && <span>{selected.mimeType}</span>}
                </div>
              </div>
            </div>
            <pre
              data-testid="customer-data-preview"
              style={{
                margin: 0,
                padding: 14,
                borderRadius: 12,
                background: 'rgba(0,0,0,0.035)',
                border: '1px solid rgba(0,0,0,0.06)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 12,
                lineHeight: 1.55,
                color: '#1c1c1e',
                fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
              }}
            >
              {contentPreview(selected.body)}
            </pre>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(60,60,67,0.62)' }}>
            Select a file to preview its stored contents.
          </div>
        )}
      </section>
    </div>
  );
}
