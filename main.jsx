import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

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
    const [inputCode, setInputCode] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const audioContext = useRef(null);
    const activeSource = useRef(null);
    const isPlayingRef = useRef(false);
    const API_KEY = import.meta.env.VITE_INWORLD_KEY;

    useEffect(() => {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }, []);

    useEffect(() => {
        if (!isUnlocked && totalSeconds >= 30) { 
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
            body: JSON.stringify({ text, voiceId, modelId: "inworld-tts-1.5-max" })
        });
        const data = await response.json();
        return await audioContext.current.decodeAudioData(new Uint8Array(atob(data.audioContent).split("").map(c => c.charCodeAt(0))).buffer);
    };

    const parseScript = (lines) => {
        const finalBlocks = [];
        const foundChars = new Set();
        let currentActionText = "";
        const flushAction = () => { 
            if (currentActionText.trim()) { 
                const txt = currentActionText.trim();
                if (!/^(ACT|END\sOF\sACT|SCENE|PAGE)/i.test(txt)) finalBlocks.push({ type: 'narrator', text: txt });
                currentActionText = ""; 
            } 
        };

        lines.forEach(line => {
            let text = line.text.trim();
            if (!text || /^\d+$/.test(text) || /^PAGE\s+\d+$/i.test(text)) return;
            text = text.replace(/\bINT\b\.?/gi, "Interior").replace(/\bEXT\b\.?/gi, "Exterior");
            text = text.replace(/\([^)]*\)/g, "").trim();
            if (!text) return;

            const isSlug = text.startsWith("Interior") || text.startsWith("Exterior");
            const isCenteredChar = line.x > 180 && text === text.toUpperCase() && text.length < 30 && !isSlug;

            if (isSlug) { flushAction(); finalBlocks.push({ type: 'narrator', text }); }
            else if (isCenteredChar) { flushAction(); foundChars.add(text); finalBlocks.push({ type: 'dialogue', character: text, text: "" }); }
            else if (line.x > 120 && line.x < 350 && finalBlocks.length > 0 && finalBlocks[finalBlocks.length - 1].type === 'dialogue') {
                finalBlocks[finalBlocks.length - 1].text += " " + text;
            } else { currentActionText += " " + text; }
        });
        flushAction();
        setCharacters([...foundChars].sort());
        setSegments(finalBlocks.filter(b => b.text.trim().length > 0));
    };

    const playSegment = async (index) => {
        if (!isPlayingRef.current || index >= segments.length || (!isUnlocked && totalSeconds >= 30)) return;
        setCurrentIdx(index);
        const seg = segments[index];
        try {
            const buffer = await fetchAudio(seg.text, voiceMap[seg.character] || voiceMap.Narrator);
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
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
                const buffer = await fetchAudio(segments[i].text, segments[i].type === 'narrator' ? voiceMap.Narrator : (voiceMap[segments[i].character] || "Abby"));
                buffers.push(buffer);
            }
            const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
            const masterBuffer = audioContext.current.createBuffer(1, totalLength, 24000);
            const channelData = masterBuffer.getChannelData(0);
            let offset = 0; buffers.forEach(b => { channelData.set(b.getChannelData(0), offset); offset += b.length; });
            const wavData = encodeWav(masterBuffer);
            const link = document.createElement('a'); 
            link.href = URL.createObjectURL(new Blob([wavData], { type: 'audio/wav' }));
            link.download = "Scriptread_Master.wav"; link.click();
        } catch (e) {}
        setIsExporting(false);
    };

    const encodeWav = (buffer) => {
        const length = buffer.length * 2; const view = new DataView(new ArrayBuffer(44 + length));
        const writeString = (o, s) => { for (let i=0; i<s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
        writeString(0, 'RIFF'); view.setUint32(4, 36 + length, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 24000, true);
        view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(36, 'data'); view.setUint32(40, length, true);
        const data = buffer.getChannelData(0); let offset = 44;
        for (let i=0; i<data.length; i++, offset+=2) { const s = Math.max(-1, Math.min(1, data[i])); view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
        return view.buffer;
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-white text-black overflow-hidden fixed inset-0">
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white border-[16px] border-black p-10 text-center">
                    <h2 className="text-4xl font-black uppercase italic mb-6">Support Production</h2>
                    <p className="text-sm mb-10 max-w-md uppercase italic text-gray-600">The trial has ended. To continue reading with professional AI narration, please donate $2.50 per script read.</p>
                    <a href="https://paypal.me/jamesbergeron1252/2.50" target="_blank" className="bg-black text-white px-12 py-6 font-black uppercase text-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:invert transition-all">Donate $2.50 via PayPal</a>
                    <div className="mt-12 border-t-8 border-black pt-8 w-80">
                        <input type="text" value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="ENTER CODE" className="w-full border-4 border-black p-3 text-center font-black uppercase mb-4 outline-none" />
                        <button onClick={() => { if(inputCode.toUpperCase()==='FRANK2026'){setIsUnlocked(true);setShowPaywall(false);} }} className="w-full bg-black text-white py-4 font-black uppercase">Unlock Studio</button>
                    </div>
                </div>
            )}

            <header className="h-24 border-b-8 border-black px-8 flex justify-between items-center bg-white shrink-0 z-50">
                <div className="flex items-center gap-8">
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter">Scriptread</h1>
                    {!isUnlocked && <div className="bg-yellow-400 border-4 border-black px-4 py-1 text-xs font-black uppercase italic">Trial: {Math.round(totalSeconds)}s / 30s</div>}
                </div>
                <div className="flex gap-4">
                    <button onClick={masterAndExport} className="px-6 py-2 border-[4px] border-black font-black text-[11px] hover:bg-black hover:text-white transition-all uppercase italic">
                        {isExporting ? `Exporting ${exportProgress}%` : "Master & Export"}
                    </button>
                    <label className="bg-black text-white px-8 py-2 font-black uppercase text-xs cursor-pointer border-4 border-black hover:invert transition-all">
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
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Narrator</p>
                            <select className="w-full border-2 border-black p-2 font-bold text-xs bg-white outline-none" value={voiceMap.Narrator} onChange={(e) => setVoiceMap({...voiceMap, Narrator: e.target.value})}>
                                {INWORLD_VOICES.female.concat(INWORLD_VOICES.male).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        {characters.map(char => (
                            <div key={char} className="border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-[10px] font-black uppercase mb-2">{char}</p>
                                <select className="w-full border-2 border-black p-2 font-bold text-xs bg-white outline-none" value={voiceMap[char] || "Abby"} onChange={(e) => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    {INWORLD_VOICES.female.concat(INWORLD_VOICES.male).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
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
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.max(0, currentIdx - 1)); }} className="hover:scale-125 transition-transform"><svg width="48" height="48" viewBox="0 0 24 24" fill="black"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg></button>
                <button onClick={() => {
                    if (isPlaying) stopAudio();
                    else { if (audioContext.current.state === 'suspended') audioContext.current.resume(); isPlayingRef.current = true; setIsPlaying(true); playSegment(currentIdx === -1 ? 0 : currentIdx); }
                }} className="bg-black text-white p-8 rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-1 transition-all">
                    {isPlaying ? <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                </button>
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.min(segments.length - 1, currentIdx + 1)); }} className="hover:scale-125 transition-transform"><svg width="48" height="48" viewBox="0 0 24 24" fill="black"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg></button>
            </footer>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Scriptread />);
