
import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showLists?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Escribe aquí...",
  className,
  showLists = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  }, [onChange]);

  const isCommandActive = useCallback((command: string): boolean => {
    return document.queryCommandState(command);
  }, []);

  return (
    <div className={cn("border rounded-lg border-gray-200", className)}>
      {/* Toolbar optimizado */}
      <div className="flex items-center gap-1 p-1.5 border-b border-gray-100 bg-gray-50/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('bold')}
          className={cn(
            "h-6 w-6 p-0 text-xs hover:bg-gray-200",
            isCommandActive('bold') && "bg-gray-200 text-gray-900"
          )}
        >
          <Bold className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('italic')}
          className={cn(
            "h-6 w-6 p-0 text-xs hover:bg-gray-200",
            isCommandActive('italic') && "bg-gray-200 text-gray-900"
          )}
        >
          <Italic className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('underline')}
          className={cn(
            "h-6 w-6 p-0 text-xs hover:bg-gray-200",
            isCommandActive('underline') && "bg-gray-200 text-gray-900"
          )}
        >
          <Underline className="h-3 w-3" />
        </Button>
        {showLists && (
          <>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('insertOrderedList')}
              className={cn(
                "h-6 w-8 p-0 text-xs font-mono hover:bg-gray-200",
                isCommandActive('insertOrderedList') && "bg-gray-200 text-gray-900"
              )}
              title="Lista numerada"
            >
              1.
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('insertUnorderedList')}
              className={cn(
                "h-6 w-8 p-0 text-xs hover:bg-gray-200",
                isCommandActive('insertUnorderedList') && "bg-gray-200 text-gray-900"
              )}
              title="Lista con viñetas"
            >
              •
            </Button>
          </>
        )}
      </div>

      {/* Editor compacto con altura optimizada */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "min-h-[50px] max-h-[120px] overflow-y-auto p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm leading-relaxed",
          "prose prose-sm max-w-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none",
          className?.includes('compact-editor') && "min-h-[45px] max-h-[100px]"
        )}
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{
          wordWrap: 'break-word',
          wordBreak: 'break-word'
        }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;
