
import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Escribe aquí...",
  className
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
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('bold')}
          className={cn(
            "h-8 w-8 p-0",
            isCommandActive('bold') && "bg-gray-200"
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('italic')}
          className={cn(
            "h-8 w-8 p-0",
            isCommandActive('italic') && "bg-gray-200"
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => executeCommand('underline')}
          className={cn(
            "h-8 w-8 p-0",
            isCommandActive('underline') && "bg-gray-200"
          )}
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "min-h-[80px] p-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
