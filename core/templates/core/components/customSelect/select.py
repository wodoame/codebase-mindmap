from django_components import Component, register

@register('select')
class Select(Component):
    template_name = 'select.html'

    def get_context_data(self, *args, **kwargs):
        return kwargs