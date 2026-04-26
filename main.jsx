import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

const INWORLD_VOICES = {
    narrators: [{ id: "Serena", name: "Serena" }, { id: "Selene", name: "Selene" }, { id: "default-oglabcjnetcklcq7rghmbw__frank2", name: "Frank" }],
    female: [{ id: "Abby", name: "Abby" }, { id: "Amina", name: "Amina" }, { id: "Ashley", name: "Ashley" }, { id: "Darlene", name: "Darlene" }],
    male: [{ id: "Alex", name: "Alex" }, { id: "Arjun", name: "Arjun" }, { id: "Brandon", name: "Brandon" }, { id: "Brian", name: "Brian" }]
};

const LogoIcon = ({ size = "40" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6C10.5 4.5 7.5 4.5 6 4.5C4.5 4.5 3 5.5 3 7.5V19.5C3 19.5 4.5 18.5 6 18.5C7.5 18.5 10.5 18.5 12 20M12 6C13.5 4.5 16.5 4.5 18 4.5C19.5 4.5 21 5.5 21 7.5V19.5C21 19.5 19.5 18.5 18 18.5C16.5 18.5 13.5 18.5 12 20M12 6V20" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const Scriptread = () => {
    const [segments, setSegments] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [voiceMap, setVoiceMap] = useState({ Narrator: "Serena" });
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isUnlocked, setIsUnlocked] = useState(false);

    const audioContext = useRef(null);
    const activeSource = useRef(null);
    const isPlayingRef = useRef(false);
    const segmentRefs = useRef([]);
    const API_KEY = import.meta.env.VITE_INWORLD_KEY;

    useEffect(() => {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }, []);

    const stopAudio = () => {
        isPlayingRef.current = false; setIsPlaying(false);
        if (activeSource.current) { try { activeSource.current.stop(); } catch(e) {} activeSource.current = null; }
    };

    const fetchAudio = async (text, voiceId) => {
        const cleanedText = text.replace(/\bEXT\b\.?/gi, "Exterior").replace(/\bINT\b\.?/gi, "Interior");
        const response = await fetch("https://api.inworld.ai/tts/v1/voice", {
            method: "POST",
            headers: { "Authorization": `Basic ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: cleanedText, voiceId: voiceId || "Abby", modelId: "inworld-tts-1.5-max" })
        });
        const data = await response.json();
        return await audioContext.current.decodeAudioData(new Uint8Array(atob(data.audioContent).split("").map(c => c.charCodeAt(0))).buffer);
    };

    const playSegment = async (index) => {
        if (!isPlayingRef.current || index >= segments.length) return;
        setCurrentIdx(index);
        const seg = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
        try {
            const buffer = await fetchAudio(seg.text, voice);
            if (!isPlayingRef.current) return;
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            source.onended = () => { if (isPlayingRef.current) playSegment(index + 1); };
            activeSource.current = source;
            source.start();
        } catch (e) { if(isPlayingRef.current) playSegment(index + 1); }
    };

    // --- PARSING FIX: ONLY REAL CHARACTERS ---
    const parseScript = async (lines) => {
        const finalBlocks = [];
        const foundChars = new Set();
        let actionBuffer = "";
        
        const flushAction = () => {
            if (actionBuffer.trim()) {
                finalBlocks.push({ type: 'narrator', text: actionBuffer.trim() });
                actionBuffer = "";
            }
        };

        const invalidPatterns = /^(INT|EXT|INT\/EXT|DAY|NIGHT|MORNING|EVENING|CUT TO|FADE|CLOSE ON|WIDE SHOT|ANGLE ON|THE END|CONTINUED|BACK TO|SCENE|ROOM|KITCHEN|BEDROOM|HALLWAY|SILENCE|MUSIC|SOUND|[\d\.]+$)/i;

        for (let i = 0; i < lines.length; i++) {
            let t = lines[i].text.trim();
            if (!t || /^(\d+|Page \d+)$/i.test(t)) continue;

            const isUpper = t === t.toUpperCase() && /[A-Z]/.test(t);
            const x = lines[i].x || 0;

            let isCharacter = false;
            let cleanName = "";

            // Step 1: Preliminary check (Uppercase + Position)
            if (isUpper && x > 210 && x < 320 && t.length < 25) {
                cleanName = t.replace(/\([^)]*\)/g, "").replace(/[^a-zA-Z0-9\s]/g, "").trim();

                // Step 2: Hard Filter check
                if (!invalidPatterns.test(cleanName)) {
                    // Step 3: Dialogue Lookahead (Scan next 5 lines)
                    for (let j = i + 1; j <= Math.min(i + 5, lines.length - 1); j++) {
                        const nextT = lines[j].text.trim();
                        if (!nextT) continue;
                        const nextX = lines[j].x || 0;
                        const nextIsUpper = nextT === nextT.toUpperCase() && /[A-Z]/.test(nextT);

                        // If we find indented non-uppercase text, it's dialogue
                        if (nextX > 100 && nextX < 450 && !nextIsUpper) {
                            isCharacter = true;
                            break;
                        }
                        // If we hit another centered uppercase block, the first one had no dialogue
                        if (nextIsUpper && nextX > 200) break;
                    }
                }
            }

            if (isCharacter) {
                flushAction();
                foundChars.add(cleanName);
                finalBlocks.push({ type: 'dialogue', character: cleanName, text: "" });
            } else if (x > 100 && x < 450 && finalBlocks.length > 0 && finalBlocks[finalBlocks.length - 1].type === 'dialogue') {
                // Current line is dialogue for the last character
                finalBlocks[finalBlocks.length - 1].text += (finalBlocks[finalBlocks.length - 1].text ? " " : "") + t;
            } else {
                // Everything else is Narrator/Action
                actionBuffer += (actionBuffer ? " " : "") + t;
            }
        }
        flushAction();

        setCharacters(Array.from(foundChars).sort());
        setSegments(finalBlocks.filter(b => b.text.trim().length > 0));
        setCurrentIdx(-1);
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#f8f9fa] text-[#212529] font-sans overflow-hidden fixed inset-0">
            <header className="h-20 border-b-2 border-black px-10 flex justify-between items-center bg-white shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <LogoIcon size="40" />
                    <h1 className="text-3xl font-black uppercase italic tracking-tight">Scriptread <span className="text-blue-600">Pro</span></h1>
                </div>
                <label className="bg-black text-white px-8 py-2 font-black uppercase text-xs rounded-full cursor-pointer shadow-lg hover:bg-gray-800 transition-all">
                    Load Script
                    <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = async () => {
                            const pdf = await window.pdfjsLib.getDocument({ data: reader.result }).promise;
                            let lines = [];
                            for (let i = 1; i <= Math.min(pdf.numPages, 120); i++) {
                                const page = await pdf.getPage(i);
                                const content = await page.getTextContent();
                                content.items.forEach(item => lines.push({ text: item.str, x: item.transform[4] }));
                            }
                            parseScript(lines);
                        };
                        reader.readAsArrayBuffer(file);
                    }} />
                </label>
            </header>
            <div className="flex-1 flex overflow-hidden">
                <aside className="w-80 bg-white border-r-2 border-gray-100 flex flex-col shrink-0">
                    <div className="p-5 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest">Cast List</div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {characters.map(char => (
                            <div key={char} className="p-4 bg-gray-50 rounded-xl border">
                                <p className="text-[10px] font-black uppercase text-gray-500 mb-2">{char}</p>
                                <select className="w-full bg-white border p-2 font-bold text-xs rounded-lg outline-none" onChange={(e) => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    <optgroup label="Female">{INWORLD_VOICES.female.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                    <optgroup label="Male">{INWORLD_VOICES.male.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                </select>
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto bg-[#e9ecef] p-12">
                    <div className="max-w-2xl mx-auto">
                        {segments.map((seg, i) => (
                            <div key={i} ref={el => segmentRefs.current[i] = el} className={`p-10 bg-white mb-6 rounded-xl border-l-4 ${currentIdx === i ? 'border-blue-600 opacity-100 shadow-xl' : 'border-transparent opacity-40'} transition-all duration-300`}>
                                {seg.type === 'dialogue' && <p className="text-[11px] font-black uppercase mb-4 text-blue-600 tracking-widest">{seg.character}</p>}
                                <p className="text-xl font-serif text-gray-800 uppercase leading-relaxed">{seg.text}</p>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
            <footer className="h-28 border-t-2 border-black bg-white flex justify-center items-center shrink-0 z-50">
                <button onClick={() => { if (isPlaying) stopAudio(); else { if (audioContext.current.state === 'suspended') audioContext.current.resume(); isPlayingRef.current = true; setIsPlaying(true); playSegment(currentIdx === -1 ? 0 : currentIdx); } }} className="bg-black text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl font-black">
                    {isPlaying ? "PAUSE" : "PLAY"}
                </button>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
