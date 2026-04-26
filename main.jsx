Yeah — I see exactly why this is happening, and it’s not a small bug, it’s a **pipeline design flaw**. The good news: it’s fixable without rewriting your whole app.

---

## 🔴 The Core Problem (Why everyone becomes female)

Your gender detection pipeline:

1. Extract character names ✅
2. Grab “evidence” text ✅
3. Send to Gemini (`analyzeCharacterGenders`) ⚠️
4. Fallback heuristic if Gemini fails ⚠️
5. Default = **female** ❌

This line is the silent killer:

```js
let gender = 'female';
```

So anytime:

* Gemini fails
* JSON parsing fails
* Evidence is weak
* Name not returned

➡️ **They default to female.**

That’s why your cast skews female.

---

## 🔴 Problem #2: Your Gemini call is fragile

This part:

````js
const text = result.response.text().replace(/```json|```/g, "").trim();
return JSON.parse(text);
````

If Gemini returns:

* Slightly malformed JSON
* Extra commentary
* Missing names

➡️ `JSON.parse` fails silently → returns `null` → fallback kicks in → **female**

---

## 🔴 Problem #3: Your evidence isn’t strong enough

You’re doing:

```js
const evidence = lines.slice(Math.max(0, i-8), i+15)
```

That’s **too random**. Scripts often introduce characters like:

```
ROBERT (26), handsome, nervous...
```

…but your slice might miss that line or dilute it.

---

## 🔴 Problem #4: No name-based inference

You’re ignoring the **strongest signal available**: the name itself.

“ROBERT” → almost certainly male
“DEE” → ambiguous but lean female depending on context

Right now, you’re relying almost entirely on context.

---

# ✅ FIX: Make your casting system actually reliable

You need a **3-layer fallback system**:

---

## 🟢 1. Fix Gemini Output (make it bulletproof)

Update your prompt to force strict JSON:

```js
const prompt = `
You are a casting director.

Return ONLY valid JSON.
No explanation. No markdown.

Format:
{
  "ROBERT": "male",
  "DEE": "female"
}

If unsure, use "unknown".

EVIDENCE:
${charList.map(c => `- ${c.name}: ${c.evidence}`).join("\n")}
`;
```

Then harden parsing:

```js
let parsed = null;
try {
    parsed = JSON.parse(text);
} catch (e) {
    console.error("JSON parse failed:", text);
}
return parsed;
```

---

## 🟢 2. Add Name-Based Gender Detection (CRITICAL)

Before defaulting, add this:

```js
const maleNames = ["ROBERT", "MICHAEL", "JAMES", "DAVID", "JOHN"];
const femaleNames = ["DEE", "SARAH", "JESSICA", "AMY"];

const guessGenderFromName = (name) => {
    const n = name.toUpperCase();
    if (maleNames.includes(n)) return "male";
    if (femaleNames.includes(n)) return "female";
    return null;
};
```

Then use it:

```js
let gender = null;

// 1. Gemini
if (aiCastingResults && aiCastingResults[name]) {
    gender = aiCastingResults[name].toLowerCase();
}

// 2. Name guess
if (!gender) {
    gender = guessGenderFromName(name);
}

// 3. Evidence fallback
if (!gender) {
    const evidence = (charEvidenceMap.get(name) || "").toLowerCase();
    if (/\b(he|him|his|man|father|boy|mr)\b/.test(evidence)) gender = 'male';
    else if (/\b(she|her|hers|woman|girl|mrs)\b/.test(evidence)) gender = 'female';
}

// 4. FINAL fallback (random, not female!)
if (!gender) {
    gender = Math.random() > 0.5 ? 'male' : 'female';
}
```

👉 This alone will fix 80% of your issue.

---

## 🟢 3. Improve Evidence Extraction (huge upgrade)

Right now:

```js
const evidence = lines.slice(Math.max(0, i-8), i+15)
```

Instead, prioritize **character intro lines**:

```js
const findCharacterIntro = (lines, index) => {
    for (let i = index; i < Math.min(index + 10, lines.length); i++) {
        const t = lines[i].text;
        if (/\(\d+\)/.test(t) || /,/.test(t)) {
            return t; // likely intro line
        }
    }
    return lines.slice(index, index + 10).map(l => l.text).join(" ");
};
```

Then:

```js
const evidence = findCharacterIntro(lines, i);
```

This grabs lines like:

```
ROBERT (26), handsome, nervous
```

Which is gold for Gemini.

---

## 🟢 4. Don’t silently fail Gemini

Right now you do:

```js
catch (e) { return null; }
```

That hides everything.

Replace with:

```js
catch (e) {
    console.error("Gemini gender analysis failed:", e);
    return null;
}
```

---

## 🟢 5. Optional (but powerful): Cache casting

If the same character appears again:

```js
if (voiceMap[name]) return;
```

Avoid re-randomizing voices.

---

# 🔥 The Real Issue (Big Picture)

Your system assumes:

> “AI will correctly infer gender from messy script fragments”

That’s unreliable.

What you actually need is:

**AI + heuristics + deterministic fallback**

---

# ✅ What this fixes immediately

After these changes:

* Characters won’t default to female anymore
* Gemini failures won’t break casting
* Names will guide casting intelligently
* Evidence becomes actually meaningful
* Voices will feel intentional, not random

---

# If you want the next level

I can help you upgrade this into:

* 🎭 Age detection (young vs old voices)
* 🎤 Tone casting (villain, comic, serious)
* 🧠 Character consistency across scenes
* 🎬 “Hollywood casting mode” (premium feature)

Just say the word.
