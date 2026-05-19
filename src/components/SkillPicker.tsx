import { useState, useRef, useEffect, useCallback } from 'react';

interface SkillPickerProps {
  skills: { id: string; name: string; version: string; description: string }[];
  selectedSkillName: string;
  selectedSkillVersion: string;
  onChange: (name: string, version: string) => void;
  disabled?: boolean;
}

export default function SkillPicker({
  skills,
  selectedSkillName,
  selectedSkillVersion,
  onChange,
  disabled,
}: SkillPickerProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = selectedSkillName
    ? `${selectedSkillName}@${selectedSkillVersion}`
    : '';

  const filtered = skills.filter((s) => {
    const q = filter.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  const handleSelect = useCallback(
    (skill: { name: string; version: string }) => {
      onChange(skill.name, skill.version);
      setOpen(false);
      setFilter('');
    },
    [onChange],
  );

  // Click-outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setFilter('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setFilter('');
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="skill-picker"
      style={{ position: 'relative' }}
      onKeyDown={handleKeyDown}
    >
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          data-testid="skill-picker-input"
          type="text"
          value={open ? filter : displayValue}
          placeholder="Search skills…"
          disabled={disabled}
          onChange={(e) => {
            setFilter(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setFilter('');
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            paddingRight: 28,
            border: '1px solid rgba(0,0,0,0.10)',
            borderRadius: 10,
            fontSize: 13,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#1c1c1e',
            background: disabled ? 'rgba(0,0,0,0.03)' : '#fff',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <span
          data-testid="skill-picker-caret"
          onClick={() => {
            if (!disabled) {
              setOpen((prev) => !prev);
              setFilter('');
              inputRef.current?.focus();
            }
          }}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            color: 'rgba(60,60,67,0.72)',
            cursor: disabled ? 'default' : 'pointer',
            userSelect: 'none',
          }}
        >
          ▾
        </span>
      </div>

      {open && (
        <div
          data-testid="skill-picker-dropdown"
          style={{
            position: 'absolute',
            zIndex: 50,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'rgba(255,255,255,0.98)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <div
              data-testid="skill-picker-empty"
              style={{
                padding: '12px',
                fontSize: 12,
                color: 'rgba(60,60,67,0.72)',
                textAlign: 'center',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              No skills found
            </div>
          ) : (
            filtered.map((skill) => {
              const isSelected =
                skill.name === selectedSkillName &&
                skill.version === selectedSkillVersion;
              return (
                <div
                  key={skill.id}
                  data-testid={`skill-option-${skill.name}`}
                  onClick={() => handleSelect(skill)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLDivElement).style.background =
                        'rgba(0,122,255,0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      isSelected ? 'rgba(0,122,255,0.10)' : 'transparent';
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(0,122,255,0.10)'
                      : 'transparent',
                    color: isSelected ? '#007AFF' : '#1c1c1e',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {skill.name}@{skill.version}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: isSelected
                        ? 'rgba(0,122,255,0.7)'
                        : 'rgba(60,60,67,0.72)',
                      marginTop: 2,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {skill.description}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
