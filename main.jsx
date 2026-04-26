const parseScript = async (lines) => {
    const finalBlocks = [];
    const charEvidence = new Map();
    let actionBuffer = "";

    const flushAction = () => {
        if (actionBuffer.trim()) {
            finalBlocks.push({ type: 'narrator', text: actionBuffer.trim() });
            actionBuffer = "";
        }
    };

    // STEP 3: HARD FILTER PATTERNS
    const invalidPatterns = /^(INT|EXT|INT\/EXT|DAY|NIGHT|MORNING|EVENING|CUT TO|FADE|CLOSE ON|WIDE SHOT|ANGLE ON|THE END|CONTINUED|BACK TO|SCENE|ROOM|KITCHEN|BEDROOM|HALLWAY|SILENCE|MUSIC|SOUND|[\d\.]+$)/i;

    for (let i = 0; i < lines.length; i++) {
        let t = lines[i].text.trim();
        if (!t || /^(\d+|Page \d+)$/i.test(t)) continue;

        const isUpper = t === t.toUpperCase() && /[A-Z]/.test(t);
        const x = lines[i].x || 0;

        // STEP 1 & 2: CHARACTER VALIDATION WITH LOOKAHEAD
        let isValidCharacter = false;
        let cleanName = "";

        if (isUpper && x > 210 && x < 320 && t.length > 1 && t.length < 25) {
            // STEP 4: CLEAN CHARACTER NAME
            cleanName = t.replace(/\([^)]*\)/g, "").replace(/[^a-zA-Z0-9\s]/g, "").trim();
            
            // Check against Hard Filter
            if (!invalidPatterns.test(cleanName)) {
                // STEP 2: LOOKAHEAD SCAN (Next 5 lines)
                for (let j = i + 1; j <= Math.min(i + 5, lines.length - 1); j++) {
                    const nextLine = lines[j].text.trim();
                    if (!nextLine) continue;
                    
                    const nextX = lines[j].x || 0;
                    const nextIsUpper = nextLine === nextLine.toUpperCase() && /[A-Z]/.test(nextLine);

                    // Dialogue criteria: Indented (100-450) and NOT all uppercase
                    if (nextX > 100 && nextX < 450 && !nextIsUpper) {
                        isValidCharacter = true;
                        break;
                    }
                    // If we hit another character name or a slugline, stop looking
                    if (nextIsUpper && nextX > 200) break;
                }
            }
        }

        // STEP 5 & 6: BLOCK ASSIGNMENT
        if (isValidCharacter) {
            flushAction();
            if (!charEvidence.has(cleanName)) {
                // Evidence gathering for later casting
                const evidence = lines.slice(Math.max(0, i - 5), i + 15).map(l => l.text).join(" ");
                charEvidence.set(cleanName, evidence);
            }
            finalBlocks.push({ type: 'dialogue', character: cleanName, text: "" });
        } 
        else if (x > 100 && x < 450 && finalBlocks.length > 0 && finalBlocks[finalBlocks.length - 1].type === 'dialogue') {
            // Append dialogue to current character
            finalBlocks[finalBlocks.length - 1].text += (finalBlocks[finalBlocks.length - 1].text ? " " : "") + t;
        } 
        else {
            // STEP 6: TREAT AS NARRATOR
            actionBuffer += (actionBuffer ? " " : "") + t;
        }
    }
    
    flushAction();

    // TRIGGER CASTING (Existing Pipeline)
    const evidenceArray = Array.from(charEvidence.entries()).map(([name, evidence]) => ({ name, evidence }));
    const aiResults = await analyzeCharacterGenders(evidenceArray);

    let newMap = { Narrator: "Serena" };
    charEvidence.forEach((_, name) => {
        let gender = null;
        if (aiResults && aiResults[name]) gender = aiResults[name].toLowerCase();
        
        if (!gender) {
            const ev = (charEvidence.get(name) || "").toLowerCase();
            if (/\b(he|him|his|man|father|boy|mr|king)\b/.test(ev)) gender = 'male';
            else if (/\b(she|her|hers|woman|mother|girl|ms|mrs)\b/.test(ev)) gender = 'female';
            else gender = Math.random() > 0.5 ? 'male' : 'female';
        }

        const pool = INWORLD_VOICES[gender === 'male' ? 'male' : 'female'];
        const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        newMap[name] = pool[hash % pool.length].id;
    });

    setVoiceMap(newMap);
    setCharacters(Array.from(charEvidence.keys()).sort());
    setSegments(finalBlocks.filter(b => b.text && b.text.trim().length > 0));
    setCurrentIdx(-1);
};
