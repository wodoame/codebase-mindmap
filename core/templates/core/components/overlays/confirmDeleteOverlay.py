from django_components import Component, register

@register('confirmDeleteOverlay')
class ConfirmDeleteOverlay(Component):
    template_name = 'confirmDeleteOverlay.html'

    def get_template_data(self, args, kwargs, slots, context):
        return kwargs
