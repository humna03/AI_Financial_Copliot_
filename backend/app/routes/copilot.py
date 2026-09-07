from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import User, FinancialProfile
from app.auth import get_current_user, User as AuthUser
from app.schemas.copilot import CopilotAskRequest, CopilotAskDataResponse, CopilotAskResponse
from app.schemas.common import ErrorResponse
from app.services.copilot_context import assemble_copilot_context
from app.services.copilot_service import build_copilot_prompt
from app.services.gemini_client import gemini_client
from app.services.language_detect import detect_conversation_language

router = APIRouter()


@router.post(
    "/users/{user_id}/copilot/ask",
    response_model=CopilotAskDataResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request (e.g. empty question)"},
        403: {"model": ErrorResponse, "description": "Financial profile belongs to another user"},
        404: {"model": ErrorResponse, "description": "User or financial data not found"},
        422: {"model": ErrorResponse, "description": "Validation failure"},
    },
)
def ask_copilot(
    user_id: int,
    request: CopilotAskRequest,
    session: Session = Depends(get_session),
    current_user: AuthUser = Depends(get_current_user),
):
    # Verify user exists
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": f"User {user_id} not found"}},
        )

    # Verify the caller's JWT identity actually owns this financial profile —
    # otherwise Copilot would answer questions using a stranger's real financial data.
    if user.auth_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": {
                    "code": "FORBIDDEN",
                    "message": "You do not have access to this financial profile.",
                }
            },
        )

    # Verify financial profile exists (no context exists otherwise)
    profile = session.exec(
        select(FinancialProfile).where(FinancialProfile.user_id == user_id)
    ).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": "Financial data not found. Submit financial data first."}},
        )

    try:
        context = assemble_copilot_context(session, user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(e)}},
        )

    # Detect the language of THIS message from its actual text, using the
    # account's stored UI language only as the last-resort default for a
    # first, totally ambiguous message (see language_detect module docstring
    # for why the account preference is not used to override real content).
    history_dicts = [turn.model_dump() for turn in (request.history or [])]
    detected_language = detect_conversation_language(
        history_dicts, request.question, fallback_language=context.language
    )

    prompt = build_copilot_prompt(
        context, request.question, history=history_dicts, detected_language=detected_language
    )

    try:
        answer = gemini_client.generate_content(prompt)
    except Exception as e:
        # Per instructions: keep responsibilities separated, but if Gemini client raises RuntimeError or exception,
        # we can wrap it or let it propagate / return appropriate error. Let's handle provider failures gracefully or raise 502 if needed,
        # but wait, the prompt says: "Do not implement the Gemini-failure/502 behavior prematurely if the documentation assigns that specifically to the next Phase 5 step."
        # Actually let's check API_CONTRACT.md: 502 Bad Gateway (Gemini unavailable). Let's catch RuntimeError from Gemini client and raise 502 Bad Gateway!
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": {"code": "AI_SERVICE_ERROR", "message": f"Gemini service unavailable: {str(e)}"}},
        )

    return CopilotAskDataResponse(
        data=CopilotAskResponse(
            answer=answer,
            # The language actually detected for this turn, not the
            # account's stored UI language — see comment above.
            language=detected_language,
        )
    )
