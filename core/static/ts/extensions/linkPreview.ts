import { Node } from '@tiptap/core'

export interface LinkPreviewAttrs {
  href: string
  title?: string | null
  description?: string | null
  image?: string | null
  siteName?: string | null
}

export const LinkPreview = Node.create({
  name: 'linkPreview',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      href: { default: null },
      title: { default: null },
      description: { default: null },
      image: { default: null },
      siteName: { default: null },
    }
  },

  parseHTML() {
    return [
      { tag: 'figure[data-type="link-preview"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as LinkPreviewAttrs
    const href = attrs.href || '#'
    const title = attrs.title || href
    const desc = attrs.description || ''
    const image = attrs.image || ''
    const site = attrs.siteName || ''

    const cardStyle = 'display:flex;gap:12px;align-items:stretch;border:1px solid #e5e7eb;border-radius:8px;padding:10px;background:#fff;max-width:640px'
    const imgStyle = 'width:128px;height:96px;object-fit:cover;border-radius:6px;background:#f3f4f6;flex:0 0 auto'
    const titleStyle = 'margin:0 0 4px 0;font-weight:600;font-size:14px;color:#111827;line-height:1.3;word-break:break-word'
    const descStyle = 'margin:0 0 8px 0;font-size:13px;color:#4b5563;line-height:1.45;max-height:3.7em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical'
    const siteStyle = 'font-size:12px;color:#6b7280'
    const aStyle = 'text-decoration:none;color:inherit;display:block'

    const children:any[] = []
    if (image) {
      children.push(['img', { src: image, alt: title, style: imgStyle }])
    }
    children.push([
      'div', { style: 'display:flex;flex-direction:column;justify-content:center' },
      ['div', { style: titleStyle }, title],
      desc ? ['div', { style: descStyle }, desc] : '',
      site ? ['div', { style: siteStyle }, site] : '',
    ])

    return [
      'figure', { 'data-type': 'link-preview', contenteditable: 'false', style: cardStyle },
      ['a', { href, target: '_blank', rel: 'noopener noreferrer nofollow', style: aStyle }, ...children],
    ]
  },
})

export default LinkPreview
