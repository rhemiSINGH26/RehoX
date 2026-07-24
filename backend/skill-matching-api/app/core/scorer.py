from collections import defaultdict

from app.core.similarity import similar

THRESHOLD=80

def score(candidate,jd):

    matched=[]

    missing=[]

    category=defaultdict(lambda:{"hit":0,"total":0})

    candidate_skills=[x.skill_name for x in candidate.skills]

    for js in jd.skills:

        category[js.category_code]["total"]+=1

        found=False

        for cs in candidate_skills:

            if similar(cs,js.skill_name)>=THRESHOLD:

                matched.append(js.skill_name)

                category[js.category_code]["hit"]+=1

                found=True

                break

        if not found:

            missing.append(js.skill_name)

    total=len(jd.skills)

    score=int(len(matched)/total*100)

    category_scores=[]

    for c,v in category.items():

        s=int(v["hit"]/v["total"]*100)

        category_scores.append({

            "category":c,

            "score":s

        })

    return score,matched,missing,category_scores