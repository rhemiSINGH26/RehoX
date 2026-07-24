from pydantic import BaseModel
from typing import List

class CategoryScore(BaseModel):
    category:str
    score:int

class MatchResponse(BaseModel):

    match_score:int

    matched_skills:List[str]

    missing_skills:List[str]

    category_scores:List[CategoryScore]

    summary:str