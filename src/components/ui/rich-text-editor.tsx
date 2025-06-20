
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
    <div className={cn("border rounded-md", className)}>
      {/* Toolbar compacto */}
      <div className="flex items-center gap-1 p-1 border-b bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('bold')}
          className={cn(
            "h-6 w-6 p-0 text-xs",
            isCommandActive('bold') && "bg-gray-200"
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
            "h-6 w-6 p-0 text-xs",
            isCommandActive('italic') && "bg-gray-200"
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
            "h-6 w-6 p-0 text-xs",
            isCommandActive('underline') && "bg-gray-200"
          )}
        >
          <Underline className="h-3 w-3" />
        </Button>
        {showLists && (
          <>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => executeCommand('insertOrderedList')}
              className={cn(
                "h-6 w-8 p-0 text-xs font-mono",
                isCommandActive('insertOrderedList') && "bg-gray-200"
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
                "h-6 w-8 p-0 text-xs",
                isCommandActive('insertUnorderedList') && "bg-gray-200"
              )}
              title="Lista con viñetas"
            >
              •
            </Button>
          </>
        )}
      </div>

      {/* Editor compacto */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "min-h-[60px] p-2 focus:outline-none focus:ring-1 focus:ring-ring text-sm",
          "prose prose-sm max-w-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none"
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
