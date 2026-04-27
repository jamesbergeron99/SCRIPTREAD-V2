import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenerativeAI } from "@google/generative-ai";

const INWORLD_VOICES = {
    narrators: [
        { id: "Serena", name: "Serena" },
        { id: "Selene", name: "Selene" },
        { id: "default-oglabcjnetcklcq7rghmbw__frank2", name: "Frank" }
    ],
    female: [
        { id: "Abby", name: "Abby" }, { id: "Amina", name: "Amina" }, { id: "Anjali", name: "Anjali" },
        { id: "Ashley", name: "Ashley" }, { id: "Bianca", name: "Bianca" }, { id: "Celeste", name: "Celeste" },
        { id: "Chloe", name: "Chloe" }, { id: "Claire", name: "Claire" }, { id: "Darlene", name: "Darlene" },
        { id: "Deborah", name: "Deborah" }, { id: "Eleanor", name: "Eleanor" }, { id: "Evelyn", name: "Evelyn" },
        { id: "Hana", name: "Hana" }, { id: "Jessica", name: "Jessica" }, { id: "Kelsey", name: "Kelsey" },
        { id: "Lauren", name: "Lauren" }, { id: "Leda", name: "Leda" }, { id: "Loretta", name: "Loretta" },
        { id: "Luna", name: "Luna" }, { id: "Marlene", name: "Marlene" }, { id: "Mia", name: "Mia" },
        { id: "Miranda", name: "Miranda" }, { id: "Nadia", name: "Nadia" }, { id: "Naomi", name: "Naomi" },
        { id: "Olivia", name: "Olivia" }, { id: "Pippa", name: "Pippa" }, { id: "Pixie", name: "Pixie" },
        { id: "Riley", name: "Riley" }, { id: "Saanvi", name: "Saanvi" }, { id: "Sarah", name: "Sarah" },
        { id: "Serena", name: "Serena" }, { id: "Sophie", name: "Sophie" }, { id: "Tessa", name: "Tessa" },
        { id: "Veronica", name: "Veronica" }, { id: "Victoria", name: "Victoria" }
    ],
    male: [
        { id: "Alex", name: "Alex" }, { id: "Arjun", name: "Arjun" }, { id: "Avery", name: "Avery" },
        { id: "Blake", name: "Blake" }, { id: "Brandon", name: "Brandon" }, { id: "Brian", name: "Brian" },
        { id: "Callum", name: "Callum" }, { id: "Carter", name: "Carter" }, { id: "Cedric", name: "Cedric" },
        { id: "Clive", name: "Clive" }, { id: "Conrad", name: "Conrad" }, { id: "Damon", name: "Damon" },
        { id: "Dennis", name: "Dennis" }, { id: "Derek", name: "Derek" }, { id: "Dominus", name: "Dominus" },
        { id: "Duncan", name: "Duncan" }, { id: "Edward", name: "Edward" }, { id: "Elliott", name: "Elliott" },
        { id: "Ethan", name: "Ethan" }, { id: "Evan", name: "Evan" }, { id: "Felix", name: "Felix" },
        { id: "Gareth", name: "Gareth" }, { id: "Graham", name: "Graham" }, { id: "Hamish", name: "Hamish" },
        { id: "Hank", name: "Hank" }, { id: "James", name: "James" }, { id: "Jason", name: "Jason" },
        { id: "Jonah", name: "Jonah" }, { id: "Levi", name: "Levi" }, { id: "Liam", name: "Liam" },
        { id: "Lucian", name: "Lucian" }, { id: "Malcolm", name: "Malcolm" }, { id: "Marcus", name: "Marcus" },
        { id: "Mark", name: "Mark" }, { id: "Nate", name: "Nate" }, { id: "Oliver", name: "Oliver" },
        { id: "Reed", name: "Reed" }, { id: "Rupert", name: "Rupert" }, { id: "Sebastian", name: "Sebastian" },
        { id: "Simon", name: "Simon" }, { id: "Timothy", name: "Timothy" }, { id: "Trevor", name: "Trevor" },
        { id: "Tristan", name: "Tristan" }, { id: "Tyler", name: "Tyler" }, { id: "Victor", name: "Victor" },
        { id: "Vinny", name: "Vinny" }
    ]
};

const LogoIcon = ({ size = "40", color = "#2563eb" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6C10.5 4.5 7.5 4.5 6 4.5C4.5 4.5 3 5.5 3 7.5V19.5C3 19.5 4.5 18.5 6 18.5C7.5 18.5 10.5 18.5 12 20M12 6C13.5 4.5 16.5 4.5 18 4.5C19.5 4.5 21 5.5 21 7.5V19.5C21 19.5 19.5 18.5 18 18.5C16.5 18.5 13.5 18.5 12 20M12 6V20"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 11.5C7.5 12.5 8.5 13.5 10 14M14 14C15.5 13.5 16.5 12.5 17 11.5"
            stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// ── Spinner shown while Gemini is casting the script ──────────────────────────
const Spinner = ({ label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 0' }}>
        <div style={{
            width: 48, height: 48, border: '3px solid #e5e7eb',
            borderTopColor: '#2563eb', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

const Scriptread = () => {
    const [segments, setSegments]       = useState([]);
    const [characters, setCharacters]   = useState([]);
    const [voiceMap, setVoiceMap]       = useState({ Narrator: "Serena" });
    const [isPlaying, setIsPlaying]     = useState(false);
    const [currentIdx, setCurrentIdx]   = useState(-1);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isUnlocked, setIsUnlocked]   = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    // "idle" | "parsing" | "casting" | "ready"
    const [parseStatus, setParseStatus] = useState('idle');
    const [previewingChar, setPreviewingChar] = useState(null);

    const audioCtx        = useRef(null);
    const activeSource    = useRef(null);
    const isPlayingRef    = useRef(false);
    const segmentRefs     = useRef([]);
    const hasGreetedRef   = useRef(false);
    // key: `${text}__${voiceId}` → AudioBuffer
    const audioCache      = useRef({});

    const API_KEY    = import.meta.env.VITE_INWORLD_KEY;
    const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;

    // ── Lifecycle ────────────────────────────────────────────────────────────
    useEffect(() => {
        const params   = new URLSearchParams(window.location.search);
        const isPaid   = params.get('status') === 'success' || localStorage.getItem('sr_full_access') === 'true';
        if (isPaid) { setIsUnlocked(true); localStorage.setItem('sr_full_access', 'true'); }

        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });

        const onFirstClick = () => handleFirstInteraction();
        window.addEventListener('mousedown', onFirstClick, { once: true });

        return () => {
            window.removeEventListener('mousedown', onFirstClick);
            audioCtx.current?.close();
        };
    }, []);

    // ── Audio helpers ─────────────────────────────────────────────────────────
    const resumeCtx = async () => {
        if (audioCtx.current.state === 'suspended') await audioCtx.current.resume();
    };

    const fetchAudio = async (text, voiceId) => {
        const cacheKey = `${text}__${voiceId}`;
        if (audioCache.current[cacheKey]) return audioCache.current[cacheKey];

        const cleaned = text
            .replace(/\bEXT\b\.?/gi, "Exterior")
            .replace(/\bINT\b\.?/gi, "Interior")
            .replace(/\bScriptread\b/gi, "Script-reed");

        const resp = await fetch("https://api.inworld.ai/tts/v1/voice", {
            method: "POST",
            headers: { "Authorization": `Basic ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: cleaned, voiceId: voiceId || "Abby", modelId: "inworld-tts-1.5-max" })
        });
        const data   = await resp.json();
        const buffer = await audioCtx.current.decodeAudioData(
            new Uint8Array(atob(data.audioContent).split("").map(c => c.charCodeAt(0))).buffer
        );
        audioCache.current[cacheKey] = buffer;
        return buffer;
    };

    const playBuffer = (buffer, onEnded) => {
        const source = audioCtx.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.current.destination);
        source.onended = onEnded || null;
        activeSource.current = source;
        source.start();
        return source;
    };

    const stopAudio = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        try { activeSource.current?.stop(); } catch (_) {}
        activeSource.current = null;
    };

    // ── Greeting ──────────────────────────────────────────────────────────────
    const handleFirstInteraction = async () => {
        if (hasGreetedRef.current) return;
        hasGreetedRef.current = true;
        await resumeCtx();
        try {
            const buf = await fetchAudio("Welcome to Script-reed Pro.", "Serena");
            playBuffer(buf);
        } catch (_) { hasGreetedRef.current = false; }
    };

    // ── Voice preview ─────────────────────────────────────────────────────────
    const auditionVoice = async (voiceId, charName) => {
        setPreviewingChar(charName);
        await resumeCtx();
        try {
            stopAudio();
            const buf = await fetchAudio(`Hi, I'm ${charName}.`, voiceId);
            playBuffer(buf, () => setPreviewingChar(null));
        } catch (_) { setPreviewingChar(null); }
    };

    // ── Playback ──────────────────────────────────────────────────────────────
    const playSegment = async (index) => {
        if (!isUnlocked && totalSeconds >= 90) { stopAudio(); setShowPaywall(true); return; }
        if (!isPlayingRef.current || index >= segments.length) {
            isPlayingRef.current = false;
            setIsPlaying(false);
            setCurrentIdx(-1);
            return;
        }
        setCurrentIdx(index);
        segmentRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const seg   = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
        try {
            const buf = await fetchAudio(seg.text, voice);
            if (!isPlayingRef.current) return;
            playBuffer(buf, () => {
                setTotalSeconds(prev => prev + buf.duration);
                if (isPlayingRef.current) playSegment(index + 1);
            });
        } catch (_) {
            if (isPlayingRef.current) playSegment(index + 1);
        }
    };

    // ── Gemini gender classifier ───────────────────────────────────────────────
    const classifyGendersWithGemini = async (names) => {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `You are a casting assistant. Given a list of character names from a screenplay, determine the most likely gender for each character based on the name alone. Reply ONLY with a valid JSON object — no markdown, no explanation. Format: {"NAME": "male" or "female", ...}

Character names: ${names.join(", ")}`;
            const result   = await model.generateContent(prompt);
            const raw      = result.response.text().trim().replace(/```json|```/g, "").trim();
            return JSON.parse(raw);
        } catch (e) {
            console.warn("Gemini gender classification failed, falling back to random assignment.", e);
            return {};
        }
    };

    // ── Script parser (Final Draft / Hollywood format) ────────────────────────
    const parseScript = async (lines) => {
        setParseStatus('parsing');
        audioCache.current = {}; // clear cache when new script loaded

        const blocks        = [];
        let   actionBuffer  = "";
        let   currentSpeaker = null;

        // Headings, transitions, single chars we don't want as character names
        const IGNORE_RE = /^(INT|EXT|DAY|NIGHT|SCENE|CUT TO|FADE|ACT|THE END|CONTINUED|BACK TO|TITLE|MONTAGE|SMASH CUT|DISSOLVE|END OF|^\d+$|^.$)/i;

        const flush = () => {
            if (actionBuffer.trim()) {
                blocks.push({ type: 'narrator', text: actionBuffer.trim() });
                actionBuffer = "";
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const raw = lines[i].text;
            const t   = raw.trim();
            if (!t || /^(\d+|Page \d+)$/i.test(t)) continue;

            const x       = lines[i].x || 0;
            const isAllCaps = t === t.toUpperCase() && /[A-Z]/.test(t) && t.length > 1 && t.length < 40;

            // ── Potential character name ──────────────────────────────────────
            // Final Draft character cues sit roughly between x=150–280
            // They are ALL CAPS and are followed (within 3 lines) by dialogue
            let detectedAsChar = false;
            if (isAllCaps && !IGNORE_RE.test(t) && x >= 100 && x <= 350) {
                for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
                    const peek = lines[j].text.trim();
                    if (!peek) continue;
                    // Dialogue: not all-caps (or is parenthetical), and x further right than scene headings
                    const isDialogue = (peek !== peek.toUpperCase() || (peek.startsWith('(') && peek.endsWith(')')))
                                       && (lines[j].x || 0) > 100;
                    if (isDialogue) { detectedAsChar = true; break; }
                    break; // next non-blank line isn't dialogue → not a character cue
                }
            }

            if (detectedAsChar) {
                flush();
                // Strip parentheticals from name: "MICHAEL (V.O.)" → "MICHAEL"
                currentSpeaker = t.replace(/\s*\([^)]*\)\s*/g, "").trim();
                blocks.push({ type: 'dialogue', character: currentSpeaker, text: "" });
                continue;
            }

            // ── Dialogue continuation ─────────────────────────────────────────
            if (currentSpeaker) {
                const isParenthetical = t.startsWith("(") && t.endsWith(")");
                const notAllCaps      = t !== t.toUpperCase() || !/[A-Z]/.test(t);
                // Final Draft dialogue column: roughly x 100–380
                const inDialogueCol   = (lines[i].x || 0) >= 100 && (lines[i].x || 0) <= 420;

                if ((notAllCaps || isParenthetical) && inDialogueCol && t.length < 200) {
                    const last = blocks[blocks.length - 1];
                    last.text += (last.text ? " " : "") + t;
                } else {
                    currentSpeaker = null;
                    actionBuffer  += (actionBuffer ? " " : "") + t;
                }
                continue;
            }

            actionBuffer += (actionBuffer ? " " : "") + t;
        }
        flush();

        // Keep only dialogue blocks that actually have text
        const finalBlocks = blocks.filter(b => b.text.trim().length > 0);

        // Unique character names that have at least one line of dialogue
        const uniqueNames = [...new Set(
            finalBlocks.filter(b => b.type === 'dialogue').map(b => b.character)
        )].sort();

        // ── Ask Gemini to classify genders ────────────────────────────────────
        setParseStatus('casting');
        const genderMap = await classifyGendersWithGemini(uniqueNames);

        // Build voice assignments — pick a consistent voice per character using a
        // name hash so the same character always gets the same voice
        const nameHash = (name) => name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

        const newVoiceMap = { Narrator: voiceMap.Narrator };
        uniqueNames.forEach(name => {
            const gender = (genderMap[name] || "female").toLowerCase();
            const pool   = gender === "male" ? INWORLD_VOICES.male : INWORLD_VOICES.female;
            newVoiceMap[name] = pool[nameHash(name) % pool.length].id;
        });

        setVoiceMap(newVoiceMap);
        setCharacters(uniqueNames);
        setSegments(finalBlocks);
        setCurrentIdx(-1);
        setTotalSeconds(0);
        setParseStatus('ready');
    };

    // ── PDF load handler ──────────────────────────────────────────────────────
    const handlePdfLoad = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        handleFirstInteraction();
        const reader = new FileReader();
        reader.onload = async () => {
            const pdf   = await window.pdfjsLib.getDocument({ data: reader.result }).promise;
            const lines = [];
            for (let i = 1; i <= Math.min(pdf.numPages, 120); i++) {
                const page    = await pdf.getPage(i);
                const content = await page.getTextContent();
                content.items.forEach(item => lines.push({ text: item.str, x: item.transform[4] }));
            }
            parseScript(lines);
        };
        reader.readAsArrayBuffer(file);
        e.target.value = "";
    };

    // ── Export ────────────────────────────────────────────────────────────────
    const masterAndExport = async () => {
        if (!isUnlocked) { setShowPaywall(true); return; }
        setIsExporting(true); setExportProgress(0);
        const buffers = [];
        try {
            for (let i = 0; i < segments.length; i++) {
                setExportProgress(Math.round((i / segments.length) * 100));
                const seg = segments[i];
                const v   = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
                buffers.push(await fetchAudio(seg.text, v));
            }
            const totalLen    = buffers.reduce((acc, b) => acc + b.length, 0);
            const masterBuf   = audioCtx.current.createBuffer(1, totalLen, 24000);
            const channelData = masterBuf.getChannelData(0);
            let offset = 0;
            buffers.forEach(b => { channelData.set(b.getChannelData(0), offset); offset += b.length; });

            // WAV encoding
            const wavLen = masterBuf.length * 2;
            const view   = new DataView(new ArrayBuffer(44 + wavLen));
            const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
            ws(0, 'RIFF'); view.setUint32(4, 36 + wavLen, true); ws(8, 'WAVE'); ws(12, 'fmt ');
            view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
            view.setUint32(24, 24000, true); view.setUint32(28, 48000, true);
            view.setUint16(32, 2, true); view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, wavLen, true);
            const d = masterBuf.getChannelData(0); let off = 44;
            for (let i = 0; i < d.length; i++, off += 2) {
                const s = Math.max(-1, Math.min(1, d[i]));
                view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
            const link = document.createElement('a');
            link.href     = URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
            link.download = "Scriptread_Master.wav";
            link.click();
        } catch (_) {}
        finally { setIsExporting(false); }
    };

    // ── Toggle play / pause ───────────────────────────────────────────────────
    const handlePlayPause = async () => {
        if (isPlaying) {
            stopAudio();
        } else {
            await resumeCtx();
            isPlayingRef.current = true;
            setIsPlaying(true);
            playSegment(currentIdx < 0 ? 0 : currentIdx);
        }
    };

    // ── Narrator voice selector ───────────────────────────────────────────────
    const narratorVoices = [...INWORLD_VOICES.narrators, ...INWORLD_VOICES.female, ...INWORLD_VOICES.male];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen w-screen bg-[#f8f9fa] text-[#212529] font-sans overflow-hidden fixed inset-0">

            {/* Paywall */}
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-lg p-10 text-center">
                    <div className="bg-white border-2 border-black p-12 shadow-[20px_20px_0px_0px_rgba(37,99,235,1)] max-w-xl rounded-3xl">
                        <LogoIcon size="64" />
                        <h2 className="text-4xl font-black uppercase italic mb-3 mt-4">Unlock your script</h2>
                        <p className="text-gray-500 mb-8 text-sm">You've used your 90-second preview. Unlock the full read for $3.</p>
                        <div className="flex gap-3 justify-center">
                            <form action="https://www.paypal.com/ncp/payment/QVTMH7RF7NUBE" method="post" target="_blank">
                                <input type="submit" value="Unlock — $3.00" className="bg-[#FFD140] font-bold py-4 px-12 rounded-lg cursor-pointer hover:scale-105 transition-all border-2 border-black" />
                            </form>
                            <button onClick={() => setShowPaywall(false)} className="px-6 py-4 border-2 border-black rounded-lg font-bold hover:bg-gray-50 transition-all text-sm">
                                Not now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="h-20 border-b-2 border-black px-10 flex justify-between items-center bg-white shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <LogoIcon size="40" />
                    <h1 className="text-3xl font-black uppercase italic tracking-tight">
                        Scriptread <span className="text-blue-600">Pro</span>
                    </h1>
                </div>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={masterAndExport}
                        disabled={!isUnlocked || segments.length === 0}
                        className={`px-6 py-2 border-2 border-black font-black text-xs uppercase rounded-full transition-all
                            ${isUnlocked && segments.length > 0
                                ? 'bg-white hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-gray-100 opacity-40 cursor-not-allowed'}`}
                    >
                        {isExporting ? `Exporting ${exportProgress}%` : "Master WAV"}
                    </button>
                    <label className="bg-black text-white px-8 py-2 font-black uppercase text-xs rounded-full cursor-pointer hover:bg-gray-800 transition-all shadow-lg select-none">
                        Load Script
                        <input type="file" className="hidden" accept=".pdf" onChange={handlePdfLoad} />
                    </label>
                </div>
            </header>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">

                {/* Sidebar — cast */}
                <aside className="w-80 bg-white border-r-2 border-gray-100 flex flex-col shrink-0 overflow-y-auto p-5">
                    <div className="font-black uppercase text-[10px] text-gray-400 mb-3 tracking-widest">Narrator</div>
                    <div className="p-4 bg-gray-50 rounded-xl border mb-5">
                        <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Narrator</p>
                        <div className="flex gap-2 items-center">
                            <select
                                className="flex-1 bg-white border p-2 font-bold text-xs rounded-lg outline-none"
                                value={voiceMap.Narrator}
                                onChange={e => setVoiceMap({ ...voiceMap, Narrator: e.target.value })}
                            >
                                <optgroup label="Narrators">{INWORLD_VOICES.narrators.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                <optgroup label="Female">{INWORLD_VOICES.female.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                <optgroup label="Male">{INWORLD_VOICES.male.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                            </select>
                            <button
                                onClick={() => auditionVoice(voiceMap.Narrator, "Narrator")}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-[10px] font-black uppercase hover:bg-gray-100 transition-all whitespace-nowrap"
                                title="Preview this voice"
                            >
                                {previewingChar === "Narrator" ? "▶︎ …" : "▶︎"}
                            </button>
                        </div>
                    </div>

                    {characters.length > 0 && (
                        <div className="font-black uppercase text-[10px] text-gray-400 mb-3 tracking-widest">Production Cast</div>
                    )}

                    {characters.map(char => (
                        <div key={char} className="p-4 bg-gray-50 rounded-xl border mb-3">
                            <p className="text-[10px] font-black uppercase text-gray-500 mb-2">{char}</p>
                            <div className="flex gap-2 items-center">
                                <select
                                    className="flex-1 bg-white border p-2 font-bold text-xs rounded-lg outline-none"
                                    value={voiceMap[char] || "Abby"}
                                    onChange={e => setVoiceMap({ ...voiceMap, [char]: e.target.value })}
                                >
                                    <optgroup label="Female">{INWORLD_VOICES.female.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                    <optgroup label="Male">{INWORLD_VOICES.male.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                </select>
                                <button
                                    onClick={() => auditionVoice(voiceMap[char] || "Abby", char)}
                                    disabled={previewingChar === char}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-[10px] font-black uppercase hover:bg-gray-100 transition-all whitespace-nowrap disabled:opacity-50"
                                    title="Preview this voice"
                                >
                                    {previewingChar === char ? "▶︎ …" : "▶︎"}
                                </button>
                            </div>
                        </div>
                    ))}
                </aside>

                {/* Main script view */}
                <main className="flex-1 overflow-y-auto bg-[#e9ecef] p-12 scrollbar-thin">
                    <div className="max-w-2xl mx-auto min-h-full flex flex-col">

                        {parseStatus === 'idle' && (
                            <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center py-24">
                                <LogoIcon size="64" color="#9ca3af" />
                                <h2 className="text-2xl font-black uppercase text-gray-400">Load a script to begin</h2>
                                <p className="text-gray-400 text-sm max-w-xs">Upload a PDF screenplay and Scriptread Pro will cast every character, assign unique voices, and read it aloud.</p>
                            </div>
                        )}

                        {parseStatus === 'parsing' && <Spinner label="Reading script…" />}
                        {parseStatus === 'casting' && <Spinner label="Casting characters with AI…" />}

                        {parseStatus === 'ready' && segments.map((seg, i) => (
                            <div
                                key={i}
                                ref={el => segmentRefs.current[i] = el}
                                className={`p-10 bg-white mb-6 rounded-xl border-l-4 transition-all duration-300
                                    ${currentIdx === i
                                        ? 'border-blue-600 opacity-100 shadow-xl scale-[1.01]'
                                        : 'border-transparent opacity-50'}`}
                            >
                                {seg.type === 'dialogue' && (
                                    <p className="text-[11px] font-black uppercase mb-4 text-blue-600 tracking-widest">{seg.character}</p>
                                )}
                                <p className="text-xl font-serif text-gray-800 leading-relaxed">{seg.text}</p>
                            </div>
                        ))}

                    </div>
                </main>
            </div>

            {/* Footer player */}
            <footer className="h-28 border-t-2 border-black bg-white flex justify-center items-center gap-16 shrink-0 z-50">
                {parseStatus === 'ready' && segments.length > 0 && (
                    <>
                        {/* Rewind to start */}
                        <button
                            onClick={() => { stopAudio(); setCurrentIdx(-1); }}
                            className="text-gray-400 hover:text-black transition-all font-black text-xs uppercase tracking-widest"
                        >
                            ↺ Restart
                        </button>
                        <button
                            onClick={handlePlayPause}
                            className="bg-black text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl font-black text-sm uppercase"
                        >
                            {isPlaying ? "Pause" : "Play"}
                        </button>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center">
                            <div>{segments.length} segments</div>
                            <div>{characters.length} characters</div>
                        </div>
                    </>
                )}
                {(parseStatus === 'parsing' || parseStatus === 'casting') && (
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">
                        {parseStatus === 'parsing' ? 'Reading PDF…' : 'AI casting in progress…'}
                    </p>
                )}
                {parseStatus === 'idle' && (
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">No script loaded</p>
                )}
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
