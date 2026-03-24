'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addPlayer, updatePlayer, deletePlayer, uploadAvatar } from './actions';
import { POSITION_LABELS, type PlayerPosition } from '@/lib/types';
import type { Database } from '@/lib/database.types';

type Player = Database['public']['Tables']['players']['Row'];

const POSITIONS: PlayerPosition[] = ['NONE', 'OH', 'MB', 'S', 'OPP', 'L', 'DS'];
const AVATAR_OUTPUT_SIZE = 256;
const CROP_VIEW_SIZE = 240;

// ─── Avatar crop modal ────────────────────────────────────────────────
// User picks a photo, then drags to position the face inside a circle.

function AvatarCropModal({
  file,
  onCrop,
  onCancel,
}: {
  file: File;
  onCrop: (cropped: File) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Fit image so shortest side fills the circle
      const s = Math.max(CROP_VIEW_SIZE / img.width, CROP_VIEW_SIZE / img.height);
      setScale(s);
      setOffset({
        x: (CROP_VIEW_SIZE - img.width * s) / 2,
        y: (CROP_VIEW_SIZE - img.height * s) / 2,
      });
      setImgLoaded(true);
    };
    img.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(img.src);
  }, [file]);

  // Draw preview
  useEffect(() => {
    if (!imgLoaded || !imgRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CROP_VIEW_SIZE, CROP_VIEW_SIZE);

    // Draw image
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      imgRef.current,
      offset.x,
      offset.y,
      imgRef.current.width * scale,
      imgRef.current.height * scale,
    );
    ctx.restore();

    // Draw semi-transparent overlay outside circle
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(0, 0, CROP_VIEW_SIZE, CROP_VIEW_SIZE);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.beginPath();
    ctx.arc(CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [imgLoaded, offset, scale]);

  // Drag handlers (mouse + touch)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    setOffset({
      x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  function handleCrop() {
    if (!imgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_OUTPUT_SIZE;
    canvas.height = AVATAR_OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputScale = AVATAR_OUTPUT_SIZE / CROP_VIEW_SIZE;

    ctx.beginPath();
    ctx.arc(AVATAR_OUTPUT_SIZE / 2, AVATAR_OUTPUT_SIZE / 2, AVATAR_OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      imgRef.current,
      offset.x * outputScale,
      offset.y * outputScale,
      imgRef.current.width * scale * outputScale,
      imgRef.current.height * scale * outputScale,
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      onCrop(new File([blob], 'avatar.png', { type: 'image/png' }));
    }, 'image/png');
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
        <h3 className="text-lg font-semibold text-center">Position Photo</h3>
        <p className="text-sm text-gray-500 text-center">Drag to move the image</p>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CROP_VIEW_SIZE}
            height={CROP_VIEW_SIZE}
            className="cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </div>

        <div className="flex items-center gap-3 px-2">
          <span className="text-xs text-gray-400">Zoom</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={scale / (imgRef.current ? Math.max(CROP_VIEW_SIZE / imgRef.current.width, CROP_VIEW_SIZE / imgRef.current.height) : 1)}
            onChange={(e) => {
              if (!imgRef.current) return;
              const base = Math.max(CROP_VIEW_SIZE / imgRef.current.width, CROP_VIEW_SIZE / imgRef.current.height);
              const newScale = Number(e.target.value) * base;
              // Zoom toward center
              const cx = CROP_VIEW_SIZE / 2;
              const cy = CROP_VIEW_SIZE / 2;
              const ratio = newScale / scale;
              setOffset({
                x: cx - (cx - offset.x) * ratio,
                y: cy - (cy - offset.y) * ratio,
              });
              setScale(newScale);
            }}
            className="flex-1 h-2 accent-blue-600"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border border-gray-300 font-medium min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            disabled={!imgLoaded}
            className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium min-h-[44px] disabled:opacity-50"
          >
            Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Player avatar display ────────────────────────────────────────────

function PlayerAvatar({ player, size = 'md' }: { player: Pick<Player, 'avatar_url' | 'first_name' | 'last_name'>; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-lg';

  if (player.avatar_url) {
    return (
      <img
        src={player.avatar_url}
        alt={`${player.first_name} ${player.last_name}`}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }

  const initials = `${player.first_name[0] || ''}${player.last_name[0] || ''}`.toUpperCase();
  return (
    <div className={`${dim} rounded-full bg-gray-200 text-gray-500 font-semibold flex items-center justify-center`}>
      {initials}
    </div>
  );
}

// ─── Roster page ──────────────────────────────────────────────────────

interface RosterClientProps {
  initialPlayers: Player[];
  teamId?: string;
  teamName?: string;
}

export function RosterClient({ initialPlayers, teamId, teamName }: RosterClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAction(formData: FormData, action: (fd: FormData) => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
        setEditingId(null);
        setShowAddForm(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
    });
  }

  function handleDelete(id: string) {
    setError(null);
    const fd = new FormData();
    fd.set('id', id);
    startTransition(async () => {
      try {
        await deletePlayer(fd);
        setDeletingId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
    });
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={teamId ? `/teams/${teamId}` : '/'} className="hover:text-blue-200 transition-colors">
            &larr;
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Roster</h1>
            {teamName && <p className="text-blue-200 text-xs">{teamName}</p>}
          </div>
        </div>
        <span className="text-blue-200 text-sm">
          {initialPlayers.length} player{initialPlayers.length !== 1 ? 's' : ''}
        </span>
      </header>

      <main className="flex-1 p-5 max-w-5xl mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {initialPlayers.length === 0 && !showAddForm && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No players yet</p>
            <p>Add your first player to get started.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
          {initialPlayers.map((player) =>
            editingId === player.id ? (
              <div key={player.id} className="md:col-span-2">
              <PlayerForm
                player={player}
                isPending={isPending}
                onSubmit={(fd) => handleAction(fd, updatePlayer)}
                onCancel={() => setEditingId(null)}
              />
              </div>
            ) : deletingId === player.id ? (
              <div
                key={player.id}
                className="md:col-span-2 bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center justify-between"
              >
                <span>
                  Delete <strong>#{player.jersey_number} {player.first_name} {player.last_name}</strong>?
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium"
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium"
                    disabled={isPending}
                  >
                    {isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={player.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg font-bold text-blue-700 w-8 text-center shrink-0">
                    {player.jersey_number}
                  </span>
                  <PlayerAvatar player={player} size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight truncate">
                      {player.first_name} {player.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {POSITION_LABELS[player.position as PlayerPosition]}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => { setEditingId(player.id); setShowAddForm(false); setDeletingId(null); }}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium min-h-[44px] active:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setDeletingId(player.id); setEditingId(null); setShowAddForm(false); }}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium min-h-[44px] active:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {showAddForm ? (
          <PlayerForm
            isPending={isPending}
            onSubmit={(fd) => handleAction(fd, addPlayer)}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); setDeletingId(null); }}
            className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 transition-colors active:bg-blue-50 min-h-[44px]"
          >
            + Add Player
          </button>
        )}
      </main>
    </div>
  );
}

// ─── Player form with avatar crop ─────────────────────────────────────

function PlayerForm({
  player,
  isPending,
  onSubmit,
  onCancel,
}: {
  player?: Player;
  isPending: boolean;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(player?.avatar_url ?? null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(player?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  async function handleCropped(croppedFile: File) {
    setCropFile(null);
    setUploading(true);

    const previewUrl = URL.createObjectURL(croppedFile);
    setAvatarPreview(previewUrl);

    try {
      const playerId = player?.id ?? crypto.randomUUID();
      const url = await uploadAvatar(croppedFile, playerId);
      setAvatarUrl(url);
    } catch {
      setAvatarPreview(player?.avatar_url ?? null);
      setAvatarUrl(player?.avatar_url ?? null);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(fd: FormData) {
    if (avatarUrl) {
      fd.set('avatar_url', avatarUrl);
    }
    onSubmit(fd);
  }

  return (
    <>
      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          onCrop={handleCropped}
          onCancel={() => setCropFile(null)}
        />
      )}

      <form
        action={handleSubmit}
        className="bg-white border-2 border-blue-300 rounded-xl p-4 space-y-4"
      >
        {player && <input type="hidden" name="id" value={player.id} />}

        {/* Photo upload — prominent placement */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors flex flex-col items-center justify-center shrink-0"
            disabled={uploading}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <>
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[9px] text-gray-400 mt-0.5">Add Photo</span>
              </>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          {avatarPreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 hover:underline"
              disabled={uploading}
            >
              Change photo
            </button>
          )}
          {!avatarPreview && (
            <p className="text-sm text-gray-400">Tap circle to upload a player photo</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Name + Jersey */}
        <div className="grid grid-cols-[80px_1fr_1fr] gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">#</label>
            <input
              name="jersey_number"
              type="number"
              min={0}
              max={99}
              defaultValue={player?.jersey_number ?? ''}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-bold min-h-[44px]"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
            <input
              name="first_name"
              type="text"
              defaultValue={player?.first_name ?? ''}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px]"
              placeholder="First"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
            <input
              name="last_name"
              type="text"
              defaultValue={player?.last_name ?? ''}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px]"
              placeholder="Last"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Position</label>
          <div className="grid grid-cols-7 gap-2">
            {POSITIONS.map((pos) => (
              <label
                key={pos}
                className="flex flex-col items-center cursor-pointer"
              >
                <input
                  type="radio"
                  name="position"
                  value={pos}
                  defaultChecked={player ? player.position === pos : pos === 'NONE'}
                  required
                  className="peer sr-only"
                />
                <span className="w-full text-center py-2 rounded-lg border-2 border-gray-200 text-sm font-semibold min-h-[44px] flex items-center justify-center peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 active:bg-gray-100 transition-colors">
                  {pos}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                  {POSITION_LABELS[pos].split(' ')[0]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium min-h-[44px]"
            disabled={isPending || uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium min-h-[44px] disabled:opacity-50"
            disabled={isPending || uploading}
          >
            {isPending ? 'Saving...' : player ? 'Save Changes' : 'Add Player'}
          </button>
        </div>
      </form>
    </>
  );
}
