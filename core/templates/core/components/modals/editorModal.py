from django_components import Component, register

@register('editorModal')
class EditorModal(Component):
    template_name = 'editorModal.html'

    def get_template_data(self, args, kwargs, slots, context):
        return kwargs