from textblob import TextBlob
import re

class CognitiveNLPProcessor:
    def __init__(self):
        # Basic keyword mapping for initial cognitive distortion detection
        self.distortion_keywords = {
            "All-or-Nothing Thinking": [r"\balways\b", r"\bnever\b", r"\beverything\b", r"\bnothing\b", r"\bruined\b"],
            "Catastrophizing": [r"\bdisaster\b", r"\bterrible\b", r"\bworst\b", r"\bhopeless\b", r"\bpanic\b"],
            "Should Statements": [r"\bshould\b", r"\bmust\b", r"\bought to\b", r"\bhave to\b"]
        }

    def analyze_text(self, text: str) -> dict:
        """Processes raw journal text and returns psychological metrics."""
        blob = TextBlob(text)
        
        # 1. Sentiment Polarity (-1.0 to 1.0)
        polarity = blob.sentiment.polarity
        
        # 2. Calculate Base Stress Score (0 to 100)
        # Invert polarity so highly negative sentiment = high stress
        stress_score = max(0.0, min(100.0, ((1.0 - polarity) / 2.0) * 100))
        
        # 3. Detect Cognitive Distortions
        detected_distortions = []
        text_lower = text.lower()
        for distortion, patterns in self.distortion_keywords.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    detected_distortions.append(distortion)
                    break # Move to next distortion category if one match is found
                    
        # 4. Determine Mood State
        if stress_score > 75:
            mood = "Overwhelmed"
        elif stress_score > 55:
            mood = "Anxious"
        elif stress_score < 35:
            mood = "Calm"
        else:
            mood = "Focused"
            
        # 5. Generate Dynamic Reframing
        reframing = ""
        if "All-or-Nothing Thinking" in detected_distortions:
            reframing = "Notice if you are using absolute terms. Can you find a middle ground in this situation?"
        elif "Catastrophizing" in detected_distortions:
            reframing = "This sounds incredibly stressful. Let's ground ourselves: what is the most realistic outcome, rather than the worst-case scenario?"
        elif stress_score > 60:
            reframing = "You are carrying a lot of tension right now. Take a step back and break this down into smaller micro-steps."
            
        return {
            "stressScore": round(stress_score, 2),
            "detectedDistortions": detected_distortions,
            "suggestedReframing": reframing,
            "moodState": mood
        }