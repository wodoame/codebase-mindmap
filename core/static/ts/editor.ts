import Alpine from 'alpinejs'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import hljs from 'highlight.js'

// Import languages
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'

// Create lowlight instance
const lowlight = createLowlight()
let getEditor: () => AlpineEditor | undefined;

interface AlpineEditor {
  // Properties
  updatedAt: number;
  state: 'edit' | 'preview';
  previewContent: string;
  $refs?: any;
  $dispatch?: (event: string, data?: any) => void;
  
  // Lifecycle methods
  init(): void;
  isLoaded(): boolean;
  
  // Editor state methods
  isActive(type: any, opts?: any): boolean;
  
  // Formatting methods
  toggleHeading(opts: any): void;
  toggleBold(): void;
  toggleItalic(): void;
  toggleCodeBlock(): void;
  setCodeBlock(language?: string): void;
  
  // Preview mode methods
  updatePreview(): void;
  switchToEdit(): void;
  switchToPreview(): void;
  isEditMode(): boolean;
  isPreviewMode(): boolean;
  
  // Content retrieval methods
  getHTML(): string;
  getJSON(): any;
  getText(): string;
  
  // Content setting methods
  setHTML(html: string): void;
  setJSON(json: any): void;
  
  // Focus method
  focus(): void;
}

// Register languages
lowlight.register('javascript', javascript as any)
lowlight.register('typescript', typescript as any)
lowlight.register('python', python as any)
lowlight.register('html', html as any)
lowlight.register('css', css as any)
lowlight.register('json', json as any)

document.addEventListener('alpine:init', () => {
  Alpine.data('editor', (content:string): AlpineEditor => {
    let editor: Editor; 
    // Alpine's reactive engine automatically wraps component properties in proxy objects.
    // If you attempt to use a proxied editor instance to apply a transaction, it will cause a 
    // "Range Error: Applying a mismatched transaction", so be sure to unwrap it using Alpine.raw(),
    //  or simply avoid storing your editor as a component property, as shown in this example.

    return {
      updatedAt: Date.now(), // force Alpine to rerender on selection change
      state: 'preview',
      previewContent: '',
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
              HTMLAttributes: {
                spellcheck: 'false',
              },
            }),
          ],
          content: content,
          onCreate({ editor }) {
            _this.updatedAt = Date.now()
            _this.updatePreview()
          },
          onUpdate({ editor }) {
            _this.$dispatch!('editor-update', {})
            _this.updatedAt = Date.now()
            _this.updatePreview()
          },
          onSelectionUpdate({ editor }) {
            _this.updatedAt = Date.now()
          },
        })
        getEditor = () => this;
        window['getEditor'] = getEditor; 
        if (this.state === 'preview') this.switchToPreview();
      },
      isLoaded() {
        return editor !== undefined;
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
      
      // Preview mode methods
      updatePreview() {
        if (editor) {
          let htmlContent = editor.getHTML()
          
          // Apply syntax highlighting to code blocks in preview
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = htmlContent
          
          // Find all code blocks and apply highlighting
          const codeBlocks = tempDiv.querySelectorAll('pre code')
          codeBlocks.forEach((block) => {
            const codeElement = block as HTMLElement
            const language = codeElement.className.match(/language-(\w+)/)?.[1]
            
            if (language && codeElement.textContent) {
              try {
                // Use highlight.js directly for better HTML output
                const highlighted = hljs.highlight(codeElement.textContent, { language })
                codeElement.innerHTML = highlighted.value
                codeElement.className = `language-${language} hljs`
                
                // Apply programming font to the code element
                codeElement.style.fontFamily = "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace"
                codeElement.style.fontSize = '0.875rem'
                codeElement.style.lineHeight = '1.5'
              } catch (error) {
                console.warn('Failed to highlight code block:', error)
                // Fallback to auto-detection if specific language fails
                try {
                  const autoHighlighted = hljs.highlightAuto(codeElement.textContent)
                  codeElement.innerHTML = autoHighlighted.value
                  codeElement.className = `hljs`
                  
                  // Apply programming font to the fallback as well
                  codeElement.style.fontFamily = "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace"
                  codeElement.style.fontSize = '0.875rem'
                  codeElement.style.lineHeight = '1.5'
                } catch (autoError) {
                  console.warn('Auto-highlighting also failed:', autoError)
                }
              }
            }
          })
          
          this.previewContent = tempDiv.innerHTML
        }
      },
      
      switchToEdit() {
        this.state = 'edit'
        // Make sure editor is visible and editable
        if (editor) {
          editor.setEditable(true)
        }
      },
      
      switchToPreview() {
        this.state = 'preview'
        this.updatePreview()
        // Make editor non-editable in preview mode
        if (editor) {
          editor.setEditable(false)
        }
      },
      
      isEditMode() {
        return this.state === 'edit'
      },
      
      isPreviewMode() {
        return this.state === 'preview'
      },
      
      // Content retrieval methods
      getHTML() {
        return editor.getHTML()
      },
      
      getJSON() {
        return editor.getJSON()
      },
      
      getText() {
        return editor.getText()
      },
      
      // Set content methods
      setHTML(html: string) {
        editor.commands.setContent(html)
      },
      
      setJSON(json: any) {
        editor.commands.setContent(json)
      },
      
      // Focus the editor
      focus() {
        if (editor) {
          editor.commands.focus()
        }
      },
    }
  })
})

export { getEditor }; 