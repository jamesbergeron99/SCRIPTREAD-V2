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

const SLUG_WORDS = new Set(['INT','EXT','DAY','NIGHT','CUT','FADE','ACT','SCENE','THE','END','BEGIN','MONTAGE','TITLE','OVER']);

const Scriptread = () => {
    const [segments, setSegments] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [voiceMap, setVoiceMap] = useState({ Narrator: 'Serena' });
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [parseStatus, setParseStatus] = useState('idle');
    const [previewingChar, setPreviewingChar] = useState(null);

    const audioCtx = useRef(null);
    const activeSource = useRef(null);
    const isPlayingRef = useRef(false);
    const segmentRefs = useRef([]);
    const hasGreetedRef = useRef(false);
    const audioCache = useRef({});

    const API_KEY = import.meta.env.VITE_INWORLD_KEY;
    const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paid = params.get('status') === 'success' || localStorage.getItem('sr_full_access') === 'true';
        if (paid) { setIsUnlocked(true); localStorage.setItem('sr_full_access', 'true'); }
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        return () => audioCtx.current?.close();
    }, []);

    const fetchAudio = async (text, voiceId) => {
        const key = `${voiceId}||${text}`;
        if (audioCache.current[key]) return audioCache.current[key];
        const cleaned = text.replace(/\bEXT\b\.?/gi, 'Exterior').replace(/\bINT\b\.?/gi, 'Interior').replace(/\bScriptread\b/gi, 'Script-reed');
        const resp = await fetch('https://api.inworld.ai/tts/v1/voice', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cleaned, voiceId: voiceId || 'Abby', modelId: 'inworld-tts-1.5-max' })
        });
        const data = await resp.json();
        const buffer = await audioCtx.current.decodeAudioData(new Uint8Array(atob(data.audioContent).split('').map(c => c.charCodeAt(0))).buffer);
        audioCache.current[key] = buffer;
        return buffer;
    };

    const stopAudio = () => {
        isPlayingRef.current = false; setIsPlaying(false);
        try { activeSource.current?.stop(); } catch(_) {}
        activeSource.current = null;
    };

    const handleFirstInteraction = async () => {
        if (hasGreetedRef.current) return;
        hasGreetedRef.current = true;
        if (audioCtx.current.state === 'suspended') await audioCtx.current.resume();
        try { 
            const buf = await fetchAudio('Welcome to Script-reed Pro.', 'Serena');
            const src = audioCtx.current.createBufferSource();
            src.buffer = buf; src.connect(audioCtx.current.destination); src.start();
        } catch(_) { hasGreetedRef.current = false; }
    };

    const auditionVoice = async (voiceId, charName) => {
        setPreviewingChar(charName);
        if (audioCtx.current.state === 'suspended') await audioCtx.current.resume();
        try {
            stopAudio();
            const buf = await fetchAudio(`Hi, I'm ${charName}.`, voiceId);
            const src = audioCtx.current.createBufferSource();
            src.buffer = buf; src.connect(audioCtx.current.destination);
            src.onended = () => setPreviewingChar(null);
            src.start();
        } catch(_) { setPreviewingChar(null); }
    };

    const playSegment = async (index) => {
        if (!isUnlocked && totalSeconds >= 90) { stopAudio(); setShowPaywall(true); return; }
        if (!isPlayingRef.current || index >= segments.length) {
            isPlayingRef.current = false; setIsPlaying(false); return;
        }
        setCurrentIdx(index);
        segmentRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const seg = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || 'Abby');
        try {
            const buf = await fetchAudio(seg.text, voice);
            if (!isPlayingRef.current) return;
            const src = audioCtx.current.createBufferSource();
            src.buffer = buf; src.connect(audioCtx.current.destination);
            src.onended = () => {
                setTotalSeconds(prev => prev + buf.duration);
                if (isPlayingRef.current) playSegment(index + 1);
            };
            activeSource.current = src; src.start();
        } catch(_) { if (isPlayingRef.current) playSegment(index + 1); }
    };

    const classifyGenders = async (names) => {
        if (!names.length || !GEMINI_KEY) return {};
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `Return ONLY JSON: {"CHARACTER_NAME": "male/female"}. Based on: ${names.join(', ')}`;
            const result = await model.generateContent(prompt);
            const raw = result.response.text().trim().replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(raw);
            const normalized = {};
            Object.entries(parsed).forEach(([k, v]) => { normalized[k.toUpperCase()] = v.toLowerCase(); });
            return normalized;
        } catch(e) { return {}; }
    };

    const parseScript = async (lines) => {
        setParseStatus('parsing');
        const blocks = [];
        let actionBuf = '';
        let currentChar = null;

        const flush = () => {
            if (actionBuf.trim()) { blocks.push({ type: 'narrator', text: actionBuf.trim() }); actionBuf = ''; }
        };

        for (let i = 0; i < lines.length; i++) {
            const t = lines[i].text.trim();
            const x = lines[i].x || 0;
            if (!t || /^(\d+)$/.test(t)) continue;

            // Character Header Detection (Regex supports Slashes like MICHAEL/COTTON)
            const isUpper = t === t.toUpperCase() && /[A-Z]/.test(t);
            let isCharCue = false;
            if (isUpper && x > 100 && x < 380 && t.length < 40 && !SLUG_WORDS.has(t.split(' ')[0])) {
                for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                    const peek = lines[j].text.trim();
                    if (!peek) continue;
                    if (peek.startsWith('(') || peek !== peek.toUpperCase()) { isCharCue = true; break; }
                    break;
                }
            }

            if (isCharCue) {
                flush();
                currentChar = t.replace(/\s*\([^)]*\)\s*$/g, '').trim();
                blocks.push({ type: 'dialogue', character: currentChar, text: '' });
                continue;
            }

            if (currentChar) {
                const isParen = t.startsWith('(') && t.endsWith(')');
                const isMixed = t !== t.toUpperCase() || !/[A-Z]/.test(t);
                if ((isMixed || isParen) && x > 72 && x < 470) {
                    if (!isParen) blocks[blocks.length-1].text += (blocks[blocks.length-1].text ? ' ' : '') + t;
                    continue;
                } else {
                    currentChar = null; // HAND OFF TO NARRATOR
                }
            }

            actionBuf += (actionBuf ? ' ' : '') + t;
        }
        flush();

        const finalBlocks = blocks.filter(b => b.text.trim().length > 0);
        const uniqueNames = [...new Set(finalBlocks.filter(b => b.type === 'dialogue').map(b => b.character))];
        
        setParseStatus('casting');
        const genderMap = await classifyGenders(uniqueNames);
        const nameHash = n => n.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

        const newVoiceMap = { Narrator: voiceMap.Narrator };
        uniqueNames.forEach(name => {
            const gender = genderMap[name.toUpperCase()] || (name.toLowerCase().endsWith('a') ? 'female' : 'male');
            const pool = gender === 'male' ? INWORLD_VOICES.male : INWORLD_VOICES.female;
            newVoiceMap[name] = pool[nameHash(name) % pool.length].id;
        });

        setVoiceMap(newVoiceMap);
        setCharacters(uniqueNames.sort());
        setSegments(finalBlocks);
        setParseStatus('ready');
    };

    const handlePdfLoad = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        handleFirstInteraction();
        const reader = new FileReader();
        reader.onload = async () => {
            const pdf = await window.pdfjsLib.getDocument({ data: reader.result }).promise;
            const lines = [];
            for (let i = 1; i <= Math.min(pdf.numPages, 120); i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                content.items.forEach(item => lines.push({ text: item.str, x: item.transform[4] }));
            }
            parseScript(lines);
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#f8f9fa] text-[#212529] font-sans overflow-hidden fixed inset-0">
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-lg p-10 text-center">
                    <div className="bg-white border-2 border-black p-12 shadow-[20px_20px_0px_0px_rgba(37,99,235,1)] max-w-xl rounded-3xl">
                        <LogoIcon size="64" /><h2 className="text-4xl font-black uppercase italic mb-3 mt-4">Unlock Script</h2>
                        <form action="https://www.paypal.com/ncp/payment/QVTMH7RF7NUBE" method="post" target="_blank">
                            <input type="submit" value="Unlock — $3.00" className="bg-[#FFD140] font-bold py-4 px-12 rounded-lg cursor-pointer border-2 border-black" />
                        </form>
                    </div>
                </div>
            )}
            <header className="h-20 border-b-2 border-black px-10 flex justify-between items-center bg-white shrink-0 z-50">
                <div className="flex items-center gap-4"><LogoIcon size="40" /><h1 className="text-3xl font-black uppercase italic tracking-tight italic">Scriptread <span className="text-blue-600">Pro</span></h1></div>
                <label className="bg-black text-white px-8 py-2 font-black uppercase text-xs rounded-full cursor-pointer shadow-lg select-none">
                    Load Script <input type="file" className="hidden" accept=".pdf" onChange={handlePdfLoad} />
                </label>
            </header>
            <div className="flex-1 flex overflow-hidden">
                <aside className="w-80 bg-white border-r-2 border-gray-100 flex flex-col shrink-0 overflow-y-auto p-5">
                    <div className="font-black uppercase text-[10px] text-gray-400 mb-3 tracking-widest">Narrator</div>
                    <select className="w-full bg-white border p-2 font-bold text-xs rounded-lg mb-5" value={voiceMap.Narrator} onChange={e => setVoiceMap({...voiceMap, Narrator: e.target.value})}>
                        {INWORLD_VOICES.narrators.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    {characters.map(char => (
                        <div key={char} className="p-4 bg-gray-50 rounded-xl border mb-3">
                            <p className="text-[10px] font-black uppercase text-gray-500 mb-2">{char}</p>
                            <div className="flex gap-2">
                                <select className="flex-1 bg-white border p-2 font-bold text-xs rounded-lg" value={voiceMap[char] || 'Abby'} onChange={e => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    <optgroup label="Female">{INWORLD_VOICES.female.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                    <optgroup label="Male">{INWORLD_VOICES.male.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                </select>
                                <button onClick={() => auditionVoice(voiceMap[char] || 'Abby', char)} className="px-3 py-2 border rounded-lg text-[10px] font-black">▶︎</button>
                            </div>
                        </div>
                    ))}
                </aside>
                <main className="flex-1 overflow-y-auto bg-[#e9ecef] p-12 scrollbar-thin">
                    <div className="max-w-2xl mx-auto min-h-full">
                        {parseStatus === 'parsing' || parseStatus === 'casting' ? <Spinner label={parseStatus === 'parsing' ? 'Reading script…' : 'AI casting…'} /> : 
                        segments.map((seg, i) => (
                            <div key={i} ref={el => segmentRefs.current[i] = el} className={`p-10 bg-white mb-6 rounded-xl border-l-4 transition-all ${currentIdx === i ? 'border-blue-600 opacity-100 shadow-xl' : 'border-transparent opacity-50'}`}>
                                {seg.type === 'dialogue' && <p className="text-[11px] font-black uppercase mb-4 text-blue-600 tracking-widest">{seg.character}</p>}
                                <p className="text-xl font-serif text-gray-800 leading-relaxed">{seg.text}</p>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
            <footer className="h-28 border-t-2 border-black bg-white flex justify-center items-center gap-16 shrink-0 z-50">
                <button onClick={handlePlayPause} className="bg-black text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl font-black">{isPlaying ? "PAUSE" : "PLAY"}</button>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
