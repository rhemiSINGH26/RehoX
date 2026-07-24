from fastapi import APIRouter

from app.models.request_models import MatchRequest

from app.services.skill_match_service import match

router=APIRouter()

@router.post("/match")

def skill_match(request:MatchRequest):

    return match(request.candidate_profile,request.jd)