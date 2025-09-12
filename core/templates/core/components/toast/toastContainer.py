from django_components import Component, register

@register('toastContainer')
class ToastContainer(Component):
    template_name = 'toastContainer.html'

    def get_template_data(self, args, kwargs, slots, context):
        return kwargs