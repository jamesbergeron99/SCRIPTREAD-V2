import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

const PROMO_CODES = ["FRIENDS", "BETA", "LAUNCH", "JIMMYB", "REDDIT", "FREE"];

const INWORLD_VOICES = {
    narrators: [
        { id: "Serena", name: "Serena" },
        { id: "Selene", name: "Selene" },
        { id: "default-oglabcjnetcklcq7rghmbw__frank2", name: "Frank" }
    ],
    custom: [
        { id: "default-oglabcjnetcklcq7rghmbw__design-voice-1289100c", name: "Daneeka" },
        { id: "default-oglabcjnetcklcq7rghmbw__design-voice-045a5de4", name: "Zack" },
        { id: "default-oglabcjnetcklcq7rghmbw__design-voice-30af450b", name: "Oleg" }
    ],
    female: [
        { id: "Abby", name: "Abby" }, { id: "Amina", name: "Amina" }, { id: "Anjali", name: "Anjali" }, { id: "Ashley", name: "Ashley" }, { id: "Bianca", name: "Bianca" }, { id: "Celeste", name: "Celeste" }, { id: "Chloe", name: "Chloe" }, { id: "Claire", name: "Claire" }, { id: "Darlene", name: "Darlene" }, { id: "Deborah", name: "Deborah" }, { id: "Eleanor", name: "Eleanor" }, { id: "Evelyn", name: "Evelyn" }, { id: "Hana", name: "Hana" }, { id: "Jessica", name: "Jessica" }, { id: "Kelsey", name: "Kelsey" }, { id: "Lauren", name: "Lauren" }, { id: "Leda", name: "Leda" }, { id: "Loretta", name: "Loretta" }, { id: "Luna", name: "Luna" }, { id: "Marlene", name: "Marlene" }, { id: "Mia", name: "Mia" }, { id: "Miranda", name: "Miranda" }, { id: "Nadia", name: "Nadia" }, { id: "Naomi", name: "Naomi" }, { id: "Olivia", name: "Olivia" }, { id: "Pippa", name: "Pippa" }, { id: "Pixie", name: "Pixie" }, { id: "Riley", name: "Riley" }, { id: "Saanvi", name: "Saanvi" }, { id: "Sarah", name: "Sarah" }, { id: "Serena", name: "Serena" }, { id: "Sophie", name: "Sophie" }, { id: "Tessa", name: "Tessa" }, { id: "Veronica", name: "Veronica" }, { id: "Victoria", name: "Victoria" }
    ],
    male: [
        { id: "Alex", name: "Alex" }, { id: "Arjun", name: "Arjun" }, { id: "Avery", name: "Avery" }, { id: "Blake", name: "Blake" }, { id: "Brandon", name: "Brandon" }, { id: "Brian", name: "Brian" }, { id: "Callum", name: "Callum" }, { id: "Carter", name: "Carter" }, { id: "Cedric", name: "Cedric" }, { id: "Clive", name: "Clive" }, { id: "Conrad", name: "Conrad" }, { id: "Damon", name: "Damon" }, { id: "Dennis", name: "Dennis" }, { id: "Derek", name: "Derek" }, { id: "Dominus", name: "Dominus" }, { id: "Duncan", name: "Duncan" }, { id: "Edward", name: "Edward" }, { id: "Elliott", name: "Elliott" }, { id: "Ethan", name: "Ethan" }, { id: "Evan", name: "Evan" }, { id: "Felix", name: "Felix" }, { id: "Gareth", name: "Gareth" }, { id: "Graham", name: "Graham" }, { id: "Hamish", name: "Hamish" }, { id: "Hank", name: "Hank" }, { id: "James", name: "James" }, { id: "Jason", name: "Jason" }, { id: "Jonah", name: "Jonah" }, { id: "Levi", name: "Levi" }, { id: "Liam", name: "Liam" }, { id: "Lucian", name: "Lucian" }, { id: "Malcolm", name: "Malcolm" }, { id: "Marcus", name: "Marcus" }, { id: "Mark", name: "Mark" }, { id: "Nate", name: "Nate" }, { id: "Oliver", name: "Oliver" }, { id: "Reed", name: "Reed" }, { id: "Rupert", name: "Rupert" }, { id: "Sebastian", name: "Sebastian" }, { id: "Simon", name: "Simon" }, { id: "Timothy", name: "Timothy" }, { id: "Trevor", name: "Trevor" }, { id: "Tristan", name: "Tristan" }, { id: "Tyler", name: "Tyler" }, { id: "Victor", name: "Victor" }, { id: "Vinny", name: "Vinny" }
    ]
};

const LogoIcon = ({ size = "40", color = "#2563eb" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6C10.5 4.5 7.5 4.5 6 4.5C4.5 4.5 3 5.5 3 7.5V19.5C3 19.5 4.5 18.5 6 18.5C7.5 18.5 10.5 18.5 12 20M12 6C13.5 4.5 16.5 4.5 18 4.5C19.5 4.5 21 5.5 21 7.5V19.5C21 19.5 19.5 18.5 18 18.5C16.5 18.5 13.5 18.5 12 20M12 6V20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 11.5C7.5 12.5 8.5 13.5 10 14M14 14C15.5 13.5 16.5 12.5 17 11.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const Scriptread = () => {
    const [segments, setSegments] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [voiceMap, setVoiceMap] = useState({ Narrator: "Serena" });
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [isBetaUser, setIsBetaUser] = useState(false);

    const audioContext = useRef(null);
    const activeSource = useRef(null);
    const isPlayingRef = useRef(false);
    const segmentRefs = useRef([]);
    const hasGreetedRef = useRef(false);
    
    const API_KEY = import.meta.env.VITE_INWORLD_KEY;
    const TRIAL_LIMIT = 120;
    const MAX_PAGES = 120;

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const promo = params.get('promo')?.toUpperCase();
        if (promo && PROMO_CODES.includes(promo)) {
            setIsUnlocked(true);
            setIsBetaUser(true);
            setShowPaywall(false);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    useEffect(() => {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }, []);

    useEffect(() => {
        if (currentIdx !== -1 && segmentRefs.current[currentIdx]) {
            segmentRefs.current[currentIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentIdx]);

    useEffect(() => {
        if (!isUnlocked && !isBetaUser && totalSeconds >= TRIAL_LIMIT) { 
            stopAudio(); 
            setShowPaywall(true); 
        }
    }, [totalSeconds, isUnlocked, isBetaUser]);

    const handleFirstInteraction = async () => {
        if (hasGreetedRef.current || segments.length > 0) return;
        hasGreetedRef.current = true;
        if (audioContext.current.state === 'suspended') await audioContext.current.resume();
        const greetingText = "Welcome to Script reed Pro. Create professional-sounding read-throughs for less than a cup of coffee.";
        try {
            const buffer = await fetchAudio(greetingText, "Serena");
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            source.start();
        } catch (err) { hasGreetedRef.current = false; }
    };

    const stopAudio = () => {
        isPlayingRef.current = false; setIsPlaying(false);
        if (activeSource.current) { try { activeSource.current.stop(); } catch(e) {} activeSource.current = null; }
    };

    const fetchAudio = async (text, voiceId) => {
        const cleanedText = text
            .replace(/\bEXT\b\.?/gi, "Exterior")
            .replace(/\bINT\b\.?/gi, "Interior")
            .replace(/\bDEE\b/g, "Dee")
            .replace(/\bsugar\b/gi, "shuger")
            .replace(/\bScriptread\b/gi, "Script-reed");

        const response = await fetch("https://api.inworld.ai/tts/v1/voice", {
            method: "POST",
            headers: { "Authorization": `Basic ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: cleanedText, voiceId: voiceId || "Abby", modelId: "inworld-tts-1.5-max" })
        });
        const data = await response.json();
        return await audioContext.current.decodeAudioData(new Uint8Array(atob(data.audioContent).split("").map(c => c.charCodeAt(0))).buffer);
    };

    const auditionVoice = async (voiceId, charName) => {
        if (audioContext.current.state === 'suspended') await audioContext.current.resume();
        const text = `Hello, I'm auditioning for the role of ${charName}.`;
        try {
            const buffer = await fetchAudio(text, voiceId);
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            source.start();
        } catch (e) {}
    };

    const playSegment = async (index) => {
        const hasLock = isUnlocked || isBetaUser;
        if (!isPlayingRef.current || index >= segments.length) return;
        if (!hasLock && totalSeconds >= TRIAL_LIMIT) {
            stopAudio();
            setShowPaywall(true);
            return;
        }
        setCurrentIdx(index);
        const seg = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
        try {
            let buffer = await fetchAudio(seg.text, voice);
            if (!isPlayingRef.current) return;
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            source.onended = () => { 
                setTotalSeconds(prev => prev + buffer.duration); 
                if (isPlayingRef.current) playSegment(index + 1); 
            };
            activeSource.current = source;
            source.start();
        } catch (e) { if(isPlayingRef.current) playSegment(index + 1); }
    };

    const parseScript = (lines) => {
        const finalBlocks = [];
        const foundChars = new Set();
        let actionBuffer = "";
        let newVoiceMap = { Narrator: "Serena" };

        const flushAction = () => {
            if (actionBuffer.trim()) {
                finalBlocks.push({ type: 'narrator', text: actionBuffer.trim() });
                actionBuffer = "";
            }
        };

        lines.forEach((line) => {
            let text = line.text.trim();
            if (!text || /^(\d+|Page \d+|\d+\.)$/i.test(text)) return;
            if (text.startsWith("(") && text.endsWith(")")) return;

            const isAllUpper = text === text.toUpperCase() && /[A-Z]/.test(text);
            const isCharacterPos = line.x > 180 && line.x < 330;
            const isShortName = text.length < 25; 
            const isSceneHeader = text.startsWith("INT") || text.startsWith("EXT") || text.startsWith("FADE") || text.startsWith("CUT");

            if (isAllUpper && isCharacterPos && isShortName && !/ACT|EPISODE|END|TITLE/i.test(text) && !isSceneHeader) {
                flushAction(); 
                const cleanName = text.replace(/\([^)]*\)/g, "").trim();
                if (cleanName) {
                    foundChars.add(cleanName);
                    if (!newVoiceMap[cleanName]) newVoiceMap[cleanName] = "Abby";
                    finalBlocks.push({ type: 'dialogue', character: cleanName, text: "" });
                }
            } 
            else if (line.x > 120 && line.x < 400 && finalBlocks.length > 0 && finalBlocks[finalBlocks.length - 1].type === 'dialogue') {
                const dialogueClean = text.replace(/\([^)]*\)/g, "").trim();
                if (dialogueClean) finalBlocks[finalBlocks.length - 1].text += " " + dialogueClean;
            } 
            else {
                if (isSceneHeader || /ACT|EPISODE|END|FLASHBACK/i.test(text)) {
                    flushAction();
                    finalBlocks.push({ type: 'narrator', text: text });
                } else {
                    if (actionBuffer.length > 0 && !actionBuffer.endsWith("-")) actionBuffer += " ";
                    actionBuffer += text;
                }
            }
        });

        flushAction();
        setVoiceMap(newVoiceMap);
        setCharacters([...foundChars].sort());
        setSegments(finalBlocks.filter(b => b.text && b.text.trim().length > 0));
        setCurrentIdx(-1);
    };

    const masterAndExport = async () => {
        if (!isUnlocked && !isBetaUser) { setShowPaywall(true); return; }
        setIsExporting(true); setExportProgress(0);
        const buffers = [];
        try {
            for (let i = 0; i < segments.length; i++) {
                setExportProgress(Math.round((i / segments.length) * 100));
                const seg = segments[i]; 
                const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
                const buffer = await fetchAudio(seg.text, voice); 
                buffers.push(buffer);
            }
            const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
            const masterBuffer = audioContext.current.createBuffer(1, totalLength, 24000);
            const channelData = masterBuffer.getChannelData(0);
            let offset = 0; 
            buffers.forEach(b => { channelData.set(b.getChannelData(0), offset); offset += b.length; });
            const wavLen = masterBuffer.length * 2; 
            const view = new DataView(new ArrayBuffer(44 + wavLen));
            const writeString = (o, s) => { for (let i=0; i<s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
            writeString(0, 'RIFF'); view.setUint32(4, 36 + wavLen, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
            view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 24000, true);
            view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(36, 'data'); view.setUint32(40, wavLen, true);
            const dataArrArr = masterBuffer.getChannelData(0); let off = 44;
            for (let i=0; i<dataArrArr.length; i++, off+=2) { const s = Math.max(-1, Math.min(1, dataArrArr[i])); view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
            const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' })); link.download = "Scriptread_Master.wav"; link.click();
        } catch (e) {}
        setIsExporting(false);
    };

    const VoiceListOptions = () => (
        <>
            <optgroup label="Narrators">
                {INWORLD_VOICES.narrators.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </optgroup>
            <optgroup label="Custom Cast">
                {INWORLD_VOICES.custom.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </optgroup>
            <optgroup label="Female Voices">
                {INWORLD_VOICES.female.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </optgroup>
            <optgroup label="Male Voices">
                {INWORLD_VOICES.male.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </optgroup>
        </>
    );

    return (
        <div onClick={handleFirstInteraction} className="flex flex-col h-screen w-screen bg-[#f8f9fa] text-[#212529] font-sans overflow-hidden fixed inset-0">
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-lg p-10 text-center">
                    <div className="bg-white border-2 border-black p-12 shadow-[20px_20px_0px_0px_rgba(37,99,235,1)] max-w-xl rounded-3xl">
                        <div className="flex justify-center mb-6"><LogoIcon size="64" /></div>
                        <h2 className="text-4xl font-black uppercase italic mb-6 tracking-tighter">Thank you for listening</h2>
                        <p className="text-lg mb-4 text-gray-700 font-medium">We hope you're enjoying your table read so far.</p>
                        <p className="text-sm mb-10 text-gray-500 leading-relaxed uppercase tracking-tight font-bold">Please consider a small contribution of $2.50 to help us cover the costs of these high-fidelity voices and unlock the full script plus WAV export. We truly appreciate your support.</p>
                        <a href="https://www.paypal.com/ncp/payment/QVTMH7RF7NUBE" target="_blank" className="inline-block bg-blue-600 text-white px-12 py-6 font-black uppercase text-xl rounded-full hover:bg-blue-700 transition-all shadow-xl hover:scale-105 active:scale-95">Support Scriptread Pro</a>
                        <button onClick={() => setShowPaywall(false)} className="block w-full mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Maybe Later</button>
                    </div>
                </div>
            )}
            <header className="h-20 border-b-2 border-black px-10 flex justify-between items-center bg-white shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <LogoIcon size="40" />
                    <h1 className="text-3xl font-black uppercase italic tracking-tight">Scriptread <span className="text-blue-600">Pro</span></h1>
                    {isBetaUser ? (
                        <div className="bg-green-600 text-white px-4 py-1 text-[10px] font-black uppercase rounded-full ml-4 animate-pulse">Beta Access Active</div>
                    ) : (
                        <div className="bg-blue-600 text-white px-3 py-1 text-[10px] font-bold uppercase rounded-full ml-4">Preview: {Math.round(totalSeconds)}s / 120s</div>
                    )}
                </div>
                <div className="flex gap-4">
                    <button onClick={masterAndExport} className={`px-6 py-2 border-2 border-black font-black text-xs uppercase rounded-full transition-all ${(isUnlocked || isBetaUser) ? 'bg-white hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 opacity-50 cursor-not-allowed'}`}>
                        {isExporting ? `Exporting ${exportProgress}%` : "Master WAV"}
                    </button>
                    <label 
                        onClick={(e) => { e.stopPropagation(); handleFirstInteraction(); }} 
                        className="bg-black text-white px-8 py-2 font-black uppercase text-xs rounded-full cursor-pointer hover:bg-gray-800 transition-all shadow-lg"
                    >
                        Load Script <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                            const file = e.target.files[0]; const reader = new FileReader();
                            reader.onload = async () => {
                                const pdf = await window.pdfjsLib.getDocument({ data: reader.result }).promise;
                                const limit = Math.min(pdf.numPages, MAX_PAGES);
                                let lines = [];
                                for (let i = 1; i <= limit; i++) {
                                    const page = await pdf.getPage(i); const content = await page.getTextContent();
                                    content.items.forEach(item => lines.push({ text: item.str, x: item.transform[4] }));
                                }
                                parseScript(lines);
                            }; reader.readAsArrayBuffer(file);
                        }} />
                    </label>
                </div>
            </header>
            <div className="flex-1 flex overflow-hidden">
                <aside className="w-80 bg-white border-r-2 border-gray-100 flex flex-col shrink-0 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">Production Cast</div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                        <div className="p-4 bg-gray-50 rounded-xl border">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-black uppercase text-blue-600">Narrator</p>
                                <button onClick={() => auditionVoice(voiceMap.Narrator, "The Narrator")} className="bg-blue-600 text-white p-1 rounded-full hover:scale-110 active:scale-95 transition-all">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                </button>
                            </div>
                            <select className="w-full bg-white border p-2 font-bold text-xs rounded-lg" value={voiceMap.Narrator} onChange={(e) => setVoiceMap({...voiceMap, Narrator: e.target.value})}>
                                <VoiceListOptions />
                            </select>
                        </div>
                        {characters.map(char => (
                            <div key={char} className="p-4 bg-gray-50 rounded-xl border">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] font-black uppercase text-gray-500">{char}</p>
                                    <button onClick={() => auditionVoice(voiceMap[char] || "Abby", char)} className="bg-gray-800 text-white p-1 rounded-full hover:scale-110 active:scale-95 transition-all">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                    </button>
                                </div>
                                <select className="w-full bg-white border p-2 font-bold text-xs rounded-lg" value={voiceMap[char] || "Abby"} onChange={(e) => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    <VoiceListOptions />
                                </select>
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto bg-[#e9ecef] p-12">
                    <div className="max-w-2xl mx-auto min-h-full flex flex-col">
                        {segments.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 animate-fade-in">
                                <LogoIcon size="120" />
                                <h2 className="text-5xl font-black uppercase italic mb-4 tracking-tighter">Welcome to Scriptread Pro</h2>
                                <p className="text-xl font-bold uppercase italic text-blue-600 tracking-tight mb-12">Create professional-sounding read-throughs for less than a cup of coffee.</p>
                                <div className="animate-pulse flex items-center justify-center gap-3 text-gray-400 font-bold uppercase text-xs tracking-[0.3em]"><div className="h-px w-8 bg-gray-300"></div>Load a PDF to begin<div className="h-px w-8 bg-gray-300"></div></div>
                            </div>
                        ) : (
                            <div className="space-y-6 pb-[50vh]">
                                {segments.map((seg, i) => (
                                    <div key={i} ref={el => segmentRefs.current[i] = el} className={`p-10 bg-white mb-6 rounded-xl border-l-4 ${currentIdx === i ? 'border-blue-600 opacity-100 shadow-xl scale-[1.01]' : 'border-transparent opacity-40'} transition-all duration-300`}>
                                        {seg.type === 'dialogue' && <p className="text-[11px] font-black uppercase mb-4 text-blue-600 tracking-widest">{seg.character}</p>}
                                        <p className="text-xl font-serif text-gray-800 uppercase leading-relaxed">{seg.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <footer className="h-28 border-t-2 border-black bg-white flex justify-center items-center gap-16 shrink-0 z-50">
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.max(0, currentIdx - 1)); }} className="hover:scale-110 transition-transform"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="m11 17-5-5 5-5m7 10-5-5 5-5"/></svg></button>
                <button onClick={() => { if (isPlaying) stopAudio(); else { if (audioContext.current.state === 'suspended') audioContext.current.resume(); isPlayingRef.current = true; setIsPlaying(true); playSegment(currentIdx === -1 ? 0 : currentIdx); } }} className="bg-black text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl">
                    {isPlaying ? <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>}
                </button>
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.min(segments.length - 1, currentIdx + 1)); }} className="hover:scale-110 transition-transform"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="m13 17 5-5-5-5M6 17l5-5-5-5"/></svg></button>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
