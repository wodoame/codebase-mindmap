import Alpine from 'alpinejs'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import hljs from 'highlight.js'
import LinkPreview from './extensions/linkPreview'
import YouTube from './extensions/youtube'

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
  toggleBulletList(): void;
  toggleOrderedList(): void;
  toggleTaskList(): void;
  toggleBlockquote(): void;
  toggleUnderline(): void;
  toggleStrike(): void;
  toggleHighlight(): void;
  setLink(url?: string): void;
  unsetLink(): void;
  
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
              codeBlock: false,
              // Avoid duplicates: we add these explicitly below
              link: false as any,
              underline: false as any,
              // leave lists/blockquote/strike enabled (default true)
            }),
            // Task list support
            TaskList,
            TaskItem,
            Link.configure({
              openOnClick: true,
              autolink: true,
              linkOnPaste: true,
              HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' }
            }),
            Underline,
            Highlight,
            Image.configure({
              allowBase64: false,
            }),
            LinkPreview,
            YouTube,
            CodeBlockLowlight.configure({
              lowlight,
              HTMLAttributes: {
                spellcheck: 'false',
              },
            }),
          ],
          content: content,
          editorProps: {
            handlePaste: (view, event) => {
              console.log('paste event fired');
              const text = event.clipboardData?.getData('text/plain')?.trim() || ''
              if (!text) return false

              // If it's an image url, insert as image
              if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(text)) {
                editor.chain().focus().insertContent({ type: 'image', attrs: { src: text } }).run()
                return true
              }

              // If it looks like a URL, handle YouTube first, else try link preview
              try {
                const u = new URL(text)
                const host = u.hostname.replace(/^www\./, '')
                const ytId = (() => {
                  // youtu.be/<id>
                  if (host === 'youtu.be') return u.pathname.slice(1)
                  // youtube.com/watch?v=<id>
                  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
                    const v = u.searchParams.get('v')
                    if (v) return v
                    // youtube.com/embed/<id>
                    const m = u.pathname.match(/\/embed\/([\w-]{6,})/)
                    if (m) return m[1]
                  }
                  return null
                })()

                if (ytId) {
                  editor.chain().focus().insertContent({ type: 'youtube', attrs: { videoId: ytId } }).run()
                  event.preventDefault()
                  return true
                }
                // Use backend to resolve OG metadata (and detect images via content-type)
                fetch(`/api/link-preview/?url=${encodeURIComponent(text)}`)
                  .then(r => r.json())
                  .then(data => {
                    if (data?.type === 'image' && data.image) {
                      editor.chain().focus().insertContent({ type: 'image', attrs: { src: data.image } }).run()
                      return
                    }
                    if (data?.type === 'link' && (data.image || data.title || data.description)) {
                      editor.chain().focus().insertContent({
                        type: 'linkPreview',
                        attrs: {
                          href: data.url || text,
                          title: data.title || null,
                          description: data.description || null,
                          image: data.image || null,
                          siteName: data.siteName || null,
                        }
                      }).run()
                      return
                    }
                    // Fallback: just insert as a normal link
                    editor.chain().focus().insertContent(text).setLink({ href: text }).run()
                  })
                  .catch(() => {
                    // If preview fails, insert link text
                    editor.chain().focus().insertContent(text).setLink({ href: text }).run()
                  })

                // Prevent default paste (we will insert async)
                event.preventDefault()
                return true
              } catch {
                // Not a URL, let default paste proceed
                return false
              }
            }
          },
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
      toggleBulletList() {
        editor.chain().focus().toggleBulletList().run()
      },
      toggleOrderedList() {
        editor.chain().focus().toggleOrderedList().run()
      },
      toggleTaskList() {
        editor.chain().focus().toggleTaskList().run()
      },
      toggleBlockquote() {
        editor.chain().focus().toggleBlockquote().run()
      },
      toggleUnderline() {
        editor.chain().focus().toggleUnderline().run()
      },
      toggleStrike() {
        editor.chain().focus().toggleStrike().run()
      },
      toggleHighlight() {
        editor.chain().focus().toggleHighlight().run()
      },
      setLink(url: string) {
        if (url.trim() === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
      },
      unsetLink() {
        editor.chain().focus().unsetLink().run();
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

          // Ensure empty paragraphs render visible blank lines in preview
          const paragraphs = tempDiv.querySelectorAll('p')
          paragraphs.forEach(p => {
            const html = (p as HTMLElement).innerHTML
            // Strip whitespace, &nbsp;, and <br> to detect truly empty blocks
            const stripped = html
              .replace(/&nbsp;/gi, '')
              .replace(/<br\s*\/>/gi, '')
              .replace(/<br>/gi, '')
              .trim()
            if (!stripped) {
              (p as HTMLElement).innerHTML = '&nbsp;'
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