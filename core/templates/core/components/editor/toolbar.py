from django_components import Component, register

@register('toolbar')
class Toolbar(Component):
    template_name = 'toolbar.html'

    def get_template_data(self, args, kwargs, slots, context):
        return kwargs