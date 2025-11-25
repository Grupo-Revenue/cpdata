
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bold, Italic, Underline, MoreHorizontal, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

// Sanitize HTML to only allow basic formatting tags
const sanitizeHtml = (html: string): string => {
  if (!html || html === '<br>') return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const cleanNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    
    // Tags allowed for formatting
    const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'br', 'p', 'div'];
    const childContent = Array.from(node.childNodes).map(cleanNode).join('');
    
    if (tagName === 'br') {
      return '<br>';
    }
    
    if (allowedTags.includes(tagName)) {
      // Normalize strong->b, em->i for consistency
      const normalizedTag = tagName === 'strong' ? 'b' : tagName === 'em' ? 'i' : tagName;
      
      // Skip empty tags except br
      if (!childContent.trim() && normalizedTag !== 'br') {
        return childContent;
      }
      
      return `<${normalizedTag}>${childContent}</${normalizedTag}>`;
    }
    
    // For other tags (span, font, etc.), just return the content without the tag
    return childContent;
  };
  
  const result = Array.from(temp.childNodes).map(cleanNode).join('');
  
  // Clean up multiple consecutive br tags and trim
  return result
    .replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>')
    .replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '')
    .trim();
};

// Helper functions for cursor position management
const saveCursorPosition = (element: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  
  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  
  return preCaretRange.toString().length;
};

const restoreCursorPosition = (element: HTMLElement, position: number) => {
  const selection = window.getSelection();
  if (!selection) return;
  
  let charIndex = 0;
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let node;
  let found = false;
  
  while ((node = walker.nextNode())) {
    const nodeLength = node.textContent?.length || 0;
    if (charIndex + nodeLength >= position) {
      const range = document.createRange();
      range.setStart(node, position - charIndex);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      found = true;
      break;
    }
    charIndex += nodeLength;
  }
  
  // If position not found, place cursor at the end
  if (!found) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Escribe aquí...",
  className,
  compact = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [lastValue, setLastValue] = useState(value || '');
  const isUpdatingRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize content on mount
  useEffect(() => {
    if (!editorRef.current || isInitialized) return;
    
    if (value) {
      const cleanValue = sanitizeHtml(value);
      editorRef.current.innerHTML = cleanValue;
      setLastValue(cleanValue);
    }
    setIsInitialized(true);
  }, []);

  // Update content when value prop changes (from external source)
  useEffect(() => {
    if (!editorRef.current || !isInitialized) return;
    
    // Update content if value changed and we're not in the middle of an internal update
    if (value !== lastValue && !isUpdatingRef.current) {
      const cleanValue = sanitizeHtml(value || '');
      const cursorPosition = saveCursorPosition(editorRef.current);
      editorRef.current.innerHTML = cleanValue;
      setLastValue(cleanValue);
      
      // Restore cursor position after a brief delay to ensure DOM is updated
      setTimeout(() => {
        if (editorRef.current && cursorPosition !== null) {
          restoreCursorPosition(editorRef.current, cursorPosition);
        }
      }, 0);
    }
  }, [value, lastValue, isInitialized]);

  const executeCommand = useCallback((command: string, commandValue?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const cursorPosition = saveCursorPosition(editor);
    document.execCommand(command, false, commandValue);
    
    // Get updated content, sanitize it, and notify parent
    const rawHtml = editor.innerHTML;
    const cleanHtml = sanitizeHtml(rawHtml);
    
    // Update editor with clean HTML if it changed
    if (cleanHtml !== rawHtml) {
      editor.innerHTML = cleanHtml;
    }
    
    isUpdatingRef.current = true;
    onChange(cleanHtml);
    setLastValue(cleanHtml);
    
    // Restore cursor position
    setTimeout(() => {
      if (cursorPosition !== null) {
        restoreCursorPosition(editor, cursorPosition);
      }
      isUpdatingRef.current = false;
    }, 0);
  }, [onChange]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const editor = e.currentTarget;
    const rawHtml = editor.innerHTML;
    const cleanHtml = sanitizeHtml(rawHtml);
    
    // Only update if content actually changed
    if (cleanHtml !== lastValue) {
      isUpdatingRef.current = true;
      onChange(cleanHtml);
      setLastValue(cleanHtml);
      
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [onChange, lastValue]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    
    // If there's HTML, sanitize it; otherwise use plain text
    const cleanContent = html ? sanitizeHtml(html) : text;
    
    // Insert the clean content
    document.execCommand('insertHTML', false, cleanContent || text);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter key specifically to prevent cursor jumping
    if (e.key === 'Enter') {
      // Let the browser handle the Enter key naturally
      // We'll capture the change in handleInput
      return;
    }
  }, []);

  const handleFocus = useCallback(() => {
    setIsToolbarVisible(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Keep toolbar visible if clicking on toolbar buttons
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsToolbarVisible(false);
    }
  }, []);

  const isCommandActive = useCallback((command: string): boolean => {
    return document.queryCommandState(command);
  }, []);

  const toolbarHeight = compact ? "h-7" : "h-8";
  const buttonSize = compact ? "h-5 w-5" : "h-6 w-6";
  const iconSize = compact ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div 
      className={cn("border rounded-lg border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all", className)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Compact Toolbar - only visible on focus */}
      {(isToolbarVisible || !compact) && (
        <div className={cn("flex items-center gap-1 p-1.5 border-b border-gray-100 bg-gray-50/50", toolbarHeight)}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('bold')}
            className={cn(
              `${buttonSize} p-0 text-xs hover:bg-gray-200 transition-colors`,
              isCommandActive('bold') && "bg-gray-200 text-gray-900"
            )}
            title="Negrita"
          >
            <Bold className={iconSize} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('italic')}
            className={cn(
              `${buttonSize} p-0 text-xs hover:bg-gray-200 transition-colors`,
              isCommandActive('italic') && "bg-gray-200 text-gray-900"
            )}
            title="Cursiva"
          >
            <Italic className={iconSize} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => executeCommand('underline')}
            className={cn(
              `${buttonSize} p-0 text-xs hover:bg-gray-200 transition-colors`,
              isCommandActive('underline') && "bg-gray-200 text-gray-900"
            )}
            title="Subrayado"
          >
            <Underline className={iconSize} />
          </Button>
          
          <div className="w-px h-4 bg-gray-200 mx-1" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(`${buttonSize} p-0 text-xs hover:bg-gray-200`)}
                title="Más opciones"
              >
                <MoreHorizontal className={iconSize} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={() => executeCommand('insertUnorderedList')}>
                <List className="h-3.5 w-3.5 mr-2" />
                Lista con viñetas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => executeCommand('insertOrderedList')}>
                <ListOrdered className="h-3.5 w-3.5 mr-2" />
                Lista numerada
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => executeCommand('removeFormat')}>
                <span className="h-3.5 w-3.5 mr-2 text-xs font-mono">T</span>
                Quitar formato
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "min-h-[60px] max-h-[120px] overflow-y-auto p-3 focus:outline-none text-sm leading-relaxed",
          "prose prose-sm max-w-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400 [&:empty]:before:pointer-events-none",
          "[&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4",
          "[&_li]:my-1",
          compact && "min-h-[50px] max-h-[100px] p-2.5"
        )}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
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
