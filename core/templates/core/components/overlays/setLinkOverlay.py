from django_components import Component, register

@register('setLinkOverlay')
class SetLinkOverlay(Component):
    template_name = 'setLinkOverlay.html'

    def get_template_data(self, args, kwargs, slots, context):
        return kwargs
