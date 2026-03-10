"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useUiLanguage } from "@/shared/i18n/ui-language";

type Player = {
  name: string;
  strikes: number;
  tabooCode: string;
};

type TabooEntry = {
  code: string;
  word: string;
  level: "EASY" | "HARD";
};

type Banner = {
  text: string;
  ts: number;
};

type SpeechMeta = {
  source: "AUTO" | "MANUAL";
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type BrowserWindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

const TABOO_EASY = [
  { code: "TAB-E-001", word: "LIKE" },
  { code: "TAB-E-002", word: "LITERALLY" },
  { code: "TAB-E-003", word: "ACTUALLY" },
  { code: "TAB-E-004", word: "BASICALLY" },
  { code: "TAB-E-005", word: "HONESTLY" },
  { code: "TAB-E-006", word: "SERIOUSLY" },
  { code: "TAB-E-007", word: "OKAY" },
  { code: "TAB-E-008", word: "YEAH" },
  { code: "TAB-E-009", word: "RIGHT" },
  { code: "TAB-E-010", word: "COOL" },
  { code: "TAB-E-011", word: "SURE" },
  { code: "TAB-E-012", word: "WHATEVER" },
  { code: "TAB-E-013", word: "DUDE" },
  { code: "TAB-E-014", word: "BRO" },
  { code: "TAB-E-015", word: "GUYS" },
  { code: "TAB-E-016", word: "SORRY" },
  { code: "TAB-E-017", word: "WAIT" },
  { code: "TAB-E-018", word: "I MEAN" },
  { code: "TAB-E-019", word: "KIND OF" },
  { code: "TAB-E-020", word: "NO WAY" },
] as const;

const TABOO_HARD = [
  { code: "TAB-H-001", word: "BUT" },
  { code: "TAB-H-002", word: "BECAUSE" },
  { code: "TAB-H-003", word: "SO" },
  { code: "TAB-H-004", word: "NOW" },
  { code: "TAB-H-005", word: "THEN" },
  { code: "TAB-H-006", word: "ALWAYS" },
  { code: "TAB-H-007", word: "NEVER" },
  { code: "TAB-H-008", word: "MAYBE" },
  { code: "TAB-H-009", word: "PROBABLY" },
  { code: "TAB-H-010", word: "JUST" },
  { code: "TAB-H-011", word: "REALLY" },
  { code: "TAB-H-012", word: "VERY" },
  { code: "TAB-H-013", word: "THINK" },
  { code: "TAB-H-014", word: "KNOW" },
  { code: "TAB-H-015", word: "NEED" },
  { code: "TAB-H-016", word: "WANT" },
  { code: "TAB-H-017", word: "GOOD" },
  { code: "TAB-H-018", word: "BAD" },
  { code: "TAB-H-019", word: "MORE" },
  { code: "TAB-H-020", word: "LESS" },
] as const;

const TABOO_DB: Record<string, TabooEntry> = Object.fromEntries(
  [
    ...TABOO_EASY.map((item) => [item.code, { ...item, level: "EASY" as const }]),
    ...TABOO_HARD.map((item) => [item.code, { ...item, level: "HARD" as const }]),
  ]
);

const LS_KEY = "hushops_strikebox_v1";

const SCREENS = {
  COUNTER: "COUNTER",
  PRINT_QR: "PRINT_QR",
} as const;

type ScreenType = (typeof SCREENS)[keyof typeof SCREENS];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normCode(value: string) {
  return value.trim().toUpperCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function beep() {
  try {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 140);
  } catch {
    // noop
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state: unknown) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // noop
  }
}

function useSpeechStrikeDetector({
  enabled,
  language,
  tabooByPlayer,
  onStrike,
}: {
  enabled: boolean;
  language: string;
  tabooByPlayer: Array<{ code: string; word: string; level: "EASY" | "HARD" } | null>;
  onStrike: (playerIdx: number, meta: SpeechMeta) => void;
}) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const cooldownRef = useRef<Record<number, number>>({});
  const lastTextRef = useRef("");

  const patterns = useMemo(() => {
    return tabooByPlayer
      .map((taboo, idx) => {
        if (!taboo?.word) {
          return null;
        }
        const word = taboo.word.toUpperCase();
        const regex = word.includes(" ")
          ? new RegExp(escapeRegex(word), "i")
          : new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
        return { playerIdx: idx, regex };
      })
      .filter((entry): entry is { playerIdx: number; regex: RegExp } => Boolean(entry));
  }, [tabooByPlayer]);

  useEffect(() => {
    const win = window as BrowserWindowWithSpeech;
    const SpeechCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechCtor) {
      return;
    }
    if (!enabled) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // noop
      }
      return;
    }

    const recognition = new SpeechCtor();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let idx = event.resultIndex; idx < event.results.length; idx += 1) {
        transcript += `${event.results[idx][0].transcript} `;
      }
      transcript = transcript.trim();
      if (!transcript || transcript === lastTextRef.current) {
        return;
      }
      lastTextRef.current = transcript;

      const now = Date.now();
      patterns.forEach((pattern) => {
        if (!pattern.regex.test(transcript)) {
          return;
        }
        const last = cooldownRef.current[pattern.playerIdx] ?? 0;
        if (now - last < 1500) {
          return;
        }
        cooldownRef.current[pattern.playerIdx] = now;
        onStrike(pattern.playerIdx, { source: "AUTO" });
      });
    };

    recognition.onerror = () => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
    };

    recognition.onend = () => {
      if (!enabled) {
        return;
      }
      try {
        recognition.start();
      } catch {
        // noop
      }
    };

    try {
      recognition.start();
    } catch {
      // noop
    }

    return () => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
    };
  }, [enabled, language, onStrike, patterns]);
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">{children}</span>;
}

function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost" | "danger" | "secondary";
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const style =
    variant === "primary"
      ? "bg-black text-white hover:bg-slate-800"
      : variant === "ghost"
        ? "bg-transparent border hover:bg-slate-50"
        : variant === "danger"
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-slate-100 hover:bg-slate-200";
  return (
    <button className={`${base} ${style}`} onClick={onClick} disabled={disabled} type="button">
      {children}
    </button>
  );
}

function Divider() {
  return <div className="my-4 h-px bg-slate-200" />;
}

function Modal({
  open,
  title,
  children,
  onClose,
  closeLabel = "Close",
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  closeLabel?: string;
}) {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="text-base font-bold">{title}</div>
          <button className="rounded-xl border px-3 py-1 text-sm hover:bg-slate-50" type="button" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function StrikeBoxPage() {
  const { language } = useUiLanguage();
  const isEs = language === "es";
  const tx = (es: string, en: string) => (isEs ? es : en);

  const loaded = useMemo(() => loadState(), []);
  const [screen, setScreen] = useState<ScreenType>(loaded?.screen ?? SCREENS.COUNTER);
  const [players, setPlayers] = useState<Player[]>(
    loaded?.players ?? [
      { name: tx("Jugador 1", "Player 1"), strikes: 0, tabooCode: "" },
      { name: tx("Jugador 2", "Player 2"), strikes: 0, tabooCode: "" },
      { name: tx("Jugador 3", "Player 3"), strikes: 0, tabooCode: "" },
      { name: tx("Jugador 4", "Player 4"), strikes: 0, tabooCode: "" },
    ]
  );
  const [settings, setSettings] = useState(
    loaded?.settings ?? {
      playerCount: 4,
      autoListen: false,
      speechLang: "es-ES",
      adminPin: "0000",
      showCodesOnTiles: true,
    }
  );
  const [scanIndex, setScanIndex] = useState<number | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveState({ screen, players, settings });
  }, [players, screen, settings]);

  useEffect(() => {
    const count = clamp(settings.playerCount, 4, 8);
    if (players.length === count) {
      return;
    }
    setPlayers((prev) => {
      const next = [...prev];
      while (next.length < count) {
        next.push({ name: `${isEs ? "Jugador" : "Player"} ${next.length + 1}`, strikes: 0, tabooCode: "" });
      }
      return next.slice(0, count);
    });
  }, [players.length, settings.playerCount, isEs]);

  const tabooByPlayer = useMemo(() => {
    return players.map((player) => {
      const code = normCode(player.tabooCode);
      const row = TABOO_DB[code];
      return row ? { code, word: row.word, level: row.level } : null;
    });
  }, [players]);

  const triggerFlash = () => {
    const node = flashRef.current;
    if (!node) {
      return;
    }
    node.classList.remove("flash");
    // Force reflow
    void node.offsetHeight;
    node.classList.add("flash");
  };

  const addStrike = (playerIdx: number, meta: SpeechMeta = { source: "MANUAL" }) => {
    beep();
    triggerFlash();
    setPlayers((prev) => prev.map((player, idx) => (idx === playerIdx ? { ...player, strikes: player.strikes + 1 } : player)));
    const who = players[playerIdx]?.name ?? `${tx("Jugador", "Player")} ${playerIdx + 1}`;
    setBanner({ text: `${tx("BEEP - FALTA para", "BEEP - STRIKE for")} ${who} (${meta.source})`, ts: Date.now() });
    window.setTimeout(() => setBanner(null), 1200);
  };

  const undoStrike = (playerIdx: number) => {
    setPlayers((prev) =>
      prev.map((player, idx) => (idx === playerIdx ? { ...player, strikes: Math.max(0, player.strikes - 1) } : player))
    );
  };

  useSpeechStrikeDetector({
    enabled: settings.autoListen,
    language: settings.speechLang,
    tabooByPlayer,
    onStrike: (idx, meta) => addStrike(idx, meta),
  });

  const hardReset = () => {
    localStorage.removeItem(LS_KEY);
    setPlayers([
      { name: tx("Jugador 1", "Player 1"), strikes: 0, tabooCode: "" },
      { name: tx("Jugador 2", "Player 2"), strikes: 0, tabooCode: "" },
      { name: tx("Jugador 3", "Player 3"), strikes: 0, tabooCode: "" },
      { name: tx("Jugador 4", "Player 4"), strikes: 0, tabooCode: "" },
    ]);
    setSettings({
      playerCount: 4,
      autoListen: false,
      speechLang: "es-ES",
      adminPin: "0000",
      showCodesOnTiles: true,
    });
    setScreen(SCREENS.COUNTER);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        .flash { animation: flash 240ms ease-out; }
        @keyframes flash {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.0); }
          45% { box-shadow: 0 0 0 14px rgba(239,68,68,0.35); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.0); }
        }
      `}</style>
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">STRIKEBOX</div>
            <div className="text-sm text-slate-600">{tx("Companion de HUSH OPS - escanea QR Taboo y cuenta faltas", "HUSH OPS companion - scan Taboo QRs, count strikes")}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setScreen(SCREENS.COUNTER)}>
              {tx("Contador", "Counter")}
            </Button>
            <Button variant="ghost" onClick={() => setScreen(SCREENS.PRINT_QR)}>
              {tx("Imprimir QRs", "Print QRs")}
            </Button>
            <Button variant="ghost" onClick={() => setAdminOpen(true)}>
              {tx("Revelado admin", "Admin Reveal")}
            </Button>
            <Button variant="ghost" onClick={hardReset}>
              {tx("Reiniciar", "Reset")}
            </Button>
          </div>
        </header>

        {banner ? <div className="mb-4 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold">{banner.text}</div> : null}

        {screen === SCREENS.COUNTER ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold">{tx("Configuracion", "Setup")}</div>
                  <div className="text-xs text-slate-500">{settings.playerCount} {tx("jugadores", "players")}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" onClick={() => setSettings((prev: typeof settings) => ({ ...prev, playerCount: clamp(prev.playerCount - 1, 4, 8) }))}>
                    -
                  </Button>
                  <div className="text-sm">{settings.playerCount}</div>
                  <Button variant="secondary" onClick={() => setSettings((prev: typeof settings) => ({ ...prev, playerCount: clamp(prev.playerCount + 1, 4, 8) }))}>
                    +
                  </Button>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.showCodesOnTiles}
                        onChange={(event) => setSettings((prev: typeof settings) => ({ ...prev, showCodesOnTiles: event.target.checked }))}
                      />
                      {tx("Mostrar codigos de tarjeta", "Show card codes")}
                    </label>
                  </div>
                </div>
                <Divider />
                <div className="grid gap-2 md:grid-cols-2">
                  {players.map((player, idx) => (
                    <div key={idx} className="rounded-2xl border bg-slate-50 p-3">
                      <div className="flex items-center gap-2">
                        <Pill>#{idx + 1}</Pill>
                        <input
                          className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                          value={player.name}
                          onChange={(event) =>
                            setPlayers((prev) => prev.map((item, i) => (i === idx ? { ...item, name: event.target.value } : item)))
                          }
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button variant="secondary" onClick={() => setScanIndex(idx)}>
                          {tx("Escanear QR Taboo", "Scan Taboo QR")}
                        </Button>
                        <Pill>{player.tabooCode ? `${tx("Asignado", "Assigned")}: ${player.tabooCode}` : tx("Sin Taboo asignado", "No Taboo assigned")}</Pill>
                      </div>
                      <div className="mt-2 text-xs text-slate-600">
                        {tx("Privacidad: el escaneo guarda el", "Privacy: scanning stores the")} <b>{tx("codigo", "code")}</b>. {tx("La palabra se mantiene oculta.", "Word stays hidden.")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold">{tx("Botones de faltas", "Strike Buttons")}</div>
                  <div className="text-xs text-slate-500">{tx("Manual (confiable)", "Manual (reliable)")}</div>
                </div>
                <div ref={flashRef} className="rounded-2xl border bg-slate-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {players.map((player, idx) => (
                      <div key={idx} className="rounded-2xl border bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold">{player.name}</div>
                            <div className="text-xs text-slate-600">{tx("Faltas", "Strikes")}: {player.strikes}</div>
                            {settings.showCodesOnTiles ? (
                              <div className="mt-1 text-[10px] text-slate-500">{tx("Codigo Taboo", "Taboo code")}: {player.tabooCode || "-"}</div>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button onClick={() => addStrike(idx, { source: "MANUAL" })}>+ {tx("Falta", "Strike")}</Button>
                            <Button variant="ghost" onClick={() => undoStrike(idx)}>
                              {tx("Deshacer", "Undo")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Divider />
                  <div className="text-xs text-slate-600">
                    {tx("Modo manual: si se dice una palabra prohibida, pulsa el boton de su", "Manual mode: if any forbidden word is said, press the")} <b>{tx("dueno", "owner")}</b>.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold">{tx("Escucha automatica (best-effort)", "Auto Listen (best-effort)")}</div>
                  <div className="text-xs text-slate-500">Mic</div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">{tx("Escuchando", "Listening")}</span>
                    <input
                      type="checkbox"
                      checked={settings.autoListen}
                      onChange={(event) => setSettings((prev: typeof settings) => ({ ...prev, autoListen: event.target.checked }))}
                    />
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{tx("Idioma", "Language")}</div>
                    <select
                      className="rounded-xl border bg-white px-3 py-2 text-sm"
                      value={settings.speechLang}
                      onChange={(event) => setSettings((prev: typeof settings) => ({ ...prev, speechLang: event.target.value }))}
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es-ES">Spanish (ES)</option>
                      <option value="es-MX">Spanish (MX)</option>
                    </select>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-3 text-xs text-slate-600">
                    {tx("La escucha automatica usa el motor de voz del navegador. Mantiene modo manual como respaldo.", "Auto Listen uses the browser speech engine. Keep manual mode as backup.")}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 text-sm font-semibold">{tx("Ajustes admin", "Admin Settings")}</div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Admin PIN</div>
                  <input
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                    value={settings.adminPin}
                    onChange={(event) => setSettings((prev: typeof settings) => ({ ...prev, adminPin: event.target.value }))}
                  />
                  <div className="text-xs text-slate-600">{tx("El PIN por defecto es 0000.", "Default PIN is 0000.")}</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {screen === SCREENS.PRINT_QR ? (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
              <div className="text-sm font-semibold">{tx("Imprimir stickers QR", "Print QR Stickers")}</div>
              <div className="text-xs text-slate-500">{tx("Solo codigos Taboo", "Taboo codes only")}</div>
            </div>
            <div className="text-sm text-slate-700">
              {tx("El payload del QR es solo el", "QR payload is only the")} <b>{tx("codigo de tarjeta", "card code")}</b> ({tx("ejemplo", "example")}: TAB-E-001). {tx("La palabra queda solo en la tarjeta fisica.", "Word remains on physical card only.")}
            </div>
            <Divider />
            <div className="grid gap-3 md:grid-cols-3">
              {[...TABOO_EASY.map((item) => ({ ...item, level: "EASY" as const })), ...TABOO_HARD.map((item) => ({ ...item, level: "HARD" as const }))].map(
                (entry) => (
                  <div key={entry.code} className="rounded-2xl border bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-500">{entry.level}</div>
                        <div className="text-sm font-bold">{entry.code}</div>
                        <div className="text-xs text-slate-600">({tx("palabra impresa en tarjeta", "word printed on card")})</div>
                      </div>
                      <div className="inline-block rounded-xl border bg-white p-2">
                        <QRCode value={entry.code} size={72} />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ) : null}

        <Modal open={scanIndex !== null} title={`${tx("Escanear QR Taboo", "Scan Taboo QR")} - ${scanIndex !== null ? players[scanIndex]?.name ?? "" : ""}`} onClose={() => setScanIndex(null)} closeLabel={tx("Cerrar", "Close")}>
          {scanIndex !== null ? (
            <ScanModal
              isEs={isEs}
              onResult={(code) => {
                setPlayers((prev) => prev.map((item, idx) => (idx === scanIndex ? { ...item, tabooCode: code } : item)));
                setScanIndex(null);
              }}
            />
          ) : null}
        </Modal>

        <Modal open={adminOpen} title={tx("Revelado admin (PIN)", "Admin Reveal (PIN)")} onClose={() => setAdminOpen(false)} closeLabel={tx("Cerrar", "Close")}>
          <AdminReveal isEs={isEs} players={players} tabooByPlayer={tabooByPlayer} pin={settings.adminPin} />
        </Modal>
      </div>
    </div>
  );
}

function ScanModal({ onResult, isEs }: { onResult: (code: string) => void; isEs: boolean }) {
  const tx = (es: string, en: string) => (isEs ? es : en);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState("");

  useEffect(() => {
    let reader: BrowserMultiFormatReader | null = null;
    let controls: { stop: () => void } | null = null;
    let cancelled = false;
    const start = async () => {
      reader = new BrowserMultiFormatReader();
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices?.[0]?.deviceId;
        if (!deviceId || !videoRef.current) {
          setError(isEs ? "No se encontro camara" : "No camera found");
          return;
        }
        controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
          if (cancelled || !result) {
            return;
          }
          const getText = "getText" in result && typeof result.getText === "function" ? result.getText() : "";
          const code = normCode(getText);
          if (!code || code === lastCode) {
            return;
          }
          setLastCode(code);
          if (!TABOO_DB[code]) {
            setError(`${isEs ? "Codigo desconocido" : "Unknown code"}: ${code}`);
            return;
          }
          try {
            controls?.stop();
          } catch {
            // noop
          }
          onResult(code);
        });
      } catch {
        setError(isEs ? "Error de camara" : "Camera error");
      }
    };
    void start();
    return () => {
      cancelled = true;
      try {
        controls?.stop();
      } catch {
        // noop
      }
    };
  }, [isEs, lastCode, onResult]);

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-700">{tx("Escanea QR Taboo fisico (TAB-E-xxx o TAB-H-xxx).", "Scan physical Taboo QR (TAB-E-xxx or TAB-H-xxx).")}</div>
      <div className="rounded-2xl border bg-slate-50 p-3">
        <video ref={videoRef} className="w-full rounded-xl" />
      </div>
      {error ? <div className="rounded-xl border bg-white p-3 text-sm text-red-600">{error}</div> : null}
      <Divider />
      <div className="rounded-2xl border p-3">
        <div className="mb-2 text-xs font-semibold text-slate-600">{tx("Entrada manual", "Manual entry")}</div>
        <div className="flex gap-2">
          <input
            className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
            placeholder="TAB-E-001"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
          />
          <Button variant="secondary" onClick={() => onResult(normCode(manualCode))} disabled={!TABOO_DB[normCode(manualCode)]}>
            {tx("Asignar", "Assign")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminReveal({
  isEs,
  players,
  tabooByPlayer,
  pin,
}: {
  isEs: boolean;
  players: Player[];
  tabooByPlayer: Array<{ code: string; word: string; level: "EASY" | "HARD" } | null>;
  pin: string;
}) {
  const tx = (es: string, en: string) => (isEs ? es : en);
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-slate-700">{tx("Introduce PIN admin para revelar palabras.", "Enter admin PIN to reveal words.")}</div>
        <input
          className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
          placeholder="PIN"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <Button onClick={() => setUnlocked(input === pin)} disabled={!input}>
          {tx("Desbloquear", "Unlock")}
        </Button>
        {input && input !== pin ? <div className="text-xs text-red-600">{tx("PIN incorrecto.", "Wrong PIN.")}</div> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {players.map((player, idx) => (
        <div key={idx} className="rounded-2xl border p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold">{player.name}</div>
              <div className="text-xs text-slate-600">{tx("Codigo Taboo", "Taboo code")}: {player.tabooCode || "-"}</div>
              <div className="mt-1 text-sm">
                <b>{tx("Palabra", "Word")}:</b> {tabooByPlayer[idx]?.word || tx("(sin asignar)", "(not assigned)")}
              </div>
            </div>
            <Pill>{tx("Faltas", "Strikes")}: {player.strikes}</Pill>
          </div>
        </div>
      ))}
    </div>
  );
}
