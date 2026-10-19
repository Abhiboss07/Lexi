import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  BookOpen,
  Tag,
  AlertCircle,
} from 'lucide-react';
import type { QuickNote } from '../../types/quickPicks';
import { quickPicksRepository } from '../../db/quickPicksRepository';

interface QuickNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

type TopicFilter = 'all' | 'pinned' | 'vocabulary' | 'grammar' | 'pronunciation' | 'idiom' | 'workplace';

export const QuickNotesModal: React.FC<QuickNotesModalProps> = ({
  isOpen,
  onClose,
  userId = 'local-learner-1',
}) => {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState<TopicFilter>('all');

  // Note editor form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formExample, setFormExample] = useState('');
  const [formNewWords, setFormNewWords] = useState('');
  const [formTopic, setFormTopic] = useState<QuickNote['topic']>('general');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion confirmation dialog
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadNotes = async () => {
    try {
      const list = await quickPicksRepository.getNotes(userId);
      setNotes(list);
    } catch (err) {
      console.error('Failed to load quick notes:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, userId]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormTitle('');
    setFormBody('');
    setFormExample('');
    setFormNewWords('');
    setFormTopic('general');
    setFormIsPinned(false);
    setFormError(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleStartEdit = (note: QuickNote) => {
    setEditingId(note.id);
    setFormTitle(note.title);
    setFormBody(note.body);
    setFormExample(note.exampleSentence || '');
    setFormNewWords(note.newWords || '');
    setFormTopic(note.topic);
    setFormIsPinned(note.isPinned);
    setFormError(null);
    setIsEditing(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Please enter a note title.');
      return;
    }
    if (!formBody.trim()) {
      setFormError('Please enter some note content.');
      return;
    }

    const now = new Date().toISOString();
    const noteToSave: QuickNote = {
      id: editingId || `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      title: formTitle.trim(),
      body: formBody.trim(),
      exampleSentence: formExample.trim() || undefined,
      newWords: formNewWords.trim() || undefined,
      topic: formTopic,
      isPinned: formIsPinned,
      createdAt: editingId ? (notes.find((n) => n.id === editingId)?.createdAt || now) : now,
      updatedAt: now,
    };

    try {
      await quickPicksRepository.saveNote(noteToSave);
      resetForm();
      await loadNotes();
    } catch (err) {
      console.error('Failed to save note:', err);
      setFormError('Could not save note to database.');
    }
  };

  const handleTogglePin = async (note: QuickNote) => {
    const updated: QuickNote = {
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString(),
    };
    await quickPicksRepository.saveNote(updated);
    await loadNotes();
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await quickPicksRepository.deleteNote(deletingId);
      setDeletingId(null);
      await loadNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Filtered notes
  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes.filter((n) => {
      // Topic filter
      if (activeTopic === 'pinned' && !n.isPinned) return false;
      if (activeTopic !== 'all' && activeTopic !== 'pinned' && n.topic !== activeTopic) {
        return false;
      }
      // Search query
      if (q) {
        const inTitle = n.title.toLowerCase().includes(q);
        const inBody = n.body.toLowerCase().includes(q);
        const inWords = n.newWords?.toLowerCase().includes(q);
        const inExample = n.exampleSentence?.toLowerCase().includes(q);
        if (!inTitle && !inBody && !inWords && !inExample) return false;
      }
      return true;
    });
  }, [notes, searchQuery, activeTopic]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15164B]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-notes-title"
    >
      <div className="bg-[#FAF9FE] w-full max-w-lg rounded-[28px] border border-[#E2E6FD] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EFF2FE] border border-[#D5D8EE] flex items-center justify-center text-[#545CA6]">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="quick-notes-title" className="text-[17px] font-black text-[#15164B] tracking-tight">
                  Quick Notes
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#545CA6] bg-[#ECEFFD] px-2 py-0.5 rounded-full">
                  Personal Notebook
                </span>
              </div>
              <p className="text-[11.5px] font-medium text-[#7D82A8]">
                Capture custom vocabulary, grammar rules, and self-study tips
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F2FE] hover:bg-[#E2E6FD] text-[#545CA6] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close notes modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Top Bar: Search & New Note CTA */}
          {!isEditing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8E93B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes, terms, examples..."
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#DCE0F7] text-[12.5px] text-[#15164B] placeholder-[#8E93B8] focus:outline-hidden focus:ring-2 focus:ring-[#545CA6]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[11px] font-bold text-[#8E93B8] hover:text-[#15164B] absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  onClick={handleStartCreate}
                  className="px-3.5 py-2 rounded-xl bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New Note</span>
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold">
                {(
                  [
                    { id: 'all', label: `All (${notes.length})` },
                    { id: 'pinned', label: `Pinned (${notes.filter((n) => n.isPinned).length})` },
                    { id: 'grammar', label: 'Grammar' },
                    { id: 'vocabulary', label: 'Vocabulary' },
                    { id: 'pronunciation', label: 'Pronunciation' },
                    { id: 'workplace', label: 'Interview & Work' },
                    { id: 'idiom', label: 'Idioms' },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setActiveTopic(pill.id)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                      activeTopic === pill.id
                        ? 'bg-[#15164B] text-white shadow-xs'
                        : 'bg-white border border-[#E2E6FD] text-[#5B618E] hover:bg-[#EFF2FE]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note Form View */}
          {isEditing ? (
            <form onSubmit={handleSaveNote} className="space-y-3.5 bg-white p-4 rounded-2xl border border-[#ECEEFE] shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-[#ECEEFE]">
                <h3 className="text-[14px] font-black text-[#15164B]">
                  {editingId ? 'Edit Learning Note' : 'Create New Note'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11.5px] font-bold text-[#8E93B8] hover:text-[#15164B]"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-[11.5px] font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B618E] block mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Say 'I agree', not 'I am agree'"
                  className="w-full px-3 py-2 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[13px] text-[#15164B] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#545CA6]"
                  autoFocus
                />
              </div>

              {/* Topic & Pin Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B618E] block mb-1">
                    Category Topic
                  </label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value as QuickNote['topic'])}
                    className="w-full px-3 py-2 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[12px] text-[#15164B] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#545CA6]"
                  >
                    <option value="general">General English</option>
                    <option value="grammar">Grammar Rule</option>
                    <option value="vocabulary">Vocabulary Term</option>
                    <option value="idiom">Idiom / Slang</option>
                    <option value="pronunciation">Pronunciation</option>
                    <option value="workplace">Workplace English</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 px-3 py-2 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] cursor-pointer text-[12px] font-bold text-[#15164B]">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="w-4 h-4 text-[#15164B] rounded accent-[#15164B]"
                    />
                    <span>Pin to top</span>
                  </label>
                </div>
              </div>

              {/* Body Content */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B618E] block mb-1">
                  Note Content *
                </label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  rows={4}
                  placeholder="Write your explanation, grammatical breakdown, or usage notes here..."
                  className="w-full px-3 py-2 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[12.5px] text-[#15164B] font-medium leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-[#545CA6]"
                />
              </div>

              {/* Example Sentence Field */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B618E] block mb-1">
                  Example Sentence (Optional)
                </label>
                <input
                  type="text"
                  value={formExample}
                  onChange={(e) => setFormExample(e.target.value)}
                  placeholder="e.g. I agree with your team proposal."
                  className="w-full px-3 py-2 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[12px] text-[#15164B] focus:outline-hidden focus:ring-2 focus:ring-[#545CA6]"
                />
              </div>

              {/* Target Words Field */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B618E] block mb-1">
                  Vocabulary Words / Tags (Optional)
                </label>
                <input
                  type="text"
                  value={formNewWords}
                  onChange={(e) => setFormNewWords(e.target.value)}
                  placeholder="Comma-separated: agree, propose, schedule"
                  className="w-full px-3 py-2 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[12px] text-[#15164B] focus:outline-hidden focus:ring-2 focus:ring-[#545CA6]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl border border-[#DCE0F7] text-[12px] font-bold text-[#5B618E] hover:bg-[#F0F2FD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-bold shadow-xs cursor-pointer"
                >
                  {editingId ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </form>
          ) : (
            /* Notes List */
            <div className="space-y-3">
              {filteredNotes.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-[#D5D8EE] p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#F0F2FE] text-[#545CA6] flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h4 className="text-[14px] font-black text-[#15164B]">
                    {searchQuery ? 'No matching notes found' : 'No notes yet'}
                  </h4>
                  <p className="text-[11.5px] text-[#7D82A8] max-w-xs mx-auto">
                    {searchQuery
                      ? 'Try adjusting your search terms or reset the category filter.'
                      : 'Capture English phrases, grammar takeaways, and custom vocabulary you discover in daily life.'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={handleStartCreate}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#15164B] text-white text-[11.5px] font-bold mt-2 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Create Your First Note</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs space-y-2.5 transition-all hover:border-[#CCD1F5]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#545CA6] bg-[#ECEFFD] px-2 py-0.5 rounded-full">
                            {note.topic}
                          </span>
                          {note.isPinned && (
                            <span className="text-[9.5px] font-bold text-[#EA580C] bg-[#FFF7ED] border border-[#FFEDD5] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <Pin className="w-2.5 h-2.5 fill-[#EA580C]" />
                              <span>Pinned</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-[14px] font-black text-[#15164B] leading-snug pt-0.5">
                          {note.title}
                        </h3>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(note)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            note.isPinned
                              ? 'text-[#EA580C] bg-[#FFF7ED]'
                              : 'text-[#8E93B8] hover:text-[#15164B] hover:bg-[#F0F2FE]'
                          }`}
                          aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                        >
                          <Pin className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(note)}
                          className="p-1.5 rounded-lg text-[#8E93B8] hover:text-[#15164B] hover:bg-[#F0F2FE] transition-colors cursor-pointer"
                          aria-label="Edit note"
                        >
                          <Edit3 className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(note.id)}
                          className="p-1.5 rounded-lg text-[#8E93B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                      </div>
                    </div>

                    {/* Note Body */}
                    <p className="text-[12px] text-[#424675] font-medium leading-relaxed whitespace-pre-line">
                      {note.body}
                    </p>

                    {/* Example Sentence callout */}
                    {note.exampleSentence && (
                      <div className="p-2.5 rounded-xl bg-[#F6F7FE] border border-[#E4E7F7] text-[11.5px] text-[#232655]">
                        <span className="font-bold text-[#545CA6] block mb-0.5">Example:</span>
                        <span className="italic font-medium">"{note.exampleSentence}"</span>
                      </div>
                    )}

                    {/* Words / Tags */}
                    {note.newWords && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10.5px]">
                        <Tag className="w-3 h-3 text-[#8E93B8]" />
                        {note.newWords.split(',').map((w, idx) => (
                          <span
                            key={idx}
                            className="bg-[#EFF2FE] text-[#232655] font-semibold px-2 py-0.5 rounded-md"
                          >
                            {w.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="p-4 bg-[#FFF1F2] border-t border-[#FECDD3] flex items-center justify-between gap-3 shrink-0">
            <div className="text-[12px] text-[#9F1239] font-medium">
              Are you sure you want to delete this note? This action cannot be undone.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#FECDD3] text-[11.5px] font-bold text-[#9F1239]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-xl bg-[#E11D48] text-white text-[11.5px] font-bold shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-[#F6F7FE] border-t border-[#ECEEFE] flex items-center justify-between text-[11px] font-semibold text-[#7D82A8] shrink-0">
          <span>Notes are saved securely on your device</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white border border-[#D5D8EE] text-[#15164B] font-bold hover:bg-[#ECEFFD] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
