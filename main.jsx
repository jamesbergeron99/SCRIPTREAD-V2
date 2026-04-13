import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

const INWORLD_VOICES = {
    narrators: [
        { id: "Selene", name: "Selene" },
        { id: "default-oglabcjnetcklcq7rghmbw__frank2", name: "Frank" }
    ],
    female: [
        { id: "Abby", name: "Abby" }, { id: "Amina", name: "Amina" }, { id: "Anjali", name: "Anjali" }, { id: "Ashley", name: "Ashley" }, { id: "Bianca", name: "Bianca" }, { id: "Celeste", name: "Celeste" }, { id: "Chloe", name: "Chloe" }, { id: "Claire", name: "Claire" }, { id: "Darlene", name: "Darlene" }, { id: "Deborah", name: "Deborah" }, { id: "Eleanor", name: "Eleanor" }, { id: "Evelyn", name: "Evelyn" }, { id: "Hana", name: "Hana" }, { id: "Jessica", name: "Jessica" }, { id: "Kelsey", name: "Kelsey" }, { id: "Lauren", name: "Lauren" }, { id: "Leda", name: "Leda" }, { id: "Loretta", name: "Loretta" }, { id: "Luna", name: "Luna" }, { id: "Marlene", name: "Marlene" }, { id: "Mia", name: "Mia" }, { id: "Miranda", name: "Miranda" }, { id: "Nadia", name: "Nadia" }, { id: "Naomi", name: "Naomi" }, { id: "Olivia", name: "Olivia" }, { id: "Pippa", name: "Pippa" }, { id: "Pixie", name: "Pixie" }, { id: "Riley", name: "Riley" }, { id: "Saanvi", name: "Saanvi" }, { id: "Sarah", name: "Sarah" }, { id: "Serena", name: "Serena" }, { id: "Sophie", name: "Sophie" }, { id: "Tessa", name: "Tessa" }, { id: "Veronica", name: "Veronica" }, { id: "Victoria", name: "Victoria" }
    ],
    male: [
        { id: "Alex", name: "Alex" }, { id: "Arjun", name: "Arjun" }, { id: "Avery", name: "Avery" }, { id: "Blake", name: "Blake" }, { id: "Brandon", name: "Brandon" }, { id: "Brian", name: "Brian" }, { id: "Callum", name: "Callum" }, { id: "Carter", name: "Carter" }, { id: "Cedric", name: "Cedric" }, { id: "Clive", name: "Clive" }, { id: "Conrad", name: "Conrad" }, { id: "Damon", name: "Damon" }, { id: "Dennis", name: "Dennis" }, { id: "Derek", name: "Derek" }, { id: "Dominus", name: "Dominus" }, { id: "Duncan", name: "Duncan" }, { id: "Edward", name: "Edward" }, { id: "Elliott", name: "Elliott" }, { id: "Ethan", name: "Ethan" }, { id: "Evan", name: "Evan" }, { id: "Felix", name: "Felix" }, { id: "Gareth", name: "Gareth" }, { id: "Graham", name: "Graham" }, { id: "Hamish", name: "Hamish" }, { id: "Hank", name: "Hank" }, { id: "James", name: "James" }, { id: "Jason", name: "Jason" }, { id: "Jonah", name: "Jonah" }, { id: "Levi", name: "Levi" }, { id: "Liam", name: "Liam" }, { id: "Lucian", name: "Lucian" }, { id: "Malcolm", name: "Malcolm" }, { id: "Marcus", name: "Marcus" }, { id: "Mark", name: "Mark" }, { id: "Nate", name: "Nate" }, { id: "Oliver", name: "Oliver" }, { id: "Reed", name: "Reed" }, { id: "Rupert", name: "Rupert" }, { id: "Sebastian", name: "Sebastian" }, { id: "Simon", name: "Simon" }, { id: "Timothy", name: "Timothy" }, { id: "Trevor", name: "Trevor" }, { id: "Tristan", name: "Tristan" }, { id: "Tyler", name: "Tyler" }, { id: "Victor", name: "Victor" }, { id: "Vinny", name: "Vinny" }
    ]
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
    const preloadedAudio = useRef({});
    const API_KEY = import.meta.env.VITE_INWORLD_KEY;
    const TRIAL_LIMIT = 60;

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'paid' || params.get('promo') === 'JIMMYB') {
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

    const autoAssignVoice = (name) => {
        const femaleNames = ["DEE", "D", "ABBY", "AMINA", "BIANCA", "CHLOE", "CLAIRE", "DARLENE", "DEBORAH", "ELEANOR", "EVELYN", "HANA", "JESSICA", "SARAH", "VICTORIA", "MIA", "LUNA", "SOPHIE", "TESSA"];
        const maleNames = ["FRANK", "ALEX", "BRANDON", "BRIAN", "CALLUM", "CARTER", "CEDRIC", "CLIVE", "CONRAD", "DAMON", "DENNIS", "DEREK", "ETHAN", "EVAN", "FELIX", "JAMES", "JASON", "SIMON", "VICTOR"];
        
        const upperName = name.toUpperCase();
        if (femaleNames.some(n => upperName === n || upperName.includes(n))) {
            return INWORLD_VOICES.female[Math.floor(Math.random() * INWORLD_VOICES.female.length)].id;
        }
        if (maleNames.some(n => upperName === n || upperName.includes(n))) {
            return INWORLD_VOICES.male[Math.floor(Math.random() * INWORLD_VOICES.male.length)].id;
        }
        return "Abby"; 
    };

    const fetchAudio = async (text, voiceId) => {
        const cleanedText = text.replace(/\bDEE\b/g, "Dee").replace(/\bsugar\b/gi, "shuger");

        const response = await fetch("https://api.inworld.ai/tts/v1/voice", {
            method: "POST",
            headers: { "Authorization": `Basic ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ 
                text: cleanedText, 
                voiceId: voiceId || "Abby", 
                modelId: "inworld-tts-1.5-max" 
            })
        });
        
        if (!response.ok) throw new Error("Audio fetch failed");
        const data = await response.json();
        return await audioContext.current.decodeAudioData(new Uint8Array(atob(data.audioContent).split("").map(c => c.charCodeAt(0))).buffer);
    };

    const preloadNext = async (index) => {
        if (index >= segments.length || preloadedAudio.current[index]) return;
        const seg = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
        try {
            const buffer = await fetchAudio(seg.text, voice);
            preloadedAudio.current[index] = buffer;
        } catch (e) {}
    };

    const playSegment = async (index) => {
        if (!isPlayingRef.current || index >= segments.length || (!isUnlocked && totalSeconds >= TRIAL_LIMIT)) return;
        setCurrentIdx(index);
        
        const seg = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");

        try {
            let buffer = preloadedAudio.current[index] || await fetchAudio(seg.text, voice);
            delete preloadedAudio.current[index]; 

            if (!isPlayingRef.current) return;

            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = 1.05; 
            source.connect(audioContext.current.destination);
            
            source.onended = () => { 
                setTotalSeconds(prev => prev + (buffer.duration / 1.05)); 
                if (isPlayingRef.current) playSegment(index + 1); 
            };

            activeSource.current = source;
            source.start();

            preloadNext(index + 1);
            preloadNext(index + 2);

        } catch (e) {
            if(isPlayingRef.current) playSegment(index + 1); 
        }
    };

    const parseScript = (lines) => {
        const finalBlocks = [];
        const foundChars = new Set();
        let currentActionText = "";
        let hasHitFirstSlug = false;
        let newVoiceMap = { Narrator: "Selene" };

        const narratorTechnical = /^(ACT|FADE|CUT|DISSOLVE|EPISODE|TITLE|WRITTEN|BY|END\sACT|END\sOF|COLD\sOPEN|CANDYLAND|PART)/i;
        const systemJunk = /^(MORE|CONTINUED|CONT'D|PAGE|\.)$/i;

        const flushAction = () => { 
            if (currentActionText.trim()) { 
                let txt = currentActionText.trim().replace(/\([^)]*\)/g, "").trim();
                if (txt && !/^\d+$/.test(txt) && !systemJunk.test(txt)) {
                    finalBlocks.push({ type: 'narrator', text: txt });
                }
                currentActionText = ""; 
            } 
        };

        lines.forEach((line) => {
            let text = line.text.trim();
            if (!text || (/^\d+$/.test(text) && !narratorTechnical.test(text)) || systemJunk.test(text)) return;
            const isSlug = text.startsWith("INT") || text.startsWith("EXT") || text.startsWith("Interior") || text.startsWith("Exterior");
            if (isSlug) hasHitFirstSlug = true;
            const isTechnical = narratorTechnical.test(text) || (text.startsWith('"') && text.endsWith('"'));
            
            if (!hasHitFirstSlug) {
                const cleanIntro = text.replace(/\([^)]*\)/g, "").trim();
                if (cleanIntro) finalBlocks.push({ type: 'narrator', text: cleanIntro });
                return;
            }

            if (isSlug || isTechnical) { 
                flushAction(); 
                finalBlocks.push({ type: 'narrator', text: text.replace(/\([^)]*\)/g, "").trim() }); 
            } else if (line.x > 180 && text === text.toUpperCase() && /[A-Z]/.test(text) && !text.includes('"') && !isSlug && !isTechnical) { 
                flushAction(); 
                const cleanName = text.replace(/\([^)]*\)/g, "").trim();
                if (cleanName && !/^\d+$/.test(cleanName)) {
                    foundChars.add(cleanName); 
                    if (!newVoiceMap[cleanName]) newVoiceMap[cleanName] = autoAssignVoice(cleanName);
                    finalBlocks.push({ type: 'dialogue', character: cleanName, text: "" }); 
                }
            } else if (line.x > 120 && line.x < 350 && finalBlocks.length > 0 && finalBlocks[finalBlocks.length - 1].type === 'dialogue') {
                const dialogueClean = text.replace(/\([^)]*\)/g, "").trim();
                if (dialogueClean) finalBlocks[finalBlocks.length - 1].text += " " + dialogueClean;
            } else { 
                currentActionText += " " + text; 
            }
        });
        flushAction();
        setVoiceMap(newVoiceMap);
        setCharacters([...foundChars].sort());
        setSegments(finalBlocks.filter(b => b.text.trim().length > 0));
        preloadedAudio.current = {}; 
    };

    const masterAndExport = async () => {
        if (!isUnlocked) { setShowPaywall(true); return; }
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
            let offset = 0; buffers.forEach(b => { channelData.set(b.getChannelData(0), offset); offset += b.length; });
            const wavLen = masterBuffer.length * 2; const view = new DataView(new ArrayBuffer(44 + wavLen));
            const writeString = (o, s) => { for (let i=0; i<s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
            writeString(0, 'RIFF'); view.setUint32(4, 36 + wavLen, true); writeString(8, 'WAVE'); writeString(12, 'fmt ');
            view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 24000, true);
            view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(36, 'data'); view.setUint32(40, wavLen, true);
            const dataArrArr = masterBuffer.getChannelData(0); let off = 44;
            for (let i=0; i<dataArrArr.length; i++, off+=2) { const s = Math.max(-1, Math.min(1, dataArrArr[i])); view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
            const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
            link.download = "Scriptread_Master.wav"; link.click();
        } catch (e) {}
        setIsExporting(false);
    };

    const VoiceListOptions = () => (
        <>
            <optgroup label="Narrators">{INWORLD_VOICES.narrators.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
            <optgroup label="Female">{INWORLD_VOICES.female.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
            <optgroup label="Male">{INWORLD_VOICES.male.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
        </>
    );

    return (
        <div className="flex flex-col h-screen w-screen bg-white text-black font-mono overflow-hidden fixed inset-0">
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white border-[16px] border-black p-10 text-center">
                    <h2 className="text-4xl font-black uppercase italic mb-6 tracking-tighter">Purchase Full Table Read</h2>
                    <p className="text-sm mb-10 max-w-md uppercase italic text-gray-600 leading-tight tracking-tight">Full read and export for $2.50.</p>
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
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-black uppercase text-gray-400">Narrator</p>
                                <button onClick={async () => { 
                                    if (audioContext.current.state === 'suspended') await audioContext.current.resume(); 
                                    const b = await fetchAudio(`Hello, I'm auditioning for the narrator.`, voiceMap.Narrator); 
                                    const s = audioContext.current.createBufferSource(); s.buffer = b; s.connect(audioContext.current.destination); s.start(); 
                                }} className="text-[9px] font-black underline uppercase">Hear</button>
                            </div>
                            <select className="w-full border-2 border-black p-2 font-bold text-xs bg-white outline-none" value={voiceMap.Narrator} onChange={(e) => setVoiceMap({...voiceMap, Narrator: e.target.value})}>
                                <VoiceListOptions />
                            </select>
                        </div>
                        {characters.map(char => (
                            <div key={char} className="border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] font-black uppercase tracking-tight">{char}</p>
                                    <button onClick={async () => { 
                                        if (audioContext.current.state === 'suspended') await audioContext.current.resume(); 
                                        const b = await fetchAudio(`Hello, I'm auditioning for the voice of ${char}.`, voiceMap[char] || "Abby"); 
                                        const s = audioContext.current.createBufferSource(); s.buffer = b; s.connect(audioContext.current.destination); s.start(); 
                                    }} className="text-[9px] font-black underline uppercase">Hear</button>
                                </div>
                                <select className="w-full border-2 border-black p-2 font-bold text-xs bg-white outline-none" value={voiceMap[char] || "Abby"} onChange={(e) => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    <VoiceListOptions />
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
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.min(segments.length - 1, currentIdx + 1)); }}><svg width="48" height="48" viewBox="0 0 24 24" fill="black"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg></button>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
