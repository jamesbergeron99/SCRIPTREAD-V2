import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

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
    const [totalSeconds, setTotalSeconds] = useState(0);

    const audioContext = useRef(null);
    const activeSource = useRef(null);
    const isPlayingRef = useRef(false);
    const segmentRefs = useRef([]);
    const hasGreetedRef = useRef(false);
    const prefetchBuffer = useRef(null);
    
    const API_KEY = import.meta.env.VITE_INWORLD_KEY;

    useEffect(() => {
        const handleFirstClick = () => handleFirstInteraction();
        window.addEventListener('mousedown', handleFirstClick);
        return () => window.removeEventListener('mousedown', handleFirstClick);
    }, []);

    useEffect(() => {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }, []);

    useEffect(() => {
        if (currentIdx !== -1 && segmentRefs.current[currentIdx]) {
            segmentRefs.current[currentIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentIdx]);

    const handleFirstInteraction = async () => {
        if (hasGreetedRef.current) return;
        hasGreetedRef.current = true;
        if (audioContext.current.state === 'suspended') await audioContext.current.resume();
        const msg = "Welcome back to Script read. Standard formatting and stable audio flow restored.";
        try {
            const buffer = await fetchAudio(msg, "Serena");
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            source.start();
        } catch (err) { hasGreetedRef.current = false; }
    };

    const stopAudio = () => {
        isPlayingRef.current = false; setIsPlaying(false);
        prefetchBuffer.current = null;
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

    const playSegment = async (index) => {
        if (!isPlayingRef.current || index >= segments.length) return;

        setCurrentIdx(index);
        const seg = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");

        try {
            let buffer = prefetchBuffer.current || await fetchAudio(seg.text, voice);
            prefetchBuffer.current = null; 

            if (!isPlayingRef.current) return;

            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            
            if (index + 1 < segments.length) {
                const nxt = segments[index + 1];
                const nxtV = nxt.type === 'narrator' ? voiceMap.Narrator : (voiceMap[nxt.character] || "Abby");
                fetchAudio(nxt.text, nxtV).then(b => { prefetchBuffer.current = b; });
            }

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
        let newVoiceMap = { Narrator: "Serena" };
        let actionBuffer = "";

        const flushAction = () => {
            if (actionBuffer.trim()) {
                finalBlocks.push({ type: 'narrator', text: actionBuffer.trim() });
                actionBuffer = "";
            }
        };

        lines.forEach((line, i) => {
            let text = line.text.trim();
            if (!text || /^(\d+|Page \d+|\d+\.)$/i.test(text)) return;
            if (text.startsWith("(") && text.endsWith(")")) return;

            const isAllUpper = text === text.toUpperCase() && /[A-Z]/.test(text);
            const xPos = line.x || 0;

            if (isAllUpper && xPos > 180 && xPos < 330 && text.length < 25 && !/ACT|EPISODE|END|TITLE/i.test(text)) {
                flushAction();
                const cleanName = text.replace(/\([^)]*\)/g, "").trim();
                if (cleanName) {
                    foundChars.add(cleanName);
                    if (!newVoiceMap[cleanName]) {
                        const gender = (/[aeiouy]$/i.test(cleanName)) ? 'female' : 'male';
                        newVoiceMap[cleanName] = INWORLD_VOICES[gender][0].id;
                    }
                    finalBlocks.push({ type: 'dialogue', character: cleanName, text: "" });
                }
            } 
            else if (xPos > 120 && xPos < 400 && finalBlocks.length > 0 && finalBlocks[finalBlocks.length - 1].type === 'dialogue') {
                finalBlocks[finalBlocks.length - 1].text += (finalBlocks[finalBlocks.length - 1].text ? " " : "") + text;
            } 
            else if (text.startsWith("INT") || text.startsWith("EXT") || text.includes("Written by") || text.includes("FADE")) {
                flushAction();
                finalBlocks.push({ type: 'narrator', text: text });
            }
            else {
                actionBuffer += (actionBuffer ? " " : "") + text;
            }
        });

        flushAction();
        setVoiceMap(newVoiceMap);
        setCharacters([...foundChars].sort());
        setSegments(finalBlocks.filter(b => b.text && b.text.trim().length > 0));
        setCurrentIdx(-1);
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#f8f9fa] font-sans overflow-hidden fixed inset-0">
            <header className="h-20 border-b-2 border-black px-10 flex justify-between items-center bg-white shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <LogoIcon size="40" />
                    <h1 className="text-3xl font-black uppercase italic tracking-tight">Scriptread <span className="text-blue-600">Pro</span></h1>
                </div>
                <div className="flex gap-4">
                    <label className="bg-black text-white px-8 py-2 font-black uppercase text-xs rounded-full cursor-pointer hover:bg-gray-800 transition-all shadow-lg">Load Script <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                            const file = e.target.files[0]; const reader = new FileReader();
                            reader.onload = async () => {
                                const pdf = await window.pdfjsLib.getDocument({ data: reader.result }).promise;
                                let lines = [];
                                for (let i = 1; i <= Math.min(pdf.numPages, 120); i++) {
                                    const page = await pdf.getPage(i); const content = await page.getTextContent();
                                    content.items.forEach(item => lines.push({ text: item.str, x: item.transform[4] }));
                                }
                                parseScript(lines);
                            }; reader.readAsArrayBuffer(file);
                        }} /></label>
                </div>
            </header>
            <div className="flex-1 flex overflow-hidden">
                <aside className="w-80 bg-white border-r-2 border-gray-100 flex flex-col shrink-0 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">Cast</div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {characters.map(char => (
                            <div key={char} className="p-4 bg-gray-50 rounded-xl border">
                                <p className="text-[10px] font-black uppercase text-gray-500 mb-2">{char}</p>
                                <select className="w-full bg-white border p-2 font-bold text-xs rounded-lg" value={voiceMap[char] || "Abby"} onChange={(e) => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    <optgroup label="Female">{INWORLD_VOICES.female.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                    <optgroup label="Male">{INWORLD_VOICES.male.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                </select>
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto bg-[#e9ecef] p-12">
                    <div className="max-w-2xl mx-auto min-h-full">
                        {segments.map((seg, i) => (<div key={i} ref={el => segmentRefs.current[i] = el} className={`p-10 bg-white mb-6 rounded-xl border-l-4 ${currentIdx === i ? 'border-blue-600 opacity-100 shadow-xl' : 'border-transparent opacity-40'} transition-all duration-300`}>{seg.type === 'dialogue' && <p className="text-[11px] font-black uppercase mb-4 text-blue-600">{seg.character}</p>}<p className="text-xl font-serif text-gray-800 uppercase leading-relaxed">{seg.text}</p></div>))}
                    </div>
                </main>
            </div>
            <footer className="h-28 border-t-2 border-black bg-white flex justify-center items-center gap-16 shrink-0 z-50">
                <button onClick={() => { if (isPlaying) stopAudio(); else { isPlayingRef.current = true; setIsPlaying(true); playSegment(currentIdx === -1 ? 0 : currentIdx); } }} className="bg-black text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl">{isPlaying ? "PAUSE" : "PLAY"}</button>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
