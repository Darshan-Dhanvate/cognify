import re

from textblob import TextBlob


DISTORTIONS = {
    "All-or-Nothing Thinking": (r"\balways\b", r"\bnever\b", r"\beverything\b", r"\bnothing\b"),
    "Catastrophizing": (r"\bdisaster\b", r"\bterrible\b", r"\bworst\b", r"\bhopeless\b", r"\bpanic\b"),
    "Should Statements": (r"\bshould\b", r"\bmust\b", r"\bought to\b", r"\bhave to\b"),
}


def analyze_journal(text: str) -> dict:
    polarity = float(TextBlob(text).sentiment.polarity)
    stress = max(0.0, min(100.0, ((1.0 - polarity) / 2.0) * 100.0))
    lower = text.lower()
    detected = [name for name, patterns in DISTORTIONS.items() if any(re.search(pattern, lower) for pattern in patterns)]
    if stress > 75: mood = "Overwhelmed"
    elif stress > 55: mood = "Anxious"
    elif stress < 35: mood = "Calm"
    else: mood = "Focused"
    if "All-or-Nothing Thinking" in detected:
        reframing = "Notice the absolute terms. What middle ground may also be true?"
    elif "Catastrophizing" in detected:
        reframing = "What is the most realistic outcome, rather than the worst-case outcome?"
    elif stress > 60:
        reframing = "Break the pressure into one small, actionable step."
    else:
        reframing = ""
    return {"stressScore": round(stress, 2), "sentimentPolarity": round(polarity, 4), "detectedDistortions": detected, "moodState": mood, "suggestedReframing": reframing}

