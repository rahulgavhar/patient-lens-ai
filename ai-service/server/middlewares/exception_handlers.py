from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger

async def catch_exception_middleware(request:Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": "An internal server error occurred."},
        )