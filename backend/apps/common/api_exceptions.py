from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    """
    Standardize the exception handler format to match API Response Format.
    {
        "success": false,
        "message": "Validation Error",
        "errors": {}
    }
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        if response.status_code >= 400 and response.status_code < 500:
            message = "Validation Error" if response.status_code == 400 else "Client Error"
        else:
            message = "Server Error"
            
        custom_response_data = {
            "success": False,
            "message": message,
            "errors": response.data
        }
        
        response.data = custom_response_data

    return response
