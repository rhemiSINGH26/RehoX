from pydantic import BaseModel
from typing import List

class Skill(BaseModel):
    skill_name:str
    category_code:str
    evidence:str=""
    confidence:str="medium"

class CandidateProfile(BaseModel):
    name:str
    skills:List[Skill]

class JD(BaseModel):
    company:str
    role:str
    skills:List[Skill]

class MatchRequest(BaseModel):
    candidate_profile:CandidateProfile
    jd:JD