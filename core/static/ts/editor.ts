import Alpine from 'alpinejs'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'

// Import languages
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'

// Create lowlight instance
const lowlight = createLowlight()

// Register languages
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('html', html)
lowlight.register('css', css)
lowlight.register('json', json)

document.addEventListener('alpine:init', () => {
  Alpine.data('editor', (content:string) => {
    let editor: Editor; 
    // Alpine's reactive engine automatically wraps component properties in proxy objects.
    // If you attempt to use a proxied editor instance to apply a transaction, it will cause a 
    // "Range Error: Applying a mismatched transaction", so be sure to unwrap it using Alpine.raw(),
    //  or simply avoid storing your editor as a component property, as shown in this example.

    return {
      updatedAt: Date.now(), // force Alpine to rerender on selection change
      init() {
        const _this = this

        editor = new Editor({
          element: this.$refs.element,
          extensions: [
            StarterKit.configure({
              codeBlock: false, // disable default code block
            }),
            CodeBlockLowlight.configure({
              lowlight,
            }),
          ],
          content: content,
          onCreate({ editor }) {
            _this.updatedAt = Date.now()
          },
          onUpdate({ editor }) {
            _this.updatedAt = Date.now()
          },
          onSelectionUpdate({ editor }) {
            _this.updatedAt = Date.now()
          },
        })
      },
      isLoaded() {
        return editor
      },
      isActive(type: any, opts = {}) {
        return editor.isActive(type, opts)
      },
      toggleHeading(opts: any) {
        editor.chain().toggleHeading(opts).focus().run()
      },
      toggleBold() {
        editor.chain().focus().toggleBold().run()
      },
      toggleItalic() {
        editor.chain().toggleItalic().focus().run()
      },
      toggleCodeBlock() {
        editor.chain().focus().toggleCodeBlock().run()
      },
      setCodeBlock(language: string = '') {
        editor.chain().focus().setCodeBlock({ language }).run()
      },
    }
  })
})

window['Alpine'] = Alpine
Alpine.start()