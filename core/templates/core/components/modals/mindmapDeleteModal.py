from django_components import Component, register

@register('mindmapDeleteModal')
class MindmapDeleteModal(Component):
    template_name = 'mindmapDeleteModal.html'

    def get_template_data(self, args, kwargs, slots, context):
        return kwargs

