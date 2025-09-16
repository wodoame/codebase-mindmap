import { Node } from '@tiptap/core'

export interface YouTubeAttrs {
  videoId: string
  width?: number
  height?: number
  controls?: boolean
}

export const YouTube = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      videoId: { default: null },
      width: { default: 560 },
      height: { default: 315 },
      controls: { default: true },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="youtube"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as YouTubeAttrs
    const id = attrs.videoId
    const controls = attrs.controls === false ? 0 : 1

    // responsive container preserving aspect ratio
    const containerStyle = 'position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;border-radius:8px;background:#000'
    const iframeStyle = 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;'

    return [
      'div', { 'data-type': 'youtube', contenteditable: 'false', style: containerStyle },
      ['iframe', {
        src: `https://www.youtube.com/embed/${id}?rel=0&controls=${controls}`,
        style: iframeStyle,
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        allowfullscreen: 'true'
      }],
    ]
  },
})

export default YouTube
