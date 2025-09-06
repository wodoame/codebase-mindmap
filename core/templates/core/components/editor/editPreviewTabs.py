from django_components import Component, register

@register('editPreviewTabs')
class EditPreviewTabs(Component):
    template_name = 'editPreviewTabs.html'
    
    def get_template_data(self, args, kwargs, slots, context):
        return kwargs