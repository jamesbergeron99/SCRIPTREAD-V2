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

    const audioContext = useRef(null);
    const activeSource = useRef(null);
    const isPlayingRef = useRef(false);
    const TRIAL_LIMIT = 30;

    const API_KEY = import.meta.env.VITE_INWORLD_KEY;

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
        isPlayingRef.current = false; 
        setIsPlaying(false);
        if (activeSource.current) { 
            try { activeSource.current.stop(); } catch(e) {} 
            activeSource.current = null; 
        }
    };

    const fetchAudio = async (text, voiceId) => {
        const response = await fetch("https://api.inworld.ai/tts/v1/voice", {
            method: "POST",
            headers: { 
                "Authorization": `Basic ${API_KEY}`, 
                "Content-Type": "application/json" 
            },
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
                finalBlocks.push({ type: 'narrator', text: currentActionText.trim() }); 
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

            if (isSlug) { 
                flushAction(); 
                finalBlocks.push({ type: 'narrator', text }); 
            } else if (isCenteredChar) { 
                flushAction(); 
                foundChars.add(text); 
                finalBlocks.push({ type: 'dialogue', character: text, text: "" }); 
            } else if (line.x > 120 && line.x < 350 && finalBlocks.length > 0 && finalBlocks[finalBlocks.length - 1].type === 'dialogue') {
                finalBlocks[finalBlocks.length - 1].text += " " + text;
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
        try {
            const buffer = await fetchAudio(seg.text, voiceMap[seg.character] || voiceMap.Narrator);
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            source.onended = () => { 
                setTotalSeconds(prev => prev + buffer.duration); 
                if (isPlayingRef.current) playSegment(index + 1); 
            };
            activeSource.current = source; 
            source.start();
        } catch (e) { 
            if(isPlayingRef.current) playSegment(index + 1); 
        }
    };

    return (
        <div className="flex flex-col h-screen relative bg-white text-black font-mono">
            {showPaywall && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white border-[12px] border-black p-10 text-center">
                    <h2 className="text-3xl font-black uppercase italic mb-4">Support Production</h2>
                    <p className="mb-8 max-w-md uppercase italic text-gray-600">The trial has ended. To continue reading with professional AI narration, please donate $2.50 per script read.</p>
                    <a href="https://paypal.me/jamesbergeron1252/2.50" target="_blank" className="bg-black text-white px-10 py-5 font-black uppercase border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:invert transition-all">Donate via PayPal</a>
                    <div className="mt-10 border-t-4 border-black pt-6 w-72">
                        <p className="text-[10px] font-black uppercase mb-2">Unlock Code:</p>
                        <div className="flex gap-2">
                            <input type="text" value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="CODE" className="border-4 border-black p-2 text-xs font-black uppercase outline-none flex-1" />
                            <button onClick={() => { if(inputCode.toUpperCase()==='FRANK2026'){setIsUnlocked(true);setShowPaywall(false);} }} className="bg-black text-white px-4 font-black text-xs uppercase">Enter</button>
                        </div>
                    </div>
                </div>
            )}
            <header className="border-b-4 border-black p-4 flex justify-between items-center bg-white z-50">
                <h1 className="text-2xl font-black uppercase italic">Scriptread</h1>
                <label className="px-6 py-2 bg-black text-white font-black text-[10px] cursor-pointer border-2 border-black uppercase">Load PDF <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                    const file = e.target.files[0]; const reader = new FileReader();
                    reader.onload = async () => {
                        const pdf = await window.pdfjsLib.getDocument({ data: reader.result }).promise;
                        let lines = [];
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i); const content = await page.getTextContent();
                            content.items.forEach(item => lines.push({ text: item.str, x: item.transform[4] }));
                        }
                        parseScript(lines);
                    }; reader.readAsArrayBuffer(file);
                }} /></label>
            </header>
            <div className="flex-1 flex overflow-hidden">
                <aside className="w-64 border-r-4 border-black bg-gray-50 overflow-y-auto">
                    <div className="p-2 bg-black text-white font-black text-[10px] uppercase text-center sticky top-0 italic">Cast</div>
                    <div className="p-4 space-y-6">
                        {characters.map(char => (
                            <div key={char} className="p-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-[9px] font-black uppercase mb-1">{char}</p>
                                <select className="w-full border-2 border-black p-1 text-[10px] font-bold" value={voiceMap[char] || "Abby"} onChange={(e) => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    {INWORLD_VOICES.female.concat(INWORLD_VOICES.male).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto p-8 pb-32">
                    {segments.map((seg, i) => (
                        <div key={i} className={`p-6 border-2 mb-4 transition-all ${currentIdx === i ? 'bg-black text-white' : 'border-black opacity-30'}`}>
                            {seg.type === 'dialogue' && <p className="text-[10px] font-black uppercase mb-1">{seg.character}</p>}
                            <p className="text-sm font-bold uppercase leading-tight">{seg.text}</p>
                        </div>
                    ))}
                </main>
            </div>
            <footer className="shrink-0 border-t-4 border-black p-6 bg-white flex justify-center">
                <button onClick={() => {
                    if (isPlaying) stopAudio();
                    else { if (audioContext.current.state === 'suspended') audioContext.current.resume(); isPlayingRef.current = true; setIsPlaying(true); playSegment(currentIdx === -1 ? 0 : currentIdx); }
                }} className="bg-black text-white px-10 py-4 font-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
                    {isPlaying ? "STOP" : "PLAY"}
                </button>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);