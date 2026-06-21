from fastapi import Request
from fastapi.responses import JSONResponse
from server.logger import logger

async def role_authorization_middleware(request: Request, call_next):
    # Allow health check endpoint and docs without authorization check
    if request.url.path in ["/", "/docs", "/openapi.json"]:
        return await call_next(request)

    role = request.headers.get("x-user-role")
    email = request.headers.get("x-user-email")
    username = request.headers.get("x-user-username")

    if not role or role not in ["ADMIN", "DOCTOR", "PATIENT"]:
        client_ip = request.client.host if request.client else 'unknown'
        logger.warning(f"Unauthorized access attempt to {request.url.path} from IP {client_ip}")
        return JSONResponse(
            status_code=403,
            content={"detail": "Forbidden: Invalid or missing role."}
        )

    user_ident = username or email or "unknown"
    logger.info(f"Authorized request: path={request.url.path}, user={user_ident}, role={role}")
    
    request.state.user_role = role
    request.state.user_email = email
    request.state.user_username = username

    return await call_next(request)
