import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.title });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) {
    return (
      <div className="bg-background border border-border shadow-xl rounded-lg p-2 text-sm text-zinc-500">
        Tidak ada catatan yang cocok
      </div>
    );
  }

  return (
    <div className="bg-background border border-border shadow-xl rounded-lg overflow-hidden flex flex-col min-w-[200px] max-h-[300px] overflow-y-auto">
      {props.items.map((item: any, index: number) => (
        <button
          className={`text-left px-4 py-2 text-sm transition-colors ${
            index === selectedIndex
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
          }`}
          key={item.id}
          onClick={() => selectItem(index)}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';
