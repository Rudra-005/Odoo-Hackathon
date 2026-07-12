import logging
import time

logger = logging.getLogger('transitops.request')

class RequestLoggingMiddleware:
    """
    Middleware to log all incoming requests and their processing times.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        
        # Log request details
        logger.info(f"Incoming Request: {request.method} {request.path} | User: {request.user}")
        
        response = self.get_response(request)
        
        duration = time.time() - start_time
        
        # Log response details
        logger.info(f"Completed Request: {request.method} {request.path} | Status: {response.status_code} | Duration: {duration:.3f}s")
        
        return response
