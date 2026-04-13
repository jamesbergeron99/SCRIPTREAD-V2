import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

const INWORLD_VOICES = {
    narrators: [{ id: "Selene", name: "Selene" }, { id: "default-oglabcjnetcklcq7rghmbw__frank2", name: "Frank" }],
    female: [{ id: "Abby", name: "Abby" }, { id: "Amina", name: "Amina" }, { id: "Victoria", name: "Victoria" }],
    male: [{ id: "Alex", name: "Alex" }, { id: "James", name: "James" }, { id: "Victor", name: "Victor" }]
};

const Scriptread = () => {
    const [segments, setSegments] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [voiceMap, setVoiceMap] = useState({ Narrator: "Selene" });
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const audioContext = useRef(null);
    const activeSource = useRef(null);
    const isPlayingRef = useRef(false);
    const API_KEY = import.meta.env.VITE_INWORLD_KEY;
    const TRIAL_LIMIT = 60;

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'paid') {
            setIsUnlocked(true);
            setShowPaywall(false);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    useEffect(() => {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }, []);

    useEffect(() => {
        if (!isUnlocked && totalSeconds >= TRIAL_LIMIT) { 
            stopAudio(); 
            setShowPaywall(true); 
        }
    }, [totalSeconds, isUnlocked]);

    const stopAudio = () => {
        isPlayingRef.current = false; setIsPlaying(false);
        if (activeSource.current) { try { activeSource.current.stop(); } catch(e) {} activeSource.current = null; }
    };

    const fetchAudio = async (text, voiceId) => {
        const response = await fetch("https://api.inworld.ai/tts/v1/voice", {
            method: "POST",
            headers: { "Authorization": `Basic ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text, voiceId: voiceId || "Abby", modelId: "inworld-tts-1.5-max" })
        });
        const data = await response.json();
        return await audioContext.current.decodeAudioData(new Uint8Array(atob(data.audioContent).split("").map(c => c.charCodeAt(0))).buffer);
    };

    const parseScript = (lines) => {
        const finalBlocks = [];
        const foundChars = new Set();
        let currentActionText = "";

        // Words that the Narrator SHOULD read but should NEVER be "Characters"
        const narratorTechnical = /^(ACT|FADE|CUT\sTO|DISSOLVE|EPISODE|TITLE|WRITTEN|BY)/i;
        // Words to ignore entirely (Page info, system markers)
        const ignoreEntirely = /^(MORE|CONTINUED|CONT'D|PAGE|\.)$/i;

        const flushAction = () => { 
            if (currentActionText.trim()) { 
                let txt = currentActionText.trim();
                // STRIP EVERYTHING IN PARENTHESES
                txt = txt.replace(/\([^)]*\)/g, "").trim();
                
                // If text exists and isn't just a page number, Narrator reads it
                if (txt && !/^\d+$/.test(txt) && !ignoreEntirely.test(txt)) {
                    finalBlocks.push({ type: 'narrator', text: txt });
                }
                currentActionText = ""; 
            } 
        };

        lines.forEach(line => {
            let text = line.text.trim();
            
            // 1. KILL PAGE NUMBERS IMMEDIATELY
            if (!text || /^\d+$/.test(text) || ignoreEntirely.test(text)) return;
            
            // 2. DETECT SLUGS
            const isSlug = text.startsWith("INT") || text.startsWith("EXT") || text.startsWith("Interior") || text.startsWith("Exterior");
            
            // 3. DETECT CHARACTERS: Centered, Caps, Not a Slug, Not an Act Break/Fade
            const isCharacter = line.x > 180 && 
                                text === text.toUpperCase() && 
                                !isSlug && 
                                !narratorTechnical.test(text) &&
                                !ignoreEntirely.test(text);

            if (isSlug) { 
                flushAction(); 
                finalBlocks.push({ type: 'narrator', text: text.replace(/\bINT\b\.?/gi, "Interior").replace(/\bEXT\b\.?/gi, "Exterior") }); 
            } else if (isCharacter) { 
                flushAction(); 
                const cleanChar = text.replace(/\([^)]*\)/g, "").trim();
                if (cleanChar && !/^\d+$/.test(cleanChar)) {
                    foundChars.add(cleanChar); 
                    finalBlocks.push({ type: 'dialogue', character: cleanChar, text: "" }); 
                }
            } else if (line.x > 120 && line.x < 350 && finalBlocks.length > 0 && finalBlocks[finalBlocks.length - 1].type === 'dialogue') {
                // Characters read dialogue but skip notes in parentheses
                const dialogueClean = text.replace(/\([^)]*\)/g, "").trim();
                if (dialogueClean) finalBlocks[finalBlocks.length - 1].text += " " + dialogueClean;
            } else { 
                currentActionText += " " + text; 
            }
        });
        flushAction();
        setCharacters([...foundChars].sort());
        setSegments(finalBlocks.filter(b => b.text.trim().length > 0));
    };

    const playSegment = async (index) => {
        if (!isPlayingRef.current || index >= segments.length || (!isUnlocked && totalSeconds >= TRIAL_LIMIT)) return;
        setCurrentIdx(index);
        const seg = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
        try {
            const buffer = await fetchAudio(seg.text, voice);
            if (!isPlayingRef.current) return;
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer; source.connect(audioContext.current.destination);
            source.onended = () => { setTotalSeconds(prev => prev + buffer.duration); if (isPlayingRef.current) playSegment(index + 1); };
            activeSource.current = source; source.start();
        } catch (e) { if(isPlayingRef.current) playSegment(index + 1); }
    };

    const masterAndExport = async () => {
        if (!isUnlocked) { setShowPaywall(true); return; }
        setIsExporting(true); setExportProgress(0);
        const buffers = [];
        try {
            for (let i = 0; i < segments.length; i++) {
                setExportProgress(Math.round((i / segments.length) * 100));
                const voice = segments[i].type === 'narrator' ? voiceMap.Narrator : (voiceMap[segments[i].character] || "Abby");
                const buffer = await fetchAudio(segments[i].text, voice);
                buffers.push(buffer);
            }
            const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
            const masterBuffer = audioContext.current.createBuffer(1, totalLength, 24000);
            const channelData = masterBuffer.getChannelData(0);
            let offset = 0; buffers.forEach(b => { channelData.set(b.getChannelData(0), offset); offset += b.length; });
            
            const wavLen = masterBuffer.length * 2; const view = new DataView(new ArrayBuffer(44 + wavLen));
            const writeString = (o, s) => { for (let i=0; i<s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
            writeString(0, 'RIFF'); view.setUint32(4, 36 + wavLen, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
            view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 24000, true);
            view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(36, 'data'); view.setUint32(40, wavLen, true);
            const dataArr = masterBuffer.getChannelData(0); let off = 44;
            for (let i=0; i<dataArr.length; i++, off+=2) { const s = Math.max(-1, Math.min(1, dataArr[i])); view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
            
            const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
            link.download = "Scriptread_Master.wav"; link.click();
        } catch (e) {}
        setIsExporting(false);
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-white text-black font-mono overflow-hidden fixed inset-0">
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white border-[16px] border-black p-10 text-center">
                    <h2 className="text-4xl font-black uppercase italic mb-6 tracking-tighter">Purchase Full Table Read</h2>
                    <p className="text-sm mb-10 max-w-md uppercase italic text-gray-600 leading-tight tracking-tight">The 60-second trial is over. Purchase the full read and High-Fidelity Export for $2.50.</p>
                    <a href="https://www.paypal.com/ncp/payment/QVTMH7RF7NUBE" target="_blank" className="bg-black text-white px-12 py-6 font-black uppercase text-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:invert transition-all">Pay $2.50 via PayPal</a>
                </div>
            )}

            <header className="h-24 border-b-8 border-black px-8 flex justify-between items-center bg-white shrink-0 z-50">
                <div className="flex items-center gap-8">
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter">Scriptread</h1>
                    {!isUnlocked && <div className="bg-yellow-400 border-4 border-black px-4 py-1 text-xs font-black uppercase italic">Trial: {Math.round(totalSeconds)}s / 60s</div>}
                </div>
                <div className="flex gap-4">
                    <button onClick={masterAndExport} className={`px-6 py-2 border-[4px] border-black font-black text-[11px] hover:bg-black hover:text-white transition-all uppercase italic ${isUnlocked ? 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 opacity-50'}`}>
                        {isExporting ? `Exporting ${exportProgress}%` : "Master & Export Wav"}
                    </button>
                    <label className="bg-black text-white px-8 py-2 font-black uppercase text-xs cursor-pointer border-4 border-black hover:invert transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        Load Script <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                            const file = e.target.files[0]; const reader = new FileReader();
                            reader.onload = async () => {
                                const pdf = await window.pdfjsLib.getDocument({ data: reader.result }).promise;
                                let lines = [];
                                for (let i = 1; i <= pdf.numPages; i++) {
                                    const page = await pdf.getPage(i); const content = await page.getTextContent();
                                    content.items.forEach(item => lines.push({ text: item.str, x: item.transform[4] }));
                                }
                                parseScript(lines); setTotalSeconds(0); setCurrentIdx(-1);
                            }; reader.readAsArrayBuffer(file);
                        }} />
                    </label>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-80 border-r-8 border-black bg-gray-50 flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 bg-black text-white font-black uppercase text-center italic tracking-widest text-sm">Cast List</div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        <div className="border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 italic">Narrator</p>
                            <select className="w-full border-2 border-black p-2 font-bold text-xs bg-white outline-none" value={voiceMap.Narrator} onChange={(e) => setVoiceMap({...voiceMap, Narrator: e.target.value})}>
                                {Object.values(INWORLD_VOICES).flat().map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        {characters.map(char => (
                            <div key={char} className="border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-[10px] font-black uppercase mb-2 tracking-tight">{char}</p>
                                <select className="w-full border-2 border-black p-2 font-bold text-xs bg-white outline-none" value={voiceMap[char] || "Abby"} onChange={(e) => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    {Object.values(INWORLD_VOICES).flat().map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto bg-white p-16 custom-scrollbar">
                    <div className="max-w-3xl mx-auto">
                        {segments.map((seg, i) => (
                            <div key={i} className={`p-10 border-4 mb-10 transition-all duration-300 ${currentIdx === i ? 'bg-black text-white scale-[1.02] shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]' : 'border-black opacity-20'}`}>
                                {seg.type === 'dialogue' && <p className="text-xs font-black uppercase mb-3 italic tracking-widest">{seg.character}</p>}
                                <p className="text-xl font-bold uppercase leading-tight tracking-tight">{seg.text}</p>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            <footer className="h-32 border-t-8 border-black bg-white flex justify-center items-center gap-20 shrink-0 z-50">
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.max(0, currentIdx - 1)); }}><svg width="48" height="48" viewBox="0 0 24 24" fill="black"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg></button>
                <button onClick={() => {
                    if (isPlaying) stopAudio();
                    else { if (audioContext.current.state === 'suspended') audioContext.current.resume(); isPlayingRef.current = true; setIsPlaying(true); playSegment(currentIdx === -1 ? 0 : currentIdx); }
                }} className="bg-black text-white p-8 rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-1 transition-all">
                    {isPlaying ? <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                </button>
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.min(segments.length - 1, currentIdx + 1)); }}><svg width="48" height="48" viewBox="0 0 24 24" fill="black"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg></button>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
