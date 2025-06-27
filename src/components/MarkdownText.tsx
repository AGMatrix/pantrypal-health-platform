// src/components/MarkdownText.tsx

'use client';

import React from 'react';

interface MarkdownTextProps {
  children: string | undefined | null;
  className?: string;
}

export default function MarkdownText({ children, className = '' }: MarkdownTextProps) {
  // Early return for invalid input
  if (!children || typeof children !== 'string' || children.trim() === '') {
    return null;
  }

  const parseMarkdown = (text: string): string => {
    try {
      let parsed = text;

      // Handle special health content formatting patterns
      // Pattern: "**Title**: Description" - common in health recommendations
      parsed = parsed.replace(/\*\*([^*]+?)\*\*:\s*/g, '<strong class="text-gray-900 font-semibold">$1</strong>: ');

      // Handle bold text with double asterisks
      parsed = parsed.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

      // Handle italic text with single asterisks (only if not part of double asterisks)
      parsed = parsed.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em class="italic text-gray-700">$1</em>');

      // Handle headers with ### markers
      parsed = parsed.replace(/###\s*([^#\n]+)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
      parsed = parsed.replace(/##\s*([^#\n]+)/g, '<h2 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h2>');
      parsed = parsed.replace(/#\s*([^#\n]+)/g, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>');

      // Handle numbered lists with better formatting
      // Pattern: "1. **Title**: Description"
      parsed = parsed.replace(/^(\d+)\.\s*\*\*([^*]+?)\*\*:\s*(.*?)$/gm, 
        '<div class="mb-2"><span class="inline-block w-6 text-sm font-medium text-gray-500">$1.</span><strong class="text-gray-900 font-semibold">$2</strong>: <span class="text-gray-700">$3</span></div>'
      );

      // Handle simple numbered lists
      parsed = parsed.replace(/^(\d+)\.\s*([^*\n][^\n]*)$/gm, 
        '<div class="mb-1"><span class="inline-block w-6 text-sm font-medium text-gray-500">$1.</span><span class="text-gray-700">$2</span></div>'
      );

      // Handle bullet points with formatting
      // Pattern: "• **Title**: Description" or "- **Title**: Description"
      parsed = parsed.replace(/^[-•*]\s*\*\*([^*]+?)\*\*:\s*(.*?)$/gm, 
        '<div class="mb-2 flex items-start"><span class="text-gray-400 mr-2 mt-1">•</span><div><strong class="text-gray-900 font-semibold">$1</strong>: <span class="text-gray-700">$2</span></div></div>'
      );

      // Handle simple bullet points
      parsed = parsed.replace(/^[-•*]\s*([^*\n][^\n]*)$/gm, 
        '<div class="mb-1 flex items-start"><span class="text-gray-400 mr-2 mt-1">•</span><span class="text-gray-700">$1</span></div>'
      );

      // Handle line breaks
      parsed = parsed.replace(/\n\s*\n/g, '</p><p class="mb-3">');
      parsed = parsed.replace(/\n/g, '<br/>');

      // Clean up extra spaces around HTML tags
      parsed = parsed.replace(/\s*<\/?(strong|em|h[1-6]|div|span)([^>]*)>\s*/g, '<$1$2>');

      // Wrap in paragraph if it doesn't start with a block element
      if (!parsed.match(/^<(h[1-6]|div|p)/)) {
        parsed = `<p class="mb-3">${parsed}</p>`;
      }

      // Clean up any empty paragraphs or divs
      parsed = parsed.replace(/<(p|div)[^>]*>\s*<\/\1>/g, '');
      
      // Fix any double spaces
      parsed = parsed.replace(/\s+/g, ' ');

      return parsed;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return text; // Return original text if parsing fails
    }
  };

  try {
    return (
      <div 
        className={`markdown-content prose prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ 
          __html: parseMarkdown(children) 
        }}
      />
    );
  } catch (error) {
    console.error('Error rendering MarkdownText:', error);
    // Fallback to plain text
    return <div className={className}>{children}</div>;
  }
}

// Alternative: Simple bold-only parser for specific cases
export function parseBoldText(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  try {
    return text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  } catch (error) {
    console.error('Error parsing bold text:', error);
    return text;
  }
}

// Enhanced parser specifically for health content
export function parseHealthContent(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  try {
    let parsed = text;
    
    // Handle health-specific patterns
    parsed = parsed.replace(/\*\*([^*]+?)\*\*:\s*/g, '<strong class="font-semibold text-gray-900">$1</strong>: ');
    parsed = parsed.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Handle lists
    parsed = parsed.replace(/^[-•]\s*/gm, '• ');
    
    // Handle line breaks
    parsed = parsed.replace(/\n/g, '<br/>');
    
    return parsed;
  } catch (error) {
    console.error('Error parsing health content:', error);
    return text;
  }
}

// Hook for parsing markdown in components with health content support
export function useMarkdown(text: string | undefined | null, healthContent = false) {
  return React.useMemo(() => {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    try {
      if (healthContent) {
        return parseHealthContent(text);
      }
      
      return text
        .replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*([^*\n]+?)\*/g, '<em class="italic">$1</em>')
        .replace(/\n/g, '<br/>');
    } catch (error) {
      console.error('Error in useMarkdown hook:', error);
      return text;
    }
  }, [text, healthContent]);
}

// Safe markdown parser function with health content support
export function safeParseMarkdown(text: any, options: { healthContent?: boolean } = {}): string {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  
  try {
    if (options.healthContent) {
      return parseHealthContent(text);
    }
    return text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  } catch (error) {
    return String(text);
  }
}