from collections import defaultdict
from app.core.similarity import similar

THRESHOLD = 80

def score(candidate, jd):
    matched = []
    missing = []
    category = defaultdict(lambda: {"hit": 0, "total": 0})

    candidate_skills = [x.skill_name for x in candidate.skills]

    for js in jd.skills:
        cat_code = js.category_code or "OTHER"
        category[cat_code]["total"] += 1
        found = False

        for cs in candidate_skills:
            if similar(cs, js.skill_name) >= THRESHOLD:
                matched.append(js.skill_name)
                category[cat_code]["hit"] += 1
                found = True
                break

        if not found:
            missing.append(js.skill_name)

    total = len(jd.skills)
    score_val = int((len(matched) / total) * 100) if total > 0 else 0

    category_scores = []
    for c, v in category.items():
        s = int((v["hit"] / v["total"]) * 100) if v["total"] > 0 else 0
        category_scores.append({
            "category": c,
            "score": s
        })

    return score_val, matched, missing, category_scores