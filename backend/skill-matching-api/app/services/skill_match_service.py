from app.core.scorer import score

def match(profile,jd):

    score_value,matched,missing,category_scores=score(profile,jd)

    if score_value>85:

        summary="Excellent match."

    elif score_value>65:

        summary="Good match with some skill gaps."

    else:

        summary="Needs significant upskilling."

    return {

        "match_score":score_value,

        "matched_skills":matched,

        "missing_skills":missing,

        "category_scores":category_scores,

        "summary":summary

    }