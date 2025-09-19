import { useState } from 'react';
import { stickyPalette } from '../utils/colors';

export interface ModalState {
  // Directory modal
  showDirectoryModal: boolean;
  selectedDirectoryCollection: any;

  // Collection/Bookmark creation modals
  showCreateCollection: boolean;
  showAddBookmark: boolean;

  // Bookmark detail modal
  selectedBookmark: any;
  bookmarkViewMode: 'proxy' | 'reader' | 'details';

  // Highlight/Annotation system
  showHighlightTooltip: boolean;
  tooltipPosition: { x: number; y: number };
  pendingSelection: { 
    text: string; 
    startOffset: number; 
    endOffset: number;
    xpathStart?: string;
    xpathEnd?: string;
    textBefore?: string;
    textAfter?: string;
  } | null;
  newAnnotation: string;
  highlightColor: string;
  bookmarkAnnotations: any[];
  bookmarkHighlights: any[];

  // Content extraction
  extractedContent: any;
  isLoadingContent: boolean;
  proxyContent: any;
  isLoadingProxy: boolean;

  // Tag management
  tagInput: string;
  showTagSuggestions: boolean;
  commentInputs: Record<string, string>;
}

export interface ModalActions {
  // Directory modal
  setShowDirectoryModal: (show: boolean) => void;
  setSelectedDirectoryCollection: (collection: any) => void;

  // Collection/Bookmark creation modals
  setShowCreateCollection: (show: boolean) => void;
  setShowAddBookmark: (show: boolean) => void;

  // Bookmark detail modal
  setSelectedBookmark: (bookmark: any) => void;
  setBookmarkViewMode: (mode: 'proxy' | 'reader' | 'details') => void;

  // Highlight/Annotation system
  setShowHighlightTooltip: (show: boolean) => void;
  setTooltipPosition: (position: { x: number; y: number }) => void;
  setPendingSelection: (selection: { 
    text: string; 
    startOffset: number; 
    endOffset: number;
    xpathStart?: string;
    xpathEnd?: string;
    textBefore?: string;
    textAfter?: string;
  } | null) => void;
  setNewAnnotation: (annotation: string) => void;
  setHighlightColor: (color: string) => void;
  setBookmarkAnnotations: (annotations: any[]) => void;
  setBookmarkHighlights: (highlights: any[]) => void;

  // Content extraction
  setExtractedContent: (content: any) => void;
  setIsLoadingContent: (loading: boolean) => void;
  setProxyContent: (content: any) => void;
  setIsLoadingProxy: (loading: boolean) => void;

  // Tag management
  setTagInput: (input: string) => void;
  setShowTagSuggestions: (show: boolean) => void;
  setCommentInputs: (inputs: Record<string, string>) => void;

  // Utility functions
  resetBookmarkModal: () => void;
  resetHighlightState: () => void;
}

export const useModalState = (): ModalState & ModalActions => {
  // Directory modal
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [selectedDirectoryCollection, setSelectedDirectoryCollection] = useState<any>(null);

  // Collection/Bookmark creation modals
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);

  // Bookmark detail modal
  const [selectedBookmark, setSelectedBookmark] = useState<any>(null);
  const [bookmarkViewMode, setBookmarkViewMode] = useState<'proxy' | 'reader' | 'details'>('proxy');

  // Highlight/Annotation system
  const [showHighlightTooltip, setShowHighlightTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [pendingSelection, setPendingSelection] = useState<{ 
    text: string; 
    startOffset: number; 
    endOffset: number;
    xpathStart?: string;
    xpathEnd?: string;
    textBefore?: string;
    textAfter?: string;
  } | null>(null);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [highlightColor, setHighlightColor] = useState(stickyPalette[0]);
  const [bookmarkAnnotations, setBookmarkAnnotations] = useState<any[]>([]);
  const [bookmarkHighlights, setBookmarkHighlights] = useState<any[]>([]);

  // Content extraction
  const [extractedContent, setExtractedContent] = useState<any>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [proxyContent, setProxyContent] = useState<any>(null);
  const [isLoadingProxy, setIsLoadingProxy] = useState(false);

  // Tag management
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Utility functions
  const resetBookmarkModal = () => {
    setSelectedBookmark(null);
    setBookmarkViewMode('proxy');
    resetHighlightState();
    setExtractedContent(null);
    setIsLoadingContent(false);
    setProxyContent(null);
    setIsLoadingProxy(false);
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const resetHighlightState = () => {
    setShowHighlightTooltip(false);
    setTooltipPosition({ x: 0, y: 0 });
    setPendingSelection(null);
    setNewAnnotation('');
  };

  return {
    // State
    showDirectoryModal,
    selectedDirectoryCollection,
    showCreateCollection,
    showAddBookmark,
    selectedBookmark,
    bookmarkViewMode,
    showHighlightTooltip,
    tooltipPosition,
    pendingSelection,
    newAnnotation,
    highlightColor,
    bookmarkAnnotations,
    bookmarkHighlights,
    extractedContent,
    isLoadingContent,
    proxyContent,
    isLoadingProxy,
    tagInput,
    showTagSuggestions,
    commentInputs,

    // Actions
    setShowDirectoryModal,
    setSelectedDirectoryCollection,
    setShowCreateCollection,
    setShowAddBookmark,
    setSelectedBookmark,
    setBookmarkViewMode,
    setShowHighlightTooltip,
    setTooltipPosition,
    setPendingSelection,
    setNewAnnotation,
    setHighlightColor,
    setBookmarkAnnotations,
    setBookmarkHighlights,
    setExtractedContent,
    setIsLoadingContent,
    setProxyContent,
    setIsLoadingProxy,
    setTagInput,
    setShowTagSuggestions,
    setCommentInputs,

    // Utilities
    resetBookmarkModal,
    resetHighlightState,
  };
};