import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Collection } from '../../../types/api';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { buildCollectionTree, flattenCollections } from '../../../utils/collectionTreeUtils';

interface ExtendedCollection extends Collection {
  children?: ExtendedCollection[];
  bookmarkCount?: number;
}

interface CollectionTreeSelectProps {
  collections: Collection[] | ExtendedCollection[]; // can be nested or flat
  value?: string;
  onChange: (id: string | undefined) => void;
  placeholder?: string;
  showChildren?: boolean;
}

function flattenForSearch(nodes: ExtendedCollection[]): { id: string; name: string; path: string; color?: string }[] {
  const list: { id: string; name: string; path: string; color?: string }[] = [];

  const walk = (node: ExtendedCollection, parents: string[]) => {
    const path = [...parents, node.name].join(' / ');
    list.push({ id: node.id, name: node.name, path, color: node.color });
    if (node.children && node.children.length) {
      node.children.forEach((c) => walk(c, [...parents, node.name]));
    }
  };

  nodes.forEach((n) => walk(n, []));
  return list;
}

export default function CollectionTreeSelect({ collections, value, onChange, placeholder }: CollectionTreeSelectProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Normalize into nested tree
  const nested: ExtendedCollection[] = useMemo(() => {
    // If items already have children, assume nested
    if ((collections as ExtendedCollection[])[0] && (collections as ExtendedCollection[])[0].children) {
      return collections as ExtendedCollection[];
    }
    // Build tree from flat list
    return buildCollectionTree(collections as Collection[]) as ExtendedCollection[];
  }, [collections]);

  const flatForSearch = useMemo(() => flattenForSearch(nested), [nested]);

  // Compute the set of all child ids so we can render only true roots
  const childIds = useMemo(() => {
    const set = new Set<string>();
    const walk = (node: ExtendedCollection) => {
      if (node.children && node.children.length) {
        node.children.forEach((c) => {
          set.add(c.id);
          walk(c);
        });
      }
    };
    nested.forEach((n) => walk(n));
    return set;
  }, [nested]);

  // Only render collections that are not children of another node
  const roots = useMemo(() => {
    const base = nested.filter((n) => !childIds.has(n.id));
    // If showChildren is explicitly false, don't render children inline (treat them as hidden)
    if (typeof (arguments[0] as any) === 'undefined') {
      // noop to satisfy ts-ignore scenarios
    }
    return base;
  }, [nested, childIds]);

  const fuse = useMemo(() => new Fuse(flatForSearch, { keys: ['name', 'path'], threshold: 0.35 }), [flatForSearch]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const selectedPath = useMemo(() => {
    const node = flatForSearch.find((n) => n.id === value);
    return node ? node.path : '';
  }, [value, flatForSearch]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const res = fuse.search(query.trim());
    return res.map(r => r.item);
  }, [query, fuse]);

  const toggle = (id: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const onSelect = (id?: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const renderNode = (node: ExtendedCollection, level = 0) => {
    const isExpanded = expanded.has(node.id);
    return (
      <div key={node.id}>
        <div className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-grey-accent-100`} style={{ paddingLeft: `${level * 16 + 8}px` }}>
          {node.children && node.children.length > 0 ? (
            <button onClick={(e) => { e.stopPropagation(); toggle(node.id); }} className="p-0.5">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }} />
          <div className="flex-1" onClick={() => onSelect(node.id)}>
            <div className="text-sm font-medium truncate">{node.name}</div>
            <div className="text-xs text-grey-accent-600 truncate">{/* breadcrumb path hidden in tree view */}</div>
          </div>
        </div>
        {isExpanded && node.children && node.children.map((c) => renderNode(c, level + 1))}
      </div>
    );
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-stretch gap-2">
        <input
          className="w-full px-3 py-2 border border-input rounded-md bg-background"
          placeholder={placeholder || 'Type to search collections'}
          value={open ? query : (selectedPath || query)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />

        <button type="button" onClick={() => setOpen((o) => !o)} className="px-2 py-2 border border-input rounded-md bg-background flex items-center">
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {value && (
          <button type="button" onClick={() => onSelect(undefined)} className="px-2 py-2 border border-input rounded-md bg-background flex items-center" title="Clear selection">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-40 mt-1 w-full max-h-80 overflow-auto border border-input rounded-md bg-white shadow-lg">
          {query.trim() ? (
            <ul className="divide-y">
              <li key="none" className="px-3 py-2 cursor-pointer hover:bg-grey-accent-100" onClick={() => onSelect(undefined)}>
                <span className="text-sm">No collection (Root)</span>
              </li>
              {searchResults.map((r) => (
                <li key={r.id} className="px-3 py-2 cursor-pointer hover:bg-grey-accent-100 flex items-center gap-2" onClick={() => onSelect(r.id)}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">{r.name}</span>
                    <span className="text-xs text-grey-accent-600 truncate">{r.path}</span>
                  </div>
                </li>
              ))}
              {searchResults.length === 0 && <li className="px-3 py-2 text-sm text-grey-accent-600">No matching collections</li>}
            </ul>
          ) : (
            <div>
              {roots.map((n) => renderNode(n, 0))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
