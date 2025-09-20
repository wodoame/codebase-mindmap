from django_components import Component, register

@register('editNodeOverlay')
class EditNodeOverlay(Component):
    template_name = 'editNodeOverlay.html'

    def get_template_data(self, args, kwargs, slots, context):
        return kwargs
