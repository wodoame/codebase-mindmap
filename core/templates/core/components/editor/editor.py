from django_components import Component, register

@register('editor')
class Editor(Component):
    template_name = 'editor.html'
    
    def get_template_data(self, args, kwargs, slots, context):
        return kwargs