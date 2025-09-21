from django_components import Component, register, merge_attributes

@register('baseModal')
class BaseModal(Component):
    template_name = 'baseModal.html'
    
    def get_template_data(self, args, kwargs, slots, context):
        is_editor_modal = kwargs.get("id") == 'editor-modal'
        res = merge_attributes(
            {"class": {"w-[80%]": is_editor_modal, "md:max-w-md w-full": not is_editor_modal}}
        )
        kwargs['classes'] = res
        return kwargs