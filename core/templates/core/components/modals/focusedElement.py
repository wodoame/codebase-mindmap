from django_components import Component, register

@register('focusedElement')
class FocusedElement(Component):
    template_name = 'focusedElement.html'

    def get_template_data(self, args, kwargs, slots, context):
        return kwargs