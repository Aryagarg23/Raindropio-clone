import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Collection } from '../../../types/api';
import { ChevronDown, X } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  path: string; // full path like "Parent / Child / Name"
  color?: string;
}

interface CollectionTreeSelectProps {
  collections: Collection[];
  value?: string;
  onChange: (id: string | undefined) => void;
  placeholder?: string;
}

function buildOptions(collections: Collection[]): Option[] {
  const map = new Map<string, Collection>();
  collections.forEach((c) => map.set(c.id, c));

  const buildPath = (c: Collection) => {
    const parts: string[] = [c.name];
    let parentId = c.parent_id;
    while (parentId) {
      const parent = map.get(parentId);
      if (!parent) break;
      parts.push(parent.name);
      parentId = parent.parent_id;
    }
    return parts.reverse().join(' / ');
  };

  return collections.map((c) => ({ id: c.id, name: c.name, path: buildPath(c), color: c.color }));
}

export default function CollectionTreeSelect({ collections, value, onChange, placeholder }: CollectionTreeSelectProps) {
  const options = useMemo(() => buildOptions(collections), [collections]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const starts: Option[] = [];
    const contains: Option[] = [];
    options.forEach((o) => {
      const hay = (o.path + ' ' + o.name).toLowerCase();
      if (hay.startsWith(q)) starts.push(o);
      else if (hay.includes(q)) contains.push(o);
    });
    return [...starts, ...contains];
  }, [options, query]);

  const onSelect = (id?: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlight((h) => Math.min(h + 1, filtered.length));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlight((h) => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const opt = filtered[highlight - 1];
      if (highlight === 0) onSelect(undefined);
      else if (opt) onSelect(opt.id);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
      e.preventDefault();
    }
  };

  useEffect(() => setHighlight(0), [query, open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-stretch gap-2">
        <input
          className="w-full px-3 py-2 border border-input rounded-md bg-background"
          placeholder={placeholder || 'Type to search collections'}
          value={open ? query : (selected ? selected.path : query)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
        />

        <button
          type="button"
          onClick={() => (open ? setOpen(false) : setOpen(true))}
          className="px-2 py-2 border border-input rounded-md bg-background flex items-center"
          aria-label="Toggle collection dropdown"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="px-2 py-2 border border-input rounded-md bg-background flex items-center"
            title="Clear selection"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-40 mt-1 w-full max-h-64 overflow-auto border border-input rounded-md bg-white shadow-lg">
          <ul role="listbox" className="divide-y">
            <li
              key="none"
              className={`px-3 py-2 cursor-pointer hover:bg-grey-accent-100 ${highlight === 0 ? 'bg-grey-accent-100' : ''}`}
              onMouseEnter={() => setHighlight(0)}
              onClick={() => onSelect(undefined)}
            >
              <span className="text-sm">No collection (Root)</span>
            </li>

            {filtered.map((opt, idx) => (
              <li
                key={opt.id}
                className={`px-3 py-2 cursor-pointer hover:bg-grey-accent-100 flex items-center gap-2 ${highlight === idx + 1 ? 'bg-grey-accent-100' : ''}`}
                onMouseEnter={() => setHighlight(idx + 1)}
                onClick={() => onSelect(opt.id)}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">{opt.name}</span>
                  <span className="text-xs text-grey-accent-600 truncate">{opt.path}</span>
                </div>
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-grey-accent-600">No matching collections</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
