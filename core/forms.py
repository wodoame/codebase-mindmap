from django import forms
from .models import MindMap

class MindMapForm(forms.ModelForm):
    class Meta:
        model = MindMap
        fields = ["title", "description", "data"]
        widgets = {
            "title": forms.TextInput(attrs={
                "class": "block w-full rounded-md border px-3 py-2",
                "placeholder": "Enter a title",
                "autofocus": True,
            }),
            "description": forms.Textarea(attrs={
                "class": "block w-full rounded-md border px-3 py-2",
                "placeholder": "Optional description",
                "rows": 4,
            }),
            "data": forms.Textarea(attrs={
                "class": "block w-full rounded-md border px-3 py-2",
                "placeholder": "Optional data",
                "rows": 4,
                "spellcheck": "false",
            }),
        }
