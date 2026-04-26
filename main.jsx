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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const isPaid = params.get('status') === 'success' || localStorage.getItem('sr_full_access') === 'true';
        if (isPaid) {
            setIsUnlocked(true); setShowPaywall(false); setTotalSeconds(-99999);
            localStorage.setItem('sr_full_access', 'true');
            if (params.get('status')) window.history.replaceState({}, document.title, window.location.pathname);
        }
        const s_seg = sessionStorage.getItem('sr_cache_seg');
        const s_char = sessionStorage.getItem('sr_cache_char');
        const s_map = sessionStorage.getItem('sr_cache_map');
        if (s_seg && s_char && s_map) {
            setSegments(JSON.parse(s_seg));
            setCharacters(JSON.parse(s_char));
            setVoiceMap(JSON.parse(s_map));
        }
        const firstClick = () => handleFirstInteraction();
        window.addEventListener('mousedown', firstClick);
        return () => window.removeEventListener('mousedown', firstClick);
    }, []);

    useEffect(() => {
        if (segments.length > 0) {
            sessionStorage.setItem('sr_cache_seg', JSON.stringify(segments));
            sessionStorage.setItem('sr_cache_char', JSON.stringify(characters));
            sessionStorage.setItem('sr_cache_map', JSON.stringify(voiceMap));
        }
    }, [segments, characters, voiceMap]);

    useEffect(() => {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }, []);

    useEffect(() => {
        if (currentIdx !== -1 && segmentRefs.current[currentIdx]) {
            segmentRefs.current[currentIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentIdx]);

    useEffect(() => {
        if (!isUnlocked && totalSeconds >= 90) { stopAudio(); setShowPaywall(true); }
    }, [totalSeconds, isUnlocked]);

    const stopAudio = () => {
        isPlayingRef.current = false; setIsPlaying(false);
        if (activeSource.current) { try { activeSource.current.stop(); } catch(e) {} activeSource.current = null; }
    };

    const fetchAudio = async (text, voiceId) => {
        const cleaned = text.replace(/\bEXT\b\.?/gi, "Exterior").replace(/\bINT\b\.?/gi, "Interior").replace(/\bDEE\b/g, "Dee").replace(/\bScriptread\b/gi, "Script-reed");
        const resp = await fetch("https://api.inworld.ai/tts/v1/voice", {
            method: "POST",
            headers: { "Authorization": `Basic ${API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: cleaned, voiceId: voiceId || "Abby", modelId: "inworld-tts-1.5-max" })
        });
        const data = await resp.json();
        return await audioContext.current.decodeAudioData(new Uint8Array(atob(data.audioContent).split("").map(c => c.charCodeAt(0))).buffer);
    };

    const handleFirstInteraction = async () => {
        if (hasGreetedRef.current) return;
        hasGreetedRef.current = true;
        if (audioContext.current.state === 'suspended') await audioContext.current.resume();
        try {
            const buffer = await fetchAudio("Welcome to Script-reed Pro. Your professional table read starts now.", "Serena");
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            source.start();
        } catch (e) { hasGreetedRef.current = false; }
    };

    const auditionVoice = async (voiceId, charName) => {
        if (audioContext.current.state === 'suspended') await audioContext.current.resume();
        try {
            const buffer = await fetchAudio(`Hello, I am auditioning for the role of ${charName}.`, voiceId);
            const source = audioContext.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.current.destination);
            source.start();
        } catch (e) {}
    };

    const playSegment = async (index) => {
        if (!isUnlocked && totalSeconds >= 90) { stopAudio(); setShowPaywall(true); return; }
        if (!isPlayingRef.current || index >= segments.length) return;
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

    const analyzeCharacterGenders = async (charData) => {
        if (!GEMINI_KEY) return null;
        setIsAnalyzing(true);
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Return ONLY valid JSON. No explanation. No markdown. Format: {"CHARACTER": "male", "CHARACTER2": "female"}. Evidence: ${charData.map(c => `- ${c.name}: "${c.evidence}"`).join("\n")}`;
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, "").trim();
            try { return JSON.parse(text); } catch (e) { return null; }
        } catch (e) { return null; }
        finally { setIsAnalyzing(false); }
    };

    const parseScript = async (lines) => {
        const finalBlocks = [];
        const charOccurrenceIndices = new Map();
        let actionBuffer = "";
        let currentSpeaker = null;

        const flush = () => { if (actionBuffer.trim()) { finalBlocks.push({ type: 'narrator', text: actionBuffer.trim() }); actionBuffer = ""; } };
        const invalid = /^(INT|EXT|DAY|NIGHT|CUT|FADE|ACT|SCENE|ROOM|THE END|CONTINUED|BACK TO|KITCHEN|HALLWAY|BEDROOM)/i;

        for (let i = 0; i < lines.length; i++) {
            if (i < 10) {
                actionBuffer += (actionBuffer ? " " : "") + lines[i].text.trim();
                continue;
            }

            let t = lines[i].text.trim();
            if (!t || /^(\d+|Page \d+)$/i.test(t)) continue;
            
            const isUpper = t === t.toUpperCase() && /[A-Z]/.test(t);
            const x = lines[i].x || 0;

            // STEP 1 & 2 — DETECT INLINE DIALOGUE
            const parts = t.split(" ");
            const possibleName = parts[0].replace(/[^a-zA-Z]/g, "");
            const remainingText = parts.slice(1).join(" ");
            const isInlinePossible = 
                parts.length > 1 && 
                possibleName === possibleName.toUpperCase() && 
                possibleName.length > 1 &&
                possibleName.length < 15 &&
                !invalid.test(possibleName) &&
                !t.startsWith("INT") &&
                !t.startsWith("EXT") &&
                t.length < 250;

            let isChar = false;
            let cleanName = "";

            if (isInlinePossible && /[a-z]/.test(remainingText)) {
                // STEP 3 — CREATE INLINE DIALOGUE BLOCK
                flush();
                cleanName = possibleName;
                currentSpeaker = cleanName;
                if (!charOccurrenceIndices.has(cleanName)) charOccurrenceIndices.set(cleanName, []);
                charOccurrenceIndices.get(cleanName).push(i);
                finalBlocks.push({
                    type: 'dialogue',
                    character: cleanName,
                    text: remainingText
                });
                continue; // Move to next line
            }

            // Normal character detection logic
            if (isUpper && x > 210 && x < 320 && t.length < 25 && !invalid.test(t)) {
                cleanName = t.replace(/\([^)]*\)/g, "").replace(/[^a-zA-Z0-9\s]/g, "").trim();
                for (let j = i + 1; j <= Math.min(i + 5, lines.length - 1); j++) {
                    const nx = lines[j].x || 0;
                    if (nx > 180 && nx < 380 && lines[j].text !== lines[j].text.toUpperCase()) {
                        isChar = true; break;
                    }
                    if (lines[j].text === lines[j].text.toUpperCase() && nx > 200) break;
                }
            }

            if (isChar) {
                flush();
                currentSpeaker = cleanName;
                if (!charOccurrenceIndices.has(cleanName)) charOccurrenceIndices.set(cleanName, []);
                charOccurrenceIndices.get(cleanName).push(i);
                finalBlocks.push({ type: 'dialogue', character: cleanName, text: "" });
            } 
            else if (currentSpeaker) {
                const isParenthetical = t.startsWith("(") && t.endsWith(")");
                const isUpperLine = t === t.toUpperCase() && /[A-Z]/.test(t);
                const inRange = x > 160 && x < 420;
                const isShort = t.length < 120;

                if (isParenthetical || (!isUpperLine && inRange && isShort)) {
                    finalBlocks[finalBlocks.length - 1].text += (finalBlocks[finalBlocks.length - 1].text ? " " : "") + t;
                    if (charOccurrenceIndices.has(currentSpeaker)) {
                        charOccurrenceIndices.get(currentSpeaker).push(i);
                    }
                } else {
                    currentSpeaker = null;
                    actionBuffer += (actionBuffer ? " " : "") + t;
                }
            } 
            else {
                actionBuffer += (actionBuffer ? " " : "") + t;
            }
        }
        flush();

        const detectedCharacters = Array.from(charOccurrenceIndices.keys());

        const globalEvidence = {};
        detectedCharacters.forEach(name => {
            const indices = charOccurrenceIndices.get(name) || [];
            const collectedLines = new Set();
            indices.forEach(idx => {
                for (let k = Math.max(0, idx - 2); k <= Math.min(idx + 2, lines.length - 1); k++) {
                    collectedLines.add(lines[k].text);
                }
            });
            globalEvidence[name] = Array.from(collectedLines).join(" ");
        });

        const charEvidenceArray = detectedCharacters.map(name => ({
            name,
            evidence: globalEvidence[name] || ""
        }));
        
        const aiCastingResults = await analyzeCharacterGenders(charEvidenceArray);

        const normalizedAiResults = {};
        if (aiCastingResults) {
            Object.keys(aiCastingResults).forEach(key => {
                normalizedAiResults[key.toUpperCase()] = aiCastingResults[key].toLowerCase();
            });
        }

        const maleNames = ["ROBERT", "MICHAEL", "JAMES", "DAVID", "JOHN", "FRANK", "ZACK", "OLEG", "RICHARD", "SIMON", "PETER", "STEVE", "GARY", "MIKE", "CHRIS", "MARK", "PAUL", "KEVIN", "JASON", "BRIAN"];
        const femaleNames = ["DEE", "DANICA", "SARAH", "JESSICA", "AMY", "FELICITY", "TULIP", "MARY", "LINDA", "SUSAN", "BARBARA", "KAREN", "EMILY", "KATHY", "LISA", "NANCY", "BETTY", "SANDRA"];

        let newMap = { ...voiceMap };
        detectedCharacters.forEach((name) => {
            const upperName = name.toUpperCase();
            const evidenceText = (globalEvidence[name] || "").toLowerCase();
            let gender = null;

            if (normalizedAiResults[upperName]) {
                gender = normalizedAiResults[upperName].includes('male') && !normalizedAiResults[upperName].includes('female') ? 'male' : 'female';
            }

            if (!gender) {
                const maleMatch = evidenceText.match(/\b(he|him|his|man|father|boy|mr|guy)\b/g);
                const femaleMatch = evidenceText.match(/\b(she|her|hers|woman|girl|mother|ms|mrs|lady)\b/g);
                if (maleMatch && (!femaleMatch || maleMatch.length > femaleMatch.length)) gender = 'male';
                else if (femaleMatch && (!maleMatch || femaleMatch.length > maleMatch.length)) gender = 'female';
            }

            if (!gender) {
                if (maleNames.includes(upperName)) gender = 'male';
                else if (femaleNames.includes(upperName)) gender = 'female';
                else {
                    if (upperName.endsWith('A') || upperName.endsWith('IE') || upperName.endsWith('Y') || upperName.endsWith('AH')) gender = 'female';
                    else if (/[ORNDLKM]$/.test(upperName)) gender = 'male';
                }
            }

            const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            if (!gender) {
                gender = nameHash % 2 === 0 ? 'male' : 'female';
            }

            const pool = INWORLD_VOICES[gender];
            newMap[name] = pool[nameHash % pool.length].id;
        });

        setVoiceMap(newMap);
        setCharacters(detectedCharacters.sort());
        setSegments(finalBlocks.filter(b => b.text && b.text.trim().length > 0));
        setCurrentIdx(-1);
    };

    const masterAndExport = async () => {
        if (!isUnlocked) { setShowPaywall(true); return; }
        setIsExporting(true); setExportProgress(0);
        const buffers = [];
        try {
            for (let i = 0; i < segments.length; i++) {
                setExportProgress(Math.round((i / segments.length) * 100));
                const seg = segments[i]; 
                const v = seg.type === 'narrator' ? voiceMap.Narrator : (voiceMap[seg.character] || "Abby");
                buffers.push(await fetchAudio(seg.text, v));
            }
            const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
            const masterBuffer = audioContext.current.createBuffer(1, totalLength, 24000);
            const channelData = masterBuffer.getChannelData(0);
            let offset = 0; 
            buffers.forEach(b => { channelData.set(b.getChannelData(0), offset); offset += b.length; });
            const wavLen = masterBuffer.length * 2; 
            const view = new DataView(new ArrayBuffer(44 + wavLen));
            const writeStr = (o, s) => { for (let i=0; i<s.length; i++) view.setUint8(o+i, s.charCodeAt(i)); };
            writeStr(0, 'RIFF'); view.setUint32(4, 36 + wavLen, true); writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
            view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 24000, true);
            view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeStr(36, 'data'); view.setUint32(40, wavLen, true);
            const d = masterBuffer.getChannelData(0); let off = 44;
            for (let i=0; i<d.length; i++, off+=2) { const s = Math.max(-1, Math.min(1, d[i])); view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
            const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' })); link.download = "Scriptread_Master.wav"; link.click();
        } catch (e) {} finally { setIsExporting(false); }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#f8f9fa] text-[#212529] font-sans overflow-hidden fixed inset-0">
            {isAnalyzing && (
                <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-blue-600 text-white backdrop-blur-md">
                    <div className="animate-spin rounded-full h-24 w-24 border-8 border-white border-t-transparent mb-8"></div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">AI Production Scan</h2>
                </div>
            )}
            {showPaywall && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-lg p-10 text-center animate-in fade-in duration-500">
                    <div className="bg-white border-2 border-black p-12 shadow-[20px_20px_0px_0px_rgba(37,99,235,1)] max-w-xl rounded-3xl">
                        <LogoIcon size="64" />
                        <h2 className="text-4xl font-black uppercase italic mb-6">Support your script</h2>
                        <form action="https://www.paypal.com/ncp/payment/QVTMH7RF7NUBE" method="post" target="_blank">
                            <input type="submit" value="Unlock Script - $3.00" className="bg-[#FFD140] font-bold py-4 px-12 rounded-lg cursor-pointer hover:scale-105 transition-all" />
                        </form>
                        <button onClick={() => setShowPaywall(false)} className="mt-4 text-xs underline font-bold text-gray-400 uppercase">Return</button>
                    </div>
                </div>
            )}
            <header className="h-20 border-b-2 border-black px-10 flex justify-between items-center bg-white shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <LogoIcon size="40" />
                    <h1 className="text-3xl font-black uppercase italic tracking-tight italic">Scriptread <span className="text-blue-600">Pro</span></h1>
                    <div className={`${isUnlocked ? 'bg-green-600' : 'bg-blue-600'} text-white px-3 py-1 text-[10px] font-bold uppercase rounded-full ml-4 italic shadow-sm`}>
                        {isUnlocked ? "Full Access" : `Preview: ${Math.round(totalSeconds < 0 ? 0 : totalSeconds)}s / 90s`}
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={masterAndExport} className={`px-6 py-2 border-2 border-black font-black text-xs uppercase rounded-full transition-all ${isUnlocked ? 'bg-white hover:bg-black hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 opacity-50 cursor-not-allowed'}`}>
                        {isExporting ? `Mastering ${exportProgress}%` : "Master WAV"}
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
                    <div className="p-5 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest font-bold">Cast List</div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                        <div className="p-4 bg-gray-50 rounded-xl border">
                            <div className="flex justify-between items-center mb-2"><p className="text-[10px] font-black uppercase text-blue-600">Narrator</p><button onClick={() => auditionVoice(voiceMap.Narrator, "Narrator")} className="bg-blue-600 text-white p-1 rounded-full hover:scale-110 shadow-md"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button></div>
                            <select className="w-full bg-white border p-2 font-bold text-xs rounded-lg outline-none" value={voiceMap.Narrator} onChange={(e) => setVoiceMap({...voiceMap, Narrator: e.target.value})}>
                                {INWORLD_VOICES.narrators.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        {characters.map(char => (
                            <div key={char} className="p-4 bg-gray-50 rounded-xl border">
                                <div className="flex justify-between items-center mb-2"><p className="text-[10px] font-black uppercase text-gray-500">{char}</p><button onClick={() => auditionVoice(voiceMap[char] || "Abby", char)} className="bg-gray-800 text-white p-1 rounded-full hover:scale-110 shadow-md"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button></div>
                                <select className="w-full bg-white border p-2 font-bold text-xs rounded-lg outline-none" value={voiceMap[char] || "Abby"} onChange={(e) => setVoiceMap({...voiceMap, [char]: e.target.value})}>
                                    <optgroup label="Female">{INWORLD_VOICES.female.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                    <optgroup label="Male">{INWORLD_VOICES.male.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</optgroup>
                                </select>
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto bg-[#e9ecef] p-12 scrollbar-thin">
                    <div className="max-w-2xl mx-auto min-h-full flex flex-col">
                        {segments.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 animate-fade-in"><LogoIcon size="120" /><h2 className="text-5xl font-black uppercase italic mb-4 tracking-tighter">Welcome to Scriptread Pro</h2></div>
                        ) : (
                            <div className="space-y-6 pb-[50vh]">{segments.map((seg, i) => (<div key={i} ref={el => segmentRefs.current[i] = el} className={`p-10 bg-white mb-6 rounded-xl border-l-4 ${currentIdx === i ? 'border-blue-600 opacity-100 shadow-xl scale-[1.01]' : 'border-transparent opacity-40'} transition-all duration-300`}>{seg.type === 'dialogue' && <p className="text-[11px] font-black uppercase mb-4 text-blue-600 tracking-widest">{seg.character}</p>}<p className="text-xl font-serif text-gray-800 uppercase leading-relaxed">{seg.text}</p></div>))}</div>
                        )}
                    </div>
                </main>
            </div>
            <footer className="h-28 border-t-2 border-black bg-white flex justify-center items-center gap-16 shrink-0 z-50">
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.max(0, currentIdx - 1)); }} className="hover:scale-110 transition-transform"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="m11 17-5-5 5-5m7 10-5-5 5-5"/></svg></button>
                <button onClick={() => { if (isPlaying) stopAudio(); else { if (audioContext.current.state === 'suspended') audioContext.current.resume(); isPlayingRef.current = true; setIsPlaying(true); playSegment(currentIdx === -1 ? 0 : currentIdx); } }} className="bg-black text-white w-20 h-20 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl font-black">{isPlaying ? <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>}</button>
                <button onClick={() => { stopAudio(); setCurrentIdx(Math.min(segments.length - 1, currentIdx + 1)); }} className="hover:scale-110 transition-transform"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="m13 17 5-5-5-5M6 17l5-5-5-5"/></svg></button>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Scriptread />);
