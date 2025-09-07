import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function LayerRow({
  item,
  indexFromTop,
  selected,
  onToggleVisible,
  onClick,
}: {
  item: AnyLayer;
  indexFromTop: number;
  selected: boolean;
  onToggleVisible: () => void;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 8,
    background: selected ? "#1f6feb22" : "#161b22",
    border: selected ? "1px solid #58a6ff" : "1px solid #30363d",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <div
        title={item.visible ? "Hide" : "Show"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisible();
        }}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          border: "1px solid #30363d",
          display: "grid",
          placeItems: "center",
          background: item.visible ? "#0f5132" : "#5a1e02",
        }}
      >
        {item.visible ? "👁" : "🚫"}
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: "#21262d",
          color: "#c9d1d9",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
        }}
      >
        {indexFromTop}
      </div>
      <div style={{ color: "#c9d1d9", fontWeight: 600, flex: 1 }}>
        {item.name}
        {item.kind === "frame" ? " (Frame)" : ""}
      </div>
      <div style={{ color: "#8b949e", fontSize: 12 }}>drag ⇅</div>
    </div>
  );
}
