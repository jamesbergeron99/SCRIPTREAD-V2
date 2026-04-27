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

const Spinner = ({ label }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:'60px 0' }}>
        <div style={{ width:48, height:48, border:'3px solid #e5e7eb', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ fontSize:13, color:'#6b7280', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>{label}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// ─── Slug/transition keywords that are NEVER character names ─────────────────
const SLUG_WORDS = new Set([
    'INT','EXT','DAY','NIGHT','DAWN','DUSK','CONTINUOUS','LATER','MOMENTS',
    'CUT','FADE','DISSOLVE','SMASH','WIPE','TITLE','OVER','BACK','END',
    'BEGIN','ACT','SCENE','THE','EPILOGUE','PROLOGUE','CONTINUED','INTERCUT',
    'FLASHBACK','FLASH','FORWARD','MONTAGE','SERIES','SHOTS','SPLIT','SCREEN',
    'PUSH','PULL','INSERT','CLOSE','MEDIUM','WIDE','POV','ANGLE','ANOTHER',
    'SAME','OMITTED','NOTE','REVISED','DRAFT','PAGE','PAGES','PHONE',
    'CONVERSATION','DREAM','HALLUCINATION','MEMORY','VISION','CAPTION',
    'SUPER','TEXT','MOTION','FAST','SLOW','ROOM','HOUSE','HOTEL','CLUB',
    'CAR','STREET','OFFICE','STORE','BANK','HOSPITAL','AIRPORT','BATHROOM',
    'BEDROOM','KITCHEN','HALLWAY','CORRIDOR','STAIRWELL','PARKING','LOT',
    'LOFT','WAREHOUSE','SALON','DRESSING','BOOTH','STAGE','COURT',
]);

// A valid Final Draft character cue:
//  • ALL CAPS letters, spaces, hyphens, apostrophes, one optional slash
//  • 2–35 characters after stripping trailing parentheticals
//  • No sentence-ending punctuation (., !, ?, :, ;)
//  • Not composed entirely of slug keywords
//  • At most 4 words (real character names are short)
function isValidCharacterName(raw) {
    // Strip trailing voice direction: "ROBERT (V.O.)" → "ROBERT"
    const cleaned = raw.replace(/\s*\([^)]*\)\s*$/g, '').trim();

    if (cleaned.length < 2 || cleaned.length > 35) return false;

    // Only uppercase letters, spaces, hyphens, apostrophes, one slash allowed
    if (!/^[A-Z][A-Z\s'\-/]*$/.test(cleaned)) return false;

    // Sentence punctuation → not a name
    if (/[.!?,;:]/.test(raw)) return false;

    // Must have at least one 2-letter sequence
    if (!/[A-Z]{2}/.test(cleaned)) return false;

    // Split on space and slash to get individual words
    const words = cleaned.split(/[\s/]+/).filter(Boolean);

    // Too many words → action line
    if (words.length > 4) return false;

    // If EVERY word is a slug keyword → not a name
    if (words.length > 0 && words.every(w => SLUG_WORDS.has(w))) return false;

    return true;
}

// Final Draft PDF x-position ranges (points at 72dpi, 8.5" page):
//   Scene headings / action: x ≈ 72–144
//   Character cues:          x ≈ 190–280  ← tight window
//   Dialogue:                x ≈ 108–396
const CHAR_X_MIN   = 170;
const CHAR_X_MAX   = 310;
const DIAL_X_MIN   = 90;
const DIAL_X_MAX   = 430;

const Scriptread = () => {
    const [segments, setSegments]         = useState([]);
    const [characters, setCharacters]     = useState([]);
    const [voiceMap, setVoiceMap]         = useState({ Narrator: 'Serena' });
    const [isPlaying, setIsPlaying]       = useState(false);
    const [currentIdx, setCurrentIdx]     = useState(-1);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isUnlocked, setIsUnlocked]     = useState(false);
    const [showPaywall, setShowPaywall]   = useState(false);
    const [isExporting, setIsExporting]   = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [parseStatus, setParseStatus]   = useState('idle'); // idle|parsing|casting|ready
    const [previewingChar, setPreviewingChar] = useState(null);

    const audioCtx      = useRef(null);
    const activeSource  = useRef(null);
    const isPlayingRef  = useRef(false);
    const segmentRefs   = useRef([]);
    const hasGreetedRef = useRef(false);
    const audioCache    = useRef({});

    const API_KEY    = import.meta.env.VITE_INWORLD_KEY;
    const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paid   = params.get('status') === 'success' || localStorage.getItem('sr_full_access') === 'true';
        if (paid) { setIsUnlocked(true); localStorage.setItem('sr_full_access', 'true'); }

        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        const onFirst = () => handleFirstInteraction();
        window.addEventListener('mousedown', onFirst, { once: true });
        return () => {
            window.removeEventListener('mousedown', onFirst);
            audioCtx.current?.close();
        };
    }, []);

    // ── Audio ─────────────────────────────────────────────────────────────────
    const resumeCtx = async () => {
        if (audioCtx.current.state === 'suspended') await audioCtx.current.resume();
    };

    const fetchAudio = async (text, voiceId) => {
        const key = `${voiceId}||${text}`;
        if (audioCache.current[key]) return audioCache.current[key];
        const cleaned = text
            .replace(/\bEXT\b\.?/gi, 'Exterior')
            .replace(/\bINT\b\.?/gi, 'Interior')
            .replace(/\bScriptread\b/gi, 'Script-reed');
        const resp = await fetch('https://api.inworld.ai/tts/v1/voice', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cleaned, voiceId: voiceId || 'Abby', modelId: 'inworld-tts-1.5-max' })
        });
        const data   = await resp.json();
        const buffer = await audioCtx.current.decodeAudioData(
            new Uint8Array(atob(data.audioContent).split('').map(c => c.charCodeAt(0))).buffer
        );
        audioCache.current[key] = buffer;
        return buffer;
    };

    const playBuffer = (buffer, onEnded) => {
        if (activeSource.current) { try { activeSource.current.stop(); } catch(_){} }
        const src = audioCtx.current.createBufferSource();
        src.buffer = buffer;
        src.connect(audioCtx.current.destination);
        src.onended = onEnded || null;
        activeSource.current = src;
        src.start();
        return src;
    };

    const stopAudio = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        try { activeSource.current?.stop(); } catch(_) {}
        activeSource.current = null;
    };

    const handleFirstInteraction = async () => {
        if (hasGreetedRef.current) return;
        hasGreetedRef.current = true;
        await resumeCtx();
        try {
            const buf = await fetchAudio('Welcome to Script-reed Pro.', 'Serena');
            playBuffer(buf);
        } catch(_) { hasGreetedRef.current = false; }
    };

    const auditionVoice = async (voiceId, charName) => {
        setPreviewingChar(charName);
        await resumeCtx();
        try {
            stopAudio();
            const buf = await fetchAudio(`Hi, I'm ${charName}.`, voiceId);
            playBuffer(buf, () => setPreviewingChar(null));
        } catch(_) { setPreviewingChar(null); }
    };

    // ── Playback controls ─────────────────────────────────────────────────────
    const playSegment = async (index) => {
        if (!isUnlocked && totalSeconds >= 90) { stopAudio(); setShowPaywall(true); return; }
        if (!isPlayingRef.current || index >= segments.length) {
            isPlayingRef.current = false; setIsPlaying(false); setCurrentIdx(-1); return;
        }
        setCurrentIdx(index);
        segmentRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const seg   = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || 'Abby');
        try {
            const buf = await fetchAudio(seg.text, voice);
            if (!isPlayingRef.current) return;
            playBuffer(buf, () => {
                setTotalSeconds(prev => prev + buf.duration);
                if (isPlayingRef.current) playSegment(index + 1);
            });
        } catch(_) { if (isPlayingRef.current) playSegment(index + 1); }
    };

    const handlePlayPause = async () => {
        if (isPlaying) { stopAudio(); return; }
        await resumeCtx();
        isPlayingRef.current = true;
        setIsPlaying(true);
        playSegment(currentIdx < 0 ? 0 : currentIdx);
    };

    const handleRestart = () => { stopAudio(); setCurrentIdx(-1); };

    const handleSkipBack = () => {
        const prev = Math.max(0, (currentIdx < 0 ? 0 : currentIdx) - 1);
        stopAudio();
        setTimeout(() => { isPlayingRef.current = true; setIsPlaying(true); playSegment(prev); }, 50);
    };

    const handleSkipForward = () => {
        const next = Math.min(segments.length - 1, (currentIdx < 0 ? 0 : currentIdx) + 1);
        stopAudio();
        setTimeout(() => { isPlayingRef.current = true; setIsPlaying(true); playSegment(next); }, 50);
    };

    // ── Gemini gender classification ──────────────────────────────────────────
    const classifyGenders = async (names) => {
        if (!names.length) return {};
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt =
                `You are a Hollywood casting assistant. Given these character names from a screenplay, ` +
                `determine the most likely gender for each based on the name. ` +
                `For slash names like MICHAEL/COTTON, base the answer on the first name. ` +
                `Reply ONLY with a valid JSON object, no markdown, no extra text. ` +
                `Format exactly: {"NAME": "male", "NAME2": "female", ...}\n\n` +
                `Character names: ${names.join(', ')}`;
            const result = await model.generateContent(prompt);
            const raw    = result.response.text().trim().replace(/```json|```/g, '').trim();
            return JSON.parse(raw);
        } catch(e) {
            console.warn('Gemini gender classification failed:', e);
            return {};
        }
    };

    // ── PDF parser (Final Draft format) ───────────────────────────────────────
    const parseScript = async (lines) => {
        setParseStatus('parsing');
        audioCache.current = {};

        const blocks       = [];
        let   actionBuf    = '';
        let   currentChar  = null;

        const flush = () => {
            if (actionBuf.trim()) { blocks.push({ type: 'narrator', text: actionBuf.trim() }); actionBuf = ''; }
        };

        for (let i = 0; i < lines.length; i++) {
            const raw = lines[i].text;
            const t   = raw.trim();
            if (!t) continue;
            if (/^(\d{1,3}\.?)$/.test(t)) continue; // page numbers

            const x = lines[i].x || 0;

            // ── Character cue detection ────────────────────────────────────
            // Must be ALL CAPS, in the character-cue x-range, pass name validation,
            // AND the very next non-empty line must look like dialogue (mixed case or parenthetical).
            let isCharCue = false;
            if (
                t === t.toUpperCase() &&
                x >= CHAR_X_MIN && x <= CHAR_X_MAX &&
                isValidCharacterName(t)
            ) {
                // Look ahead for the next non-blank line
                for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                    const peek  = lines[j].text.trim();
                    const peekX = lines[j].x || 0;
                    if (!peek) continue;

                    // A parenthetical on its own line (e.g. "(beat)") counts
                    if (peek.startsWith('(') && peek.endsWith(')')) { isCharCue = true; break; }

                    // Mixed-case text in the dialogue column = real dialogue
                    const hasMixed = peek !== peek.toUpperCase();
                    if (hasMixed && peekX >= DIAL_X_MIN && peekX <= DIAL_X_MAX) { isCharCue = true; }
                    break;
                }
            }

            if (isCharCue) {
                flush();
                currentChar = t.replace(/\s*\([^)]*\)\s*$/g, '').trim(); // strip (V.O.) etc.
                blocks.push({ type: 'dialogue', character: currentChar, text: '' });
                continue;
            }

            // ── Dialogue continuation ──────────────────────────────────────
            if (currentChar) {
                const isParen    = t.startsWith('(') && t.endsWith(')');
                const isMixed    = t !== t.toUpperCase() || !/[A-Z]/.test(t);
                const inDialCol  = x >= DIAL_X_MIN && x <= DIAL_X_MAX;

                if ((isMixed || isParen) && inDialCol && t.length < 200) {
                    if (!isParen) { // skip acting directions — don't read them aloud
                        const last = blocks[blocks.length - 1];
                        last.text += (last.text ? ' ' : '') + t;
                    }
                } else {
                    currentChar = null;
                    actionBuf  += (actionBuf ? ' ' : '') + t;
                }
                continue;
            }

            actionBuf += (actionBuf ? ' ' : '') + t;
        }
        flush();

        const finalBlocks  = blocks.filter(b => b.text.trim().length > 0);
        const uniqueNames  = [...new Set(
            finalBlocks.filter(b => b.type === 'dialogue').map(b => b.character)
        )].sort();

        // ── Gemini casting ────────────────────────────────────────────────────
        setParseStatus('casting');
        const genderMap = await classifyGenders(uniqueNames);

        const nameHash = name => name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

        const newVoiceMap = { Narrator: voiceMap.Narrator };
        uniqueNames.forEach(name => {
            const gender = (genderMap[name] || 'female').toLowerCase();
            const pool   = gender === 'male' ? INWORLD_VOICES.male : INWORLD_VOICES.female;
            newVoiceMap[name] = pool[nameHash(name) % pool.length].id;
        });

        setVoiceMap(newVoiceMap);
        setCharacters(uniqueNames);
        setSegments(finalBlocks);
        setCurrentIdx(-1);
        setTotalSeconds(0);
        setParseStatus('ready');
    };

    // ── PDF load ──────────────────────────────────────────────────────────────
    const handlePdfLoad = (e) => {
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
        e.target.value = '';
    };

    // ── Master WAV export ─────────────────────────────────────────────────────
    const masterAndExport = async () => {
        if (!isUnlocked) { setShowPaywall(true); return; }
        setIsExporting(true); setExportProgress(0);
        const buffers = [];
        try {
            for (let i = 0; i < segments.length; i++) {
                setExportProgress(Math.round((i / segments.length) * 100));
                const seg = segments[i];
                const v   = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || 'Abby');
                buffers.push(await fetchAudio(seg.text, v));
            }
            const totalLen = buffers.reduce((a, b) => a + b.length, 0);
            const master   = audioCtx.current.createBuffer(1, totalLen, 24000);
            const ch       = master.getChannelData(0);
            let off = 0;
            buffers.forEach(b => { ch.set(b.getChannelData(0), off); off += b.length; });
            const wavLen = master.length * 2;
            const view   = new DataView(new ArrayBuffer(44 + wavLen));
            const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
            ws(0,'RIFF'); view.setUint32(4,36+wavLen,true); ws(8,'WAVE'); ws(12,'fmt ');
            view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
            view.setUint32(24,24000,true); view.setUint32(28,48000,true);
            view.setUint16(32,2,true); view.setUint16(34,16,true); ws(36,'data'); view.setUint32(40,wavLen,true);
            const d = master.getChannelData(0); let o2 = 44;
            for (let i = 0; i < d.length; i++, o2+=2) {
                const s = Math.max(-1, Math.min(1, d[i]));
                view.setInt16(o2, s < 0 ? s*0x8000 : s*0x7FFF, true);
            }
            const link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([view.buffer], { type:'audio/wav' }));
            link.download = 'Scriptread_Master.wav'; link.click();
        } catch(_) {}
        finally { setIsExporting(false); }
    };

    const canPlay = parseStatus === 'ready' && segments.length > 0;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen w-screen bg-[#f8f9fa] text-[#212529] font-sans overflow-hidden fixed inset-0">

            {/* Paywall */}
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-lg p-10 text-center">
                    <div className="bg-white border-2 border-black p-12 shadow-[20px_20px_0px_0px_rgba(37,99,235,1)] max-w-xl rounded-3xl">
                        <LogoIcon size="64" />
                        <h2 className="text-4xl font-black uppercase italic mb-3 mt-4">Unlock your script</h2>
                        <p className="text-gray-500 mb-8 text-sm">You've used your free 90-second preview. Unlock the full read for $3.</p>
                        <div className="flex gap-3 justify-center">
                            <form action="https://www.paypal.com/ncp/payment/QVTMH7RF7NUBE" method="post" target="_blank">
                                <input type="submit" value="Unlock — $3.00"
                                    className="bg-[#FFD140] font-bold py-4 px-12 rounded-lg cursor-pointer hover:scale-105 transition-all border-2 border-black" />
                            </form>
                            <button onClick={() => setShowPaywall(false)}
                                className="px-6 py-4 border-2 border-black rounded-lg font-bold hover:bg-gray-50 transition-all text-sm">
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
                    <button onClick={masterAndExport} disabled={!isUnlocked || !canPlay}
                        className={`px-6 py-2 border-2 border-black font-black text-xs uppercase rounded-full transition-all
                            ${isUnlocked && canPlay ? 'bg-white hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 opacity-40 cursor-not-allowed'}`}>
                        {isExporting ? `Exporting ${exportProgress}%` : 'Master WAV'}
                    </button>
                    <label className="bg-black text-white px-8 py-2 font-black uppercase text-xs rounded-full cursor-pointer hover:bg-gray-800 transition-all shadow-lg select-none">
                        Load Script
                        <input type="file" className="hidden" accept=".pdf" onChange={handlePdfLoad} />
                    </label>
                </div>
            </header>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">

                {/* Sidebar */}
                <aside className="w-80 bg-white border-r-2 border-gray-100 flex flex-col shrink-0 overflow-y-auto p-5">
                    <div className="font-black uppercase text-[10px] text-gray-400 mb-3 tracking-widest">Narrator</div>
                    <div className="p-4 bg-gray-50 rounded-xl border mb-5">
                        <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Narrator</p>
                        <div className="flex gap-2 items-center">
                            <select className="flex-1 bg-white border p-2 font-bold text-xs rounded-lg outline-none"
                                value={voiceMap.Narrator}
                                onChange={e => setVoiceMap({ ...voiceMap, Narrator: e.target.value })}>
                                <optgroup label="Narrators">{INWORLD_VOICES.narrators.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                <optgroup label="Female">{INWORLD_VOICES.female.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                <optgroup label="Male">{INWORLD_VOICES.male.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                            </select>
                            <button onClick={() => auditionVoice(voiceMap.Narrator, 'Narrator')}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-[10px] font-black uppercase hover:bg-gray-100 transition-all whitespace-nowrap">
                                {previewingChar === 'Narrator' ? '▶︎…' : '▶︎'}
                            </button>
                        </div>
                    </div>

                    {characters.length > 0 && (
                        <div className="font-black uppercase text-[10px] text-gray-400 mb-3 tracking-widest">
                            Production Cast ({characters.length})
                        </div>
                    )}
                    {characters.map(char => (
                        <div key={char} className="p-4 bg-gray-50 rounded-xl border mb-3">
                            <p className="text-[10px] font-black uppercase text-gray-500 mb-2">{char}</p>
                            <div className="flex gap-2 items-center">
                                <select className="flex-1 bg-white border p-2 font-bold text-xs rounded-lg outline-none"
                                    value={voiceMap[char] || 'Abby'}
                                    onChange={e => setVoiceMap({ ...voiceMap, [char]: e.target.value })}>
                                    <optgroup label="Female">{INWORLD_VOICES.female.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                    <optgroup label="Male">{INWORLD_VOICES.male.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                </select>
                                <button onClick={() => auditionVoice(voiceMap[char] || 'Abby', char)}
                                    disabled={previewingChar === char}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-[10px] font-black uppercase hover:bg-gray-100 transition-all whitespace-nowrap disabled:opacity-50">
                                    {previewingChar === char ? '▶︎…' : '▶︎'}
                                </button>
                            </div>
                        </div>
                    ))}

                    {parseStatus === 'parsing' && <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center mt-6 animate-pulse">Reading PDF…</p>}
                    {parseStatus === 'casting' && <p className="text-xs text-blue-500 font-bold uppercase tracking-widest text-center mt-6 animate-pulse">AI casting in progress…</p>}
                </aside>

                {/* Script */}
                <main className="flex-1 overflow-y-auto bg-[#e9ecef] p-12 scrollbar-thin">
                    <div className="max-w-2xl mx-auto min-h-full flex flex-col">
                        {parseStatus === 'idle' && (
                            <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center py-24">
                                <LogoIcon size="64" color="#9ca3af" />
                                <h2 className="text-2xl font-black uppercase text-gray-400">Load a script to begin</h2>
                                <p className="text-gray-400 text-sm max-w-xs">Upload a PDF screenplay — Scriptread Pro will cast every character with a unique voice and read it aloud.</p>
                            </div>
                        )}
                        {(parseStatus === 'parsing' || parseStatus === 'casting') && (
                            <Spinner label={parseStatus === 'parsing' ? 'Reading script…' : 'AI casting characters…'} />
                        )}
                        {parseStatus === 'ready' && segments.map((seg, i) => (
                            <div key={i} ref={el => segmentRefs.current[i] = el}
                                className={`p-10 bg-white mb-6 rounded-xl border-l-4 transition-all duration-300
                                    ${currentIdx === i ? 'border-blue-600 opacity-100 shadow-xl scale-[1.01]' : 'border-transparent opacity-50'}`}>
                                {seg.type === 'dialogue' && (
                                    <p className="text-[11px] font-black uppercase mb-4 text-blue-600 tracking-widest">{seg.character}</p>
                                )}
                                <p className="text-xl font-serif text-gray-800 leading-relaxed">{seg.text}</p>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Footer — media controls */}
            <footer className="h-28 border-t-2 border-black bg-white flex justify-center items-center gap-8 shrink-0 z-50 px-8">

                {parseStatus === 'idle' && (
                    <p className="text-xs font-black uppercase tracking-widest text-gray-300">No script loaded</p>
                )}
                {(parseStatus === 'parsing' || parseStatus === 'casting') && (
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">
                        {parseStatus === 'parsing' ? 'Reading PDF…' : 'AI casting in progress…'}
                    </p>
                )}

                {canPlay && (
                    <>
                        {/* Restart */}
                        <button onClick={handleRestart} title="Restart from beginning"
                            className="text-gray-400 hover:text-black transition-all">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 4 1 10 7 10"/>
                                <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                            </svg>
                        </button>

                        {/* Skip back */}
                        <button onClick={handleSkipBack} title="Previous segment"
                            className="text-gray-400 hover:text-black transition-all">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
                            </svg>
                        </button>

                        {/* Play / Pause */}
                        <button onClick={handlePlayPause}
                            className="bg-black text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                            title={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? (
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                                </svg>
                            ) : (
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                    <polygon points="5,3 19,12 5,21"/>
                                </svg>
                            )}
                        </button>

                        {/* Skip forward */}
                        <button onClick={handleSkipForward} title="Next segment"
                            className="text-gray-400 hover:text-black transition-all">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 18l8.5-6L6 6v12zm9-12v12h2V6h-2z"/>
                            </svg>
                        </button>

                        {/* Stats */}
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center">
                            <div>{segments.length} segments</div>
                            <div>{characters.length} characters</div>
                        </div>
                    </>
                )}
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
