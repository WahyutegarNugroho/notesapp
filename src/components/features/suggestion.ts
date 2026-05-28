import { ReactRenderer } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import tippy from 'tippy.js';
import { MentionList } from './MentionList';

interface SuggestionItem {
  id: string;
  title: string;
  label: string;
}

interface SuggestionProps {
  editor: Editor;
  clientRect?: () => DOMRect;
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
}

interface RendererInstance {
  updateProps: (props: SuggestionProps) => void;
  destroy: () => void;
  ref?: {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
  };
  element: HTMLElement;
}

interface SuggestionPopup {
  destroy: () => void;
  hide: () => void;
  setProps: (props: Record<string, unknown>) => void;
}

export default function getSuggestion(notes: Array<{ id: string; title: string }>) {
  return {
    items: ({ query }: { query: string }): SuggestionItem[] => {
      return notes
        .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map(item => ({ id: item.id, title: item.title, label: item.title }));
    },

    render: () => {
      let component: ReactRenderer | null = null;
      let popup: SuggestionPopup[] | null = null;

      return {
        onStart: (props: SuggestionProps) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          }) as unknown as SuggestionPopup[];
        },

        onUpdate(props: SuggestionProps) {
          component?.updateProps(props);

          if (!props.clientRect || !popup) {
            return;
          }

          popup[0]?.setProps({
            getReferenceClientRect: props.clientRect,
          });
        },

        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === 'Escape' && popup) {
            popup[0]?.hide();
            return true;
          }

          return (component?.ref as RendererInstance['ref'] | undefined)?.onKeyDown(props) ?? false;
        },

        onExit() {
          popup?.[0]?.destroy();
          component?.destroy();
        },
      };
    },
  };
}
