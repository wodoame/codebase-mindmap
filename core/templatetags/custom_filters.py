from django import template
import json

register = template.Library()

@register.filter
def json_string(value):
    result = json.dumps(value)
    return result