import { useState, useRef } from 'react';
import { BG_PRESETS } from '../backgroundPresets';
import { DEMO_MODE_KEY } from '../services/demoMode';
import { isDemoModeCached } from '../services/demoBootstrap';
import { MIA_COWORK_DECISION_KEY, MIA_DEMO_PLAYBACK_KEY } from '../services/miaDemoData';

const PROJECT_KEY = 'kazuki-project';

interface SettingsPageProps {
  bgImage?: string;
  onBgImageChange?: (url: string) => void;
}

const POLLING_OPTIONS = [
  { value: 5000, label: '5s' },
  { value: 15000, label: '15s' },
  { value: 30000, label: '30s' },
  { value: 60000, label: '1m' },
];

const BPC_DEPTH_OPTIONS = [
  { value: 1, label: 'E2E only' },
  { value: 2, label: 'E2E + Process Area' },
  { value: 3, label: 'E2E + Area + Process' },
  { value: 4, label: 'All levels (incl. Scenario)' },
];

function loadSetting(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function saveSetting(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

export default function SettingsPage({ bgImage, onBgImageChange }: SettingsPageProps) {
  const [pollingInterval, setPollingInterval] = useState(() => loadSetting('kazuki-polling', '15000'));
  const [notifications, setNotifications] = useState(() => loadSetting('kazuki-notifications', 'true') === 'true');
  const [autopilot, setAutopilot] = useState(() => loadSetting('kazuki-autopilot', 'false') === 'true');
  const [bpcDepth, setBpcDepth] = useState(() => loadSetting('kazuki-bpc-depth', '3'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [demoActive] = useState(() => isDemoModeCached());

  function exitDemo() {
    try {
      localStorage.removeItem(DEMO_MODE_KEY);
      localStorage.removeItem(PROJECT_KEY);
      localStorage.removeItem(MIA_DEMO_PLAYBACK_KEY);
      localStorage.removeItem(MIA_COWORK_DECISION_KEY);
    } catch {
      // localStorage unavailable — the URL flag below still clears demo mode.
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('demo');
    url.searchParams.delete('present');
    url.searchParams.delete('webapp');
    url.searchParams.delete('step');
    url.searchParams.delete('tour');
    url.searchParams.set('demo', 'false');
    window.location.href = url.toString();
  }

  return (
    <div data-testid="settings-page" style={{ padding: 24, maxWidth: 520 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: 'var(--text-primary)' }}>Settings</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Background Image */}
        {onBgImageChange && (
          <section>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Background Image</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
              {BG_PRESETS.map(bg => (
                <button
                  key={bg.label}
                  data-testid={`bg-${bg.label.toLowerCase()}`}
                  onClick={() => onBgImageChange(bg.url)}
                  style={{
                    width: '100%', aspectRatio: '16/10', borderRadius: 8, cursor: 'pointer',
                    background: `url(${bg.url}) center/cover no-repeat`,
                    border: bgImage === bg.url ? '2px solid var(--accent)' : '1px solid var(--border-glass)',
                    transition: 'border-color 0.2s, transform 0.15s',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 6px', fontSize: 9, fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>{bg.label}</span>
                </button>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              data-testid="bg-upload-input"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => { if (typeof reader.result === 'string') onBgImageChange(reader.result); };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <button
              data-testid="bg-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginTop: 8, width: '100%', padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
            >
              ↑ Upload your own image
            </button>
          </section>
        )}

        {/* Polling interval */}
        <section>
          <label style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Polling Interval</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {POLLING_OPTIONS.map(o => (
              <button
                key={o.value}
                data-testid={`polling-${o.value}`}
                onClick={() => { setPollingInterval(String(o.value)); saveSetting('kazuki-polling', String(o.value)); }}
                style={{
                  padding: '6px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
                  background: pollingInterval === String(o.value) ? 'var(--accent-glow)' : 'transparent',
                  border: pollingInterval === String(o.value) ? '1px solid var(--accent-border)' : '1px solid var(--border-glass)',
                  color: pollingInterval === String(o.value) ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: pollingInterval === String(o.value) ? 600 : 400,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* BPC Tree Depth */}
        <section>
          <label style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BPC Tree Depth</label>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 8 }}>How many levels to show in Business Process Scope</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {BPC_DEPTH_OPTIONS.map(o => (
              <button
                key={o.value}
                data-testid={`bpc-depth-${o.value}`}
                onClick={() => { setBpcDepth(String(o.value)); saveSetting('kazuki-bpc-depth', String(o.value)); }}
                style={{
                  padding: '8px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                  background: bpcDepth === String(o.value) ? 'var(--accent-glow)' : 'transparent',
                  border: bpcDepth === String(o.value) ? '1px solid var(--accent-border)' : '1px solid var(--border-glass)',
                  color: bpcDepth === String(o.value) ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: bpcDepth === String(o.value) ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notifications</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Show toast when tasks complete</div>
          </div>
          <button
            data-testid="toggle-notifications"
            onClick={() => { setNotifications(v => { const n = !v; saveSetting('kazuki-notifications', String(n)); return n; }); }}
            role="switch"
            aria-checked={notifications}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: notifications ? 'var(--accent)' : 'var(--pending)', transition: 'background 0.2s' }}
          >
            <span style={{ position: 'absolute', top: 2, left: notifications ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </section>

        {/* Autopilot */}
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Autopilot</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Auto-approve Ready waves without human gate</div>
          </div>
          <button
            data-testid="toggle-autopilot"
            onClick={() => { setAutopilot(v => { const n = !v; saveSetting('kazuki-autopilot', String(n)); return n; }); }}
            role="switch"
            aria-checked={autopilot}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: autopilot ? 'var(--accent)' : 'var(--pending)', transition: 'background 0.2s' }}
          >
            <span style={{ position: 'absolute', top: 2, left: autopilot ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </section>

        {/* Workspace controls — visible only while click-through workspace is active */}
        {demoActive && (
          <section
            data-testid="settings-demo-section"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Workspace mode
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Sample workspace active. Exit to return to live data.
              </div>
            </div>
            <button
              data-testid="exit-demo-btn"
              type="button"
              onClick={exitDemo}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: 8,
                background: '#EA580C',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Exit workspace
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
