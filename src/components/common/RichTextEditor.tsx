'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Highlighter
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Youtube.configure({
        controls: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update editor content when content prop changes (language switch)
  // Only update if editor is not focused (to avoid interrupting typing)
  useEffect(() => {
    if (editor && !editor.isFocused && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt('Image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addYoutube = () => {
    const url = window.prompt('YouTube URL:')
    if (url) {
      const width = window.prompt('Width (px or %, default: 640):', '640')
      const height = window.prompt('Height (px, default: 360):', '360')
      editor.chain().focus().setYoutubeVideo({ 
        src: url,
        width: width ? parseInt(width) : 640,
        height: height ? parseInt(height) : 360
      }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const setColor = () => {
    const color = window.prompt('Color (hex):')
    if (color) {
      editor.chain().focus().setColor(color).run()
    }
  }

  const setHighlight = () => {
    const color = window.prompt('Highlight color (hex):')
    if (color) {
      editor.chain().focus().setHighlight({ color }).run()
    }
  }

  const ToolbarButton = ({ onClick, active, children, title }: any) => (
    <button
      onClick={onClick}
      type="button"
      title={title}
      className={`rounded px-2 py-1 text-xs transition-colors ${
        active
          ? 'bg-emerald-500 text-white'
          : isDark
          ? 'hover:bg-white/10 text-white'
          : 'hover:bg-black/5 text-black'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div>
      {/* Toolbar */}
      <div className={`mb-1.5 flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 p-1.5 ${
        isDark ? 'border-white/10 bg-[#0d0d0d]' : 'border-black/10 bg-white'
      }`}>
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Clear Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear Formatting (წაშალე ყველა სტილი)"
        >
          <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>✨</span>
        </ToolbarButton>

        <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Quote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Color & Highlight */}
        <ToolbarButton onClick={setColor} title="Text Color">
          <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>🎨</span>
        </ToolbarButton>
        <ToolbarButton onClick={setHighlight} title="Highlight">
          <Highlighter className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Media */}
        <ToolbarButton onClick={addLink} title="Add Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Add Image">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={addYoutube} title="Add YouTube (with size options)">
          <YoutubeIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <div className={`mx-1 h-4 w-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* Table */}
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert Table"
        >
          <TableIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className={`prose prose-sm max-w-none rounded-b-lg border px-3 py-2 text-sm outline-none ${
          isDark
            ? 'prose-invert border-white/10 bg-[#0d0d0d] text-white'
            : 'border-black/10 bg-white text-black'
        }`}
      />

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 200px;
          outline: none;
        }
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.75rem 0 0.5rem 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .ProseMirror ul li,
        .ProseMirror ol li {
          display: list-item;
          margin: 0.25rem 0;
        }
        .ProseMirror ul ul {
          list-style-type: circle;
        }
        .ProseMirror ul ul ul {
          list-style-type: square;
        }
        .ProseMirror ol ol {
          list-style-type: lower-alpha;
        }
        .ProseMirror ol ol ol {
          list-style-type: lower-roman;
        }
        .ProseMirror blockquote {
          border-left: 3px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .ProseMirror iframe {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 1rem auto;
          display: block;
        }
        .ProseMirror div[data-youtube-video] {
          text-align: center;
          margin: 1rem 0;
        }
        .ProseMirror div[data-youtube-video] iframe {
          display: inline-block;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1rem 0;
          width: 100%;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
          padding: 0.5rem;
        }
        .ProseMirror table th {
          font-weight: bold;
          background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
        }
      `}</style>
    </div>
  )
}
