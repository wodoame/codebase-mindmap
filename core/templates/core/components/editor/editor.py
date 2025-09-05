from django_components import Component, register

@register('editor')
class Editor(Component):
    template_name = 'editor.html'
    
    def get_context_data(self, *args, **kwargs):
        return kwargs