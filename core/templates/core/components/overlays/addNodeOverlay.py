from django_components import Component, register

@register('addNodeOverlay')
class AddNodeOverlay(Component):
    template_name = 'addNodeOverlay.html'

    def get_template_data(self, args, kwargs, slots, context):
        return kwargs
