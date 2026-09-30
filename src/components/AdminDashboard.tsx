import React, { useState } from 'react';
import { Song, Genre } from '../types/song';
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Download,
  Upload,
  RotateCcw,
  Eye,
  Check,
  X,
  FileMusic,
  PlayCircle,
  ShieldCheck,
  LogOut,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { isChordLine, isSectionHeader } from '../utils/chordTransposer';

interface AdminDashboardProps {
  songs: Song[];
  adminEmail: string | null;
  onLogout: () => void;
  onChangePassword: (oldPass: string, newPass: string) => { success: boolean; error?: string };
  onAddSong: (song: Omit<Song, 'id'>) => Song;
  onUpdateSong: (id: string, updated: Partial<Song>) => void;
  onDeleteSong: (id: string) => void;
  onResetToDefaults: () => void;
  onExportSongs: () => string;
  onImportSongs: (json: string) => Promise<{ success: boolean; count?: number; error?: string }> | { success: boolean; count?: number; error?: string };
  onPreviewSong: (song: Song) => void;
  isDarkMode: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  songs,
  adminEmail,
  onLogout,
  onChangePassword,
  onAddSong,
  onUpdateSong,
  onDeleteSong,
  onResetToDefaults,
  onExportSongs,
  onImportSongs,
  onPreviewSong,
  isDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  // Change password modal state
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [originalKey, setOriginalKey] = useState('C');
  const [genre, setGenre] = useState<Genre>('Pop');
  const [tempo, setTempo] = useState('');
  const [content, setContent] = useState('');
  const [formTab, setFormTab] = useState<'edit' | 'preview'>('edit');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    const res = onChangePassword(oldPassword, newPassword);
    if (!res.success) {
      setPassError(res.error || 'Gagal mengubah password');
    } else {
      showFeedback('Password admin berhasil diubah!', 'success');
      setIsChangePassOpen(false);
      setOldPassword('');
      setNewPassword('');
    }
  };

  const handleOpenAdd = () => {
    setEditingSongId(null);
    setTitle('');
    setArtist('');
    setOriginalKey('C');
    setGenre('Pop');
    setTempo('90 BPM');
    setContent(`[Intro]
C  G  Am  F

[Bait 1]
C              G
Tuliskan bait lagu di sini
Am             F
Dengan chord tepat di atas lirik

[Reff]
C          G
Bagian reff yang meriah
Am         F
Chord mudah dimainkan`);
    setFormTab('edit');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (song: Song) => {
    setEditingSongId(song.id);
    setTitle(song.title);
    setArtist(song.artist);
    setOriginalKey(song.originalKey);
    setGenre((song.genre as Genre) || 'Pop');
    setTempo(song.tempo || '');
    setContent(song.content);
    setFormTab('edit');
    setIsModalOpen(true);
  };

  const handleSaveSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim() || !content.trim()) {
      showFeedback('Judul lagu, nama artis, dan isi lirik chord wajib diisi.', 'error');
      return;
    }

    if (editingSongId) {
      onUpdateSong(editingSongId, {
        title,
        artist,
        originalKey,
        genre,
        tempo,
        content,
      });
      showFeedback(`Lagu "${title}" berhasil diperbarui!`, 'success');
    } else {
      const created = onAddSong({
        title,
        artist,
        originalKey,
        genre,
        tempo,
        content,
      });
      showFeedback(`Lagu baru "${created.title}" berhasil ditambahkan!`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (song: Song) => {
    if (window.confirm(`Yakin ingin menghapus lagu "${song.title}"?`)) {
      onDeleteSong(song.id);
      showFeedback(`Lagu "${song.title}" telah dihapus.`, 'success');
    }
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan semua daftar ke lagu bawaan? Perubahan custom akan direset.')) {
      onResetToDefaults();
      showFeedback('Daftar lagu telah dikembalikan ke bawaan.', 'success');
    }
  };

  const handleExport = () => {
    const jsonStr = onExportSongs();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chordtela-songs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showFeedback('Data chord berhasil diunduh sebagai file JSON.', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      try {
        const res = await onImportSongs(result);
        if (res.success) {
          showFeedback(`Berhasil mengimpor ${res.count} lagu!`, 'success');
        } else {
          showFeedback(res.error || 'Gagal membaca file JSON.', 'error');
        }
      } catch (err: any) {
        showFeedback(err?.message || 'Gagal membaca file JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = document.getElementById('admin-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start);
    const after = text.substring(end);

    setContent(before + textToInsert + after);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
    }, 0);
  };

  const filteredSongs = songs.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner (Chordtela Admin Style) */}
      <div className={`p-5 sm:p-6 rounded-xl border mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors shadow-sm ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Dashboard Admin ChordJitu
              </h1>
              {adminEmail && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {adminEmail}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Kelola lirik dan susunan kunci gitar lagu dengan mudah
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Lagu Baru</span>
          </button>

          <button
            onClick={() => setIsChangePassOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Ganti password admin"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>Ganti Password</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition shadow-sm"
            title="Keluar dari sesi admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          <button
            onClick={handleExport}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Download cadangan JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}>
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent transition"
            title="Kembalikan lagu bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>
        </div>
      </div>

      {/* Status Feedback */}
      {statusMessage && (
        <div className={`mb-4 p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Songs Table Card */}
      <div className={`rounded-xl border overflow-hidden shadow-sm transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lagu di dashboard admin..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs transition focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                isDarkMode 
                  ? 'bg-slate-950 border border-slate-700 text-white placeholder-slate-500' 
                  : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>
          <span className="text-xs text-slate-500">
            Total: <strong>{songs.length} lagu</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase tracking-wider font-bold border-b ${
              isDarkMode 
                ? 'bg-slate-950 text-slate-400 border-slate-800' 
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="py-3 px-4">Judul Lagu</th>
                <th className="py-3 px-4">Artis</th>
                <th className="py-3 px-4">Nada Dasar</th>
                <th className="py-3 px-4">Genre</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSongs.map((song) => (
                <tr key={song.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                    {song.title}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {song.artist}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-900">
                      Key {song.originalKey}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {song.genre || 'Pop'}
                  </td>
                  <td className="py-3 px-4">
                    {song.isCustom ? (
                      <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-semibold text-[10px]">
                        Ditambahkan Admin
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                        Bawaan
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onPreviewSong(song)}
                        className="p-1 rounded hover:bg-sky-50 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400"
                        title="Mainkan Lagu"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(song)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="Edit Lagu"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(song)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-slate-800 text-red-500"
                        title="Hapus Lagu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Song Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className={`relative w-full max-w-3xl rounded-2xl border p-6 shadow-2xl my-8 transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <FileMusic className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold">
                {editingSongId ? 'Edit Lirik & Chord' : 'Tambah Lagu Baru ke ChordJitu'}
              </h2>
            </div>

            {/* Tab switch */}
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setFormTab('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  formTab === 'edit'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Form Editor
              </button>
              <button
                type="button"
                onClick={() => setFormTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  formTab === 'preview'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Pratinjau (Preview)
              </button>
            </div>

            {formTab === 'edit' ? (
              <form onSubmit={handleSaveSong} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Judul Lagu *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Contoh: Menghapus Jejakmu"
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-sky-500 focus:outline-none ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-700 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Artis / Penyanyi *
                    </label>
                    <input
                      type="text"
                      required
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Contoh: Peterpan / Noah"
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-sky-500 focus:outline-none ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-700 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nada Dasar (Key) *
                    </label>
                    <select
                      value={originalKey}
                      onChange={(e) => setOriginalKey(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-mono font-bold focus:ring-1 focus:ring-sky-500 focus:outline-none ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-700 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Am', 'Dm', 'Em'].map((k) => (
                        <option key={k} value={k}>Key {k}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Genre
                    </label>
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value as Genre)}
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-sky-500 focus:outline-none ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-700 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      {['Pop', 'Rock', 'Akustik', 'Dangdut', 'Indie', 'Mancanegara', 'Religi'].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempo (BPM)
                    </label>
                    <input
                      type="text"
                      value={tempo}
                      onChange={(e) => setTempo(e.target.value)}
                      placeholder="Contoh: 85 BPM"
                      className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-sky-500 focus:outline-none ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-700 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Chord Toolbar & Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Chord & Lirik Lagu *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Format baris kunci di atas lirik seperti Chordtela
                    </span>
                  </div>

                  {/* Helper Buttons */}
                  <div className={`p-1.5 border border-b-0 rounded-t-lg flex flex-wrap items-center gap-1 ${
                    isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-100 border-slate-300'
                  }`}>
                    <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Bagian:</span>
                    {['[Intro]', '[Bait]', '[Reff]', '[Interlude]', '[Outro]'].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => insertTextAtCursor(`\n${sec}\n`)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold border border-slate-200 dark:border-slate-700 hover:bg-sky-50"
                      >
                        {sec}
                      </button>
                    ))}
                    <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                    <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Kunci:</span>
                    {['C', 'D', 'Em', 'F', 'G', 'Am'].map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => insertTextAtCursor(`${ch} `)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-mono font-bold border border-slate-200 dark:border-slate-700 hover:bg-sky-50"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>

                  <textarea
                    id="admin-content-textarea"
                    rows={11}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={`w-full p-3 font-mono text-xs border rounded-b-lg focus:ring-1 focus:ring-sky-500 focus:outline-none leading-relaxed ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-700 text-slate-200' 
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-sm"
                  >
                    {editingSongId ? 'Simpan Perubahan' : 'Simpan Lagu'}
                  </button>
                </div>
              </form>
            ) : (
              /* Live Preview */
              <div className="space-y-3 text-xs">
                <div className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    {artist || 'Artis'} - {title || 'Judul Lagu'}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-600">Key: {originalKey}</span>
                    <span>•</span>
                    <span>{genre}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border font-mono max-h-80 overflow-y-auto leading-relaxed ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  {content.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={idx} className="h-2" />;
                    if (isSectionHeader(trimmed)) {
                      return (
                        <div key={idx} className="my-1 font-bold text-slate-500">
                          {line}
                        </div>
                      );
                    }
                    if (isChordLine(line)) {
                      return (
                        <div key={idx} className="text-sky-600 font-bold whitespace-pre">
                          {line}
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="font-sans text-slate-800 dark:text-white whitespace-pre">
                        {line}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setFormTab('edit')}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold"
                  >
                    Kembali ke Form
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <button
              onClick={() => setIsChangePassOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold">Ganti Password Admin</h3>
            </div>

            {passError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                {passError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Password Lama
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-sky-500 focus:outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Masukkan password lama..."
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-sky-500 focus:outline-none ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Minimal 6 karakter..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePassOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-sm"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
