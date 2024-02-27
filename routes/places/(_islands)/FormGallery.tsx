import { useEffect, useMemo, useRef, useState } from "preact/hooks";
// @deno-types="npm:@types/sortablejs"
import Sortable from "sortablejs";
import CloseButton from "../../../components/CloseButton.tsx";

export interface GalleryItem {
  id: string;
  url: string;
}

interface FormGalleryProps {
  items: GalleryItem[];
  isDisabled: boolean;
  onRemoveItem(x: string): void;
  onLoadingChange(x: boolean): void;
  onSortChange(fromIndex: number, toIndex: number): void;
}

export function FormGallery({
  items,
  isDisabled,
  onRemoveItem,
  onLoadingChange,
  onSortChange,
}: FormGalleryProps) {
  const [loadedItems, setLoadedItems] = useState<{ [k: string]: boolean }>({});
  const listRef = useRef<HTMLUListElement>(null);

  const isLoading = useMemo(() => {
    return items.some(({ id }) => !loadedItems[id]);
  }, [items, loadedItems]);

  const onItemLoaded = (id: string) => {
    setLoadedItems((prev) => ({ ...prev, [id]: true }));
  };

  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (!isDisabled) {
      const sortable = Sortable.create(listRef.current!, {
        onSort: (ev) => {
          onSortChange(ev.oldIndex!, ev.newIndex!);
        },
      });
      return () => sortable.destroy();
    }
  }, [isDisabled, onSortChange, items]);

  return (
    <ul ref={listRef} class="not-prose flex flex-wrap gap-5">
      {items.map((item, index) => (
        <Thumb
          key={item.url}
          id={item.id}
          url={item.url}
          isLoaded={loadedItems[item.id]}
          canRemove={!isDisabled}
          onLoad={onItemLoaded}
          onRemove={onRemoveItem}
        />
      ))}
    </ul>
  );
}

interface ThumbProps {
  id: string;
  url: string;
  isLoaded: boolean;
  canRemove: boolean;
  onLoad(x: string): void;
  onRemove(x: string): void;
}

export function Thumb(props: ThumbProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const {
    id,
    url,
    isLoaded,
    canRemove,
    onLoad,
    onRemove,
  } = props;

  useEffect(() => {
    if (imgRef.current?.complete) {
      onLoad && onLoad(id);
    }
  }, []);

  return (
    <li class={`${!isLoaded ? "invisible" : ""} relative`}>
      <a href={url} target="_blank" class="cursor-move">
        <img
          src={url.replace(".jpeg", ".thumb.jpeg")}
          ref={imgRef}
          onLoad={() => onLoad(id)}
          class="sm:h-48 rounded shadow"
        />
      </a>
      {canRemove && (
        <CloseButton
          title="Премахни"
          onClick={() => onRemove(id)}
          class="absolute right-0 top-0 translate-x-2/4 -translate-y-2/4"
        />
      )}
    </li>
  );
}
