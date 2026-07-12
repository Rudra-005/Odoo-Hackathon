from rest_framework.renderers import JSONRenderer

class StandardJSONRenderer(JSONRenderer):
    """
    Standardized JSON response for all APIs.
    Success format: { "success": true, "message": "", "data": {} }
    Error format: { "success": false, "message": "", "errors": {} }
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        status_code = renderer_context['response'].status_code
        
        response_dict = {
            'success': status_code < 400,
            'message': '',
        }
        
        if response_dict['success']:
            response_dict['data'] = data
            if 'message' in data and isinstance(data, dict):
                response_dict['message'] = data.pop('message')
        else:
            response_dict['errors'] = data
            if 'detail' in data and isinstance(data, dict):
                response_dict['message'] = data.pop('detail')
        
        return super().render(response_dict, accepted_media_type, renderer_context)
