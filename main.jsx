const parseScript = async (lines) => {
    try {
        const blocks = [];
        let actionBuffer = "";
        let currentSpeaker = null;

        const flushAction = () => {
            if (actionBuffer.trim()) {
                blocks.push({ type: "narrator", text: actionBuffer.trim() });
                actionBuffer = "";
            }
        };

        const isUpper = (t) => t === t.toUpperCase() && /[A-Z]/.test(t);

        const cleanName = (t) => {
            return t
                .replace(/\([^)]*\)/g, "")
                .split("/")[0]
                .replace(/[^A-Z0-9 ]/g, "")
                .trim();
        };

        for (let i = 0; i < lines.length; i++) {
            let t = (lines[i].text || "").trim();
            if (!t || /^(\d+|Page \d+)$/i.test(t)) continue;

            const x = lines[i].x || 0;

            // CHARACTER DETECTION
            let isCharacter = false;

            if (
                isUpper(t) &&
                t.length > 1 &&
                t.length < 30 &&
                x > 150 && x < 330
            ) {
                for (let j = i + 1; j <= i + 2 && j < lines.length; j++) {
                    const next = (lines[j].text || "").trim();
                    if (!next) continue;

                    if (next !== next.toUpperCase()) {
                        isCharacter = true;
                        break;
                    }
                }
            }

            if (isCharacter) {
                flushAction();
                currentSpeaker = cleanName(t);

                blocks.push({
                    type: "dialogue",
                    character: currentSpeaker,
                    text: ""
                });

                continue;
            }

            // DIALOGUE HANDLING
            if (currentSpeaker && blocks.length > 0) {
                const isDialogueLine =
                    (t !== t.toUpperCase()) &&
                    t.length < 120 &&
                    x > 100 && x < 420;

                if (isDialogueLine) {
                    const last = blocks[blocks.length - 1];
                    if (last && last.type === "dialogue") {
                        last.text += (last.text ? " " : "") + t;
                        continue;
                    }
                }

                // HARD STOP
                currentSpeaker = null;
            }

            // NARRATOR
            actionBuffer += (actionBuffer ? " " : "") + t;
        }

        flushAction();

        const finalBlocks = blocks.filter(b => b.text && b.text.trim().length > 0);

        const detectedCharacters = [
            ...new Set(
                finalBlocks
                    .filter(b => b.type === "dialogue")
                    .map(b => b.character)
            )
        ];

        // SAFE casting
        let newMap = { ...(voiceMap || {}) };

        detectedCharacters.forEach((name) => {
            const n = (name || "").toLowerCase();

            const gender =
                (n.endsWith('a') || n.endsWith('ie') || n.endsWith('y'))
                    ? 'female'
                    : 'male';

            const pool = INWORLD_VOICES[gender] || INWORLD_VOICES.male;

            const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

            if (pool && pool.length > 0) {
                newMap[name] = pool[hash % pool.length].id;
            }
        });

        setVoiceMap(newMap);
        setCharacters(detectedCharacters.sort());
        setSegments(finalBlocks);
        setCurrentIdx(-1);

    } catch (err) {
        console.error("parseScript crash:", err);
    }
};
