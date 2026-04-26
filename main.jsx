import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const audioContext = useRef(null);
    const activeSource = useRef(null);
    const isPlayingRef = useRef(false);
    const segmentRefs = useRef([]);
    const hasGreetedRef = useRef(false);
    const decodedCache = useRef({});
    
    const API_KEY = import.meta.env.VITE_INWORLD_KEY;
    const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;
    const TRIAL_LIMIT = 90;

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const isPaid = params.get('status') === 'success' || localStorage.getItem('SR_PAID_SECURE') === 'true';
        
        if (isPaid) {
            setIsUnlocked(true);
            setShowPaywall(false);
            setTotalSeconds(-99999);
            localStorage.setItem('SR_PAID_SECURE', 'true');
            if (params.get('status')) window.history.replaceState({}, document.title, window.location.pathname);
        }

        const savedSegments = sessionStorage.getItem('SR_BACKUP_SEG');
        const savedChars = sessionStorage.getItem('SR_BACKUP_CHAR');
        const savedMap = sessionStorage.getItem('SR_BACKUP_MAP');

        if (savedSegments && savedChars && savedMap) {
            setSegments(JSON.parse(savedSegments));
            setCharacters(JSON.parse(savedChars));
            setVoiceMap(JSON.parse(savedMap));
        }

        const firstClick = () => handleFirstInteraction();
        window.addEventListener('mousedown', firstClick);
        return () => window.removeEventListener('mousedown', firstClick);
    }, []);

    useEffect(() => {
        if (segments.length > 0) {
            sessionStorage.setItem('SR_BACKUP_SEG', JSON.stringify(segments));
            sessionStorage.setItem('SR_BACKUP_CHAR', JSON.stringify(characters));
            sessionStorage.setItem('SR_BACKUP_MAP', JSON.stringify(voiceMap));
        }
    }, [segments, characters, voiceMap]);

    useEffect(() => {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }, []);

    useEffect(() => {
        if (currentIdx !== -1 && segmentRefs.current[currentIdx]) {
            segmentRefs.current[currentIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (segments.length > 0) preloadFuture(currentIdx + 1);
    }, [currentIdx, segments]);

    useEffect(() => {
        if (!isUnlocked && totalSeconds >= TRIAL_LIMIT) { 
            stopAudio(); 
            setShowPaywall(true); 
        }
    }, [totalSeconds, isUnlocked]);

    const preloadFuture = async (startIdx) => {
        for (let i = startIdx; i < startIdx + 3; i++) {
            if (i >= segments.length || decodedCache.current[i]) continue;
            const seg = segments[i];
            const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
            fetchAudio(seg.text, voice).then(buffer => { decodedCache.current[i] = buffer; });
        }
    };

    const handleFirstInteraction = async () => {
        if (hasGreetedRef.current) return;
        hasGreetedRef.current = true;
        if (audioContext.current.state === 'suspended') await audioContext.current.resume();
        const msg = "Welcome to Script reed Pro. Create professional sounding table reads for less than a cup of coffee. Upload a PDF to begin, then cast your script from the voices in the drop down menu. It takes only moments to generate human sounding table reads that are perfect for hearing your dialogue and helping the creative process. Listen for free for ninety seconds, then you will be asked to pay three dollars to unlock the full service. No contracts, no subscriptions, and no credits. It is like a vending machine for writers.";
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
        if (activeSource.current) { try { activeSource.current.stop(); } catch(e) {} activeSource.current = null; }
    };

    const fetchAudio = async (text, voiceId) => {
        const cleaned = text.replace(/\bEXT\b\.?/gi, "Exterior").replace(/\bINT\b\.?/gi, "Interior").replace(/\bDEE\b/g, "Dee").replace(/\bsugar\b/gi, "shuger").replace(/\bScriptread\b/gi, "Script-reed");
        const resp = await fetch("https://api.inworld.ai/tts/v1/voice", {
            method: "POST",
            headers: { "Authorization": `Basic ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: cleaned, voiceId: voiceId || "Abby", modelId: "inworld-tts-1.5-max" })
        });
        const data = await resp.json();
        return await audioContext.current.decodeAudioData(new Uint8Array(atob(data.audioContent).split("").map(c => c.charCodeAt(0))).buffer);
    };

    const auditionVoice = async (voiceId, charName) => {
        if (audioContext.current.state === 'suspended') await audioContext.current.resume();
        try {
            const buffer = await fetchAudio(`Hello, I'm auditioning for the role of ${charName}.`, voiceId);
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            source.start();
        } catch (e) {}
    };

    const playSegment = async (index) => {
        if (!isUnlocked && totalSeconds >= TRIAL_LIMIT) { stopAudio(); setShowPaywall(true); return; }
        if (!isPlayingRef.current || index >= segments.length) return;
        setCurrentIdx(index);
        const seg = segments[index];
        const voice = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
        try {
            let buffer = decodedCache.current[index] || await fetchAudio(seg.text, voice);
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
            preloadFuture(index + 1);
        } catch (e) { if(isPlayingRef.current) playSegment(index + 1); }
    };

    const analyzeGenders = async (charData) => {
        if (!GEMINI_KEY) return null;
        setIsAnalyzing(true);
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Act as a casting director. Look at the character names and their introduction context. Determine if they are 'male' or 'female'. 
            Return ONLY a raw JSON object. 
            Characters:
            ${charData.map(c => `${c.name}: "${c.intro}"`).join("\n")}`;
            
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, "").trim();
            return JSON.parse(text);
        } catch (e) { return null; }
        finally { setIsAnalyzing(false); }
    };

    const parseScript = async (lines) => {
        const finalBlocks = [];
        const foundChars = new Map();
        let actionBuffer = "";
        const flush = () => { if (actionBuffer.trim()) { finalBlocks.push({ type: 'narrator', text: actionBuffer.trim() }); actionBuffer = ""; } };

        lines.forEach((line, i) => {
            let t = line.text.trim();
            if (!t || /^(\d+|Page \d+)$/i.test(t)) return;
            const isUpper = t === t.toUpperCase() && /[A-Z]/.test(t);
            const x = line.x || 0;

            // STRICT SPATIAL CHARACTER DETECTION
            if (isUpper && x > 180 && x < 330 && t.length < 25 && !/ACT|EPISODE|END|TITLE|EXT\.|INT\./i.test(t)) {
                flush();
                const name = t.replace(/\([^)]*\)/g, "").trim();
                if (name) {
                    if (!foundChars.has(name)) {
                        const intro = lines.slice(Math.max(0, i-5), i+5).map(l => l.text).join(" ");
                        foundChars.set(name, intro);
                    }
                    finalBlocks.push({ type: 'dialogue', character: name, text: "" });
                }
            } 
            else if (x > 120 && x < 400 && finalBlocks.length > 0 && finalBlocks[finalBlocks.length-1].type === 'dialogue') {
                finalBlocks[finalBlocks.length-1].text += (finalBlocks[finalBlocks.length-1].text ? " " : "") + t;
            } 
            else if (t.startsWith("INT") || t.startsWith("EXT") || t.includes("FADE") || t.includes("CUT TO")) {
                flush();
                finalBlocks.push({ type: 'narrator', text: t });
            }
            else { actionBuffer += (actionBuffer ? " " : "") + t; }
        });
        flush();

        const charList = Array.from(foundChars.entries()).map(([name, intro]) => ({ name, intro }));
        const aiResults = await analyzeGenders(charList);

        let newMap = { Narrator: "Serena" };
        foundChars.forEach((_, name) => {
            const gender = (aiResults && aiResults[name]) ? aiResults[name] : (/[aeiouy]$/i.test(name) ? 'female' : 'male');
            const pool = INWORLD_VOICES[gender === 'male' ? 'male' : 'female'];
            newMap[name] = pool[Math.floor(Math.random() * pool.length)].id;
        });

        setVoiceMap(newMap);
        setCharacters(Array.from(foundChars.keys()).sort());
        setSegments(finalBlocks.filter(b => b.text && b.text.trim().length > 0));
        setCurrentIdx(-1);
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#f8f9fa] text-[#212529] font-sans overflow-hidden fixed inset-0">
            {isAnalyzing && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-blue-600/95 text-white backdrop-blur-md">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-6"></div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">AI Casting Director</h2>
                    <p className="font-bold uppercase text-xs opacity-80 tracking-widest">Extrapolating Genders from Action Lines...</p>
                </div>
            )}
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-lg p-10 text-center animate-in fade-in duration-500">
                    <div className="bg-white border-2 border-black p-12 shadow-[20px_20px_0px_0px_rgba(37,99,235,1)] max-w-xl rounded-3xl">
                        <div className="flex justify-center mb-6"><LogoIcon size="64" /></div>
                        <h2 className="text-4xl font-black uppercase italic mb-6 tracking-tighter">Support your script</h2>
                        <p className="text-sm mb-10 text-gray-500 uppercase tracking-tight font-bold leading-relaxed italic">Enjoying your table read? Unlock the full script for the price of a coffee.</p>
                        <div className="flex flex-col items-center py-4">
                            <style dangerouslySetInnerHTML={{__html: `.pp-QVTMH7RF7NUBE{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}`}} />
                            <form action="https://www.paypal.com/ncp/payment/QVTMH7RF7NUBE" method="post" target="_blank" style={{display:'inline-grid', justifyItems:'center', alignContent:'start', gap:'0.5rem'}}>
                                <input className="pp-QVTMH7RF7NUBE" type="submit" value="Unlock Script - $3.00" />
                                <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
                            </form>
                        </div>
                        <button onClick={() => setShowPaywall(false)} className="block w-full mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black underline">Return to Sample</button>
                    </div>
                </div>
            )}
            <header className="h-20 border-b-2 border-black px-10 flex justify-between items-center bg-white shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <LogoIcon size="40" />
                    <h1 className="text-3xl font-black uppercase italic tracking-tight">Scriptread <span className="text-blue-600">Pro</span></h1>
                    <div className={`${isUnlocked ? 'bg-green-600' : 'bg-blue-600'} text-white px-3 py-1 text-[10px] font-bold uppercase rounded-full ml-4 tracking-widest italic`}>
                        {isUnlocked ? "Full Access Unlocked" : `Preview: ${Math.round(totalSeconds < 0 ? 0 : totalSeconds)}s / 90s`}
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => {
                        const buffers = [];
                        setExportProgress(0); setIsExporting(true);
                        // Simplified master logic for code block limits
                        masterAndExport(); 
                    }} className={`px-6 py-2 border-2 border-black font-black text-xs uppercase rounded-full transition-all ${isUnlocked ? 'bg-white hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 opacity-50 cursor-not-allowed'}`}>
                        {isExporting ? `Exporting ${exportProgress}%` : "Master WAV"}
                    </button>
                    <label onClick={(e) => { e.stopPropagation(); handleFirstInteraction(); }} className="bg-black text-white px-8 py-2 font-black uppercase text-xs rounded-full cursor-pointer hover:bg-gray-800 transition-all shadow-lg">Load Script <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
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
                    <div className="p-5 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest">Production Cast</div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                        <div className="p-4 bg-gray-50 rounded-xl border">
                            <div className="flex justify-between items-center mb-2"><p className="text-[10px] font-black uppercase text-blue-600">Narrator</p><button onClick={() => auditionVoice(voiceMap.Narrator, "The Narrator")} className="bg-blue-600 text-white p-1 rounded-full"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button></div>
                            <select className="w-full bg-white border p-2 font-bold text-xs rounded-lg outline-none" value={voiceMap.Narrator} onChange={(e) => setVoiceMap({...voiceMap, Narrator: e.target.value})}>
                                {INWORLD_VOICES.narrators.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        {characters.map(char => (
                            <div key={char} className="p-4 bg-gray-50 rounded-xl border">
                                <div className="flex justify-between items-center mb-2"><p className="text-[10px] font-black uppercase text-gray-500">{char}</p><button onClick={() => auditionVoice(voiceMap[char] || "Abby", char)} className="bg-gray-800 text-white p-1 rounded-full"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button></div>
                                <select className="w-full bg-white border p-2 font-bold text-xs rounded-lg outline-none" value={voiceMap[char] || "Abby"} onChange={(e) => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    <optgroup label="Female">{INWORLD_VOICES.female.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                    <optgroup label="Male">{INWORLD_VOICES.male.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                </select>
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto bg-[#e9ecef] p-12">
                    <div className="max-w-2xl mx-auto min-h-full flex flex-col">
                        {segments.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-20"><LogoIcon size="120" /><h2 className="text-5xl font-black uppercase italic mb-4 tracking-tighter">Welcome to Scriptread Pro</h2><p className="text-xl font-bold uppercase italic text-blue-600 tracking-tight mb-12">Professional table reads for less than a cup of coffee.</p></div>
                        ) : (
                            <div className="space-y-6 pb-[50vh]">{segments.map((seg, i) => (<div key={i} ref={el => segmentRefs.current[i] = el} className={`p-10 bg-white mb-6 rounded-xl border-l-4 ${currentIdx === i ? 'border-blue-600 opacity-100 shadow-xl' : 'border-transparent opacity-40'} transition-all duration-300`}>{seg.type === 'dialogue' && <p className="text-[11px] font-black uppercase mb-4 text-blue-600 tracking-widest">{seg.character}</p>}<p className="text-xl font-serif text-gray-800 uppercase leading-relaxed">{seg.text}</p></div>))}</div>
                        )}
                    </div>
                </main>
            </div>
            <footer className="h-28 border-t-2 border-black bg-white flex justify-center items-center gap-16 shrink-0 z-50">
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.max(0, currentIdx - 1)); }} className="hover:scale-110 transition-transform"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="m11 17-5-5 5-5m7 10-5-5 5-5"/></svg></button>
                <button onClick={() => { if (isPlaying) stopAudio(); else { if (audioContext.current.state === 'suspended') audioContext.current.resume(); isPlayingRef.current = true; setIsPlaying(true); playSegment(currentIdx === -1 ? 0 : currentIdx); } }} className="bg-black text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl">{isPlaying ? <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>}</button>
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.min(segments.length - 1, currentIdx + 1)); }} className="hover:scale-110 transition-transform"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="m13 17 5-5-5-5M6 17l5-5-5-5"/></svg></button>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
