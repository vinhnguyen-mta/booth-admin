import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Transformer } from "react-konva";
import { nanoid } from "nanoid";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { LayerRow } from "./booth-resize/LayerRow";
import FrameNode from "./booth-resize/FrameNode";
import PhotoNode from "./booth-resize/PhotoNode";

function useContainerSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setSize({ w: el.clientWidth, h: el.clientHeight })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}
function pickFile(accept: string) {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

export default function App() {
  const [layers, setLayers] = useState<AnyLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedId),
    [layers, selectedId]
  );

  const trRef = useRef<any>(null);
  const nodeRefs = useRef<Record<string, any>>({});

  const { ref: wrapRef, size: wrap } = useContainerSize();

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (wrapRef.current?.offsetHeight && wrapRef.current?.offsetWidth) {
      console.log("wrapRef.current.offsetWidth", wrapRef.current.offsetWidth);
      console.log("wrapRef.current.offsetHeight", wrapRef.current.offsetHeight);
      setDimensions({
        width: wrapRef.current.offsetWidth - 1,
        height: wrapRef.current.offsetHeight - 1,
      });
    }
  }, []);

  const frameLayer = layers.find((l) => l.kind === "frame") as
    | FrameLayer
    | undefined;
  const frameW = frameLayer?.naturalW ?? 1680;
  const frameH = frameLayer?.naturalH ?? 844;

  const stageScale = useMemo(() => {
    if (!wrap.w || !wrap.h) return 1;
    return Math.min(wrap.w / frameW, wrap.h / frameH);
  }, [wrap.w, wrap.h, frameW, frameH]);

  const stagePixW = Math.round(frameW * stageScale);
  const stagePixH = Math.round(frameH * stageScale);

  useEffect(() => {
    if (!trRef.current) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    trRef.current.nodes(node ? [node] : []);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, layers]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const topToBottomIds = layers.map((l) => l.id).reverse();
  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const idsTopToBottom = [...topToBottomIds];
    const from = idsTopToBottom.indexOf(active.id);
    const to = idsTopToBottom.indexOf(over.id);
    const newTopToBottom = arrayMove(idsTopToBottom, from, to);
    const newBottomToTop = [...newTopToBottom].reverse();
    const idMap = Object.fromEntries(layers.map((l) => [l.id, l]));
    setLayers(newBottomToTop.map((id) => idMap[id]));
  };

  const resizeImg = (img: any) => {
    console.log("dimensions", dimensions);
    if (img.naturalWidth / img.naturalHeight > 1) {
      return {
        width: dimensions.width,
        height: dimensions.width / (img.naturalWidth / img.naturalHeight),
      };
    } else {
      return {
        width: dimensions.height * (img.naturalWidth / img.naturalHeight),
        height: dimensions.height,
      };
    }
  };

  const addFrame = async () => {
    const file = await pickFile("image/*");
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const imgSize = resizeImg(img);
      const layer: FrameLayer = {
        id: layers.find((l) => l.kind === "frame")?.id ?? nanoid(),
        kind: "frame",
        name: "Frame",
        visible: true,
        src: URL.createObjectURL(file),
        naturalW: imgSize.width, // width img
        naturalH: imgSize.height, // height img
      };
      setLayers((prev) => {
        const has = prev.find((l) => l.kind === "frame");
        if (!has) return [...prev, layer];
        return prev.map((l) => (l.kind === "frame" ? layer : l));
      });
      setSelectedId(null);
    };
    img.src = URL.createObjectURL(file);
  };

  const addPhoto = async () => {
    const file = await pickFile("image/*");
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const naturalW = img.naturalWidth,
        naturalH = img.naturalHeight;
      const targetW = Math.round(frameW * 0.4);
      const targetH = Math.round((naturalH / naturalW) * targetW);
      const layer: PhotoLayer = {
        id: nanoid(),
        kind: "photo",
        name: `Photo ${layers.filter((l) => l.kind === "photo").length + 1}`,
        visible: true,
        src: URL.createObjectURL(file),
        x: Math.round((frameW - targetW) / 2),
        y: Math.round((frameH - targetH) / 2),
        width: targetW,
        height: targetH,
        rotation: 0,
        naturalW,
        naturalH,
      };
      setLayers((prev) => [...prev, layer]);
      setSelectedId(layer.id);
    };
    img.src = URL.createObjectURL(file);
  };

  const onPhotoDragEnd = (id: string) => {
    const node = nodeRefs.current[id];
    if (!node) return;
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id && l.kind === "photo"
          ? { ...l, x: node.x(), y: node.y() }
          : l
      )
    );
  };
  const onPhotoTransformEnd = (id: string) => {
    const node = nodeRefs.current[id];
    if (!node) return;
    const scaleX = node.scaleX(),
      scaleY = node.scaleY();
    const width = Math.max(20, node.width() * scaleX);
    const height = Math.max(20, node.height() * scaleY);
    node.scaleX(1);
    node.scaleY(1);
    node.width(width);
    node.height(height);
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id && l.kind === "photo"
          ? {
              ...l,
              x: node.x(),
              y: node.y(),
              width,
              height,
              rotation: node.rotation(),
            }
          : l
      )
    );
  };

  const exportJSON = () => {
    const payload = {
      frameSize: { w: frameW, h: frameH },
      stackBottomToTop: layers.map((l) =>
        l.kind === "photo"
          ? {
              type: "photo",
              id: l.id,
              name: l.name,
              visible: l.visible,
              src: l.src,
              x: l.x,
              y: l.y,
              width: l.width,
              height: l.height,
              rotation: l.rotation,
              naturalW: l.naturalW,
              naturalH: l.naturalH,
            }
          : {
              type: "frame",
              id: l.id,
              name: l.name,
              visible: l.visible,
              src: l.src,
              naturalW: (l as FrameLayer).naturalW,
              naturalH: (l as FrameLayer).naturalH,
            }
      ),
    };
    console.log("EXPORT", payload);
    alert("Đã log JSON layout (mở console).");
  };

  return (
    <div
      style={{
        height: "100dvh",
        width: "99vw",
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        background: "#0d1117",
        color: "#c9d1d9",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto 1fr",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: 10,
            borderBottom: "1px solid #30363d",
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={addFrame}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #30363d",
              background: "#21262d",
              color: "#c9d1d9",
            }}
          >
            ➕ Add Frame
          </button>
          <button
            onClick={addPhoto}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #30363d",
              background: "#21262d",
              color: "#c9d1d9",
            }}
          >
            🖼️ Add Photo
          </button>
          <button
            onClick={exportJSON}
            style={{
              marginLeft: "auto",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #30363d",
              background: "#1f6feb",
              color: "white",
            }}
          >
            Export JSON
          </button>
        </div>

        <div
          ref={wrapRef}
          style={{
            width: "100%",
            height: "100%",
            overflow: "auto",
            display: "grid",
            placeItems: "start center",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <Stage
            width={frameW}
            height={frameH}
            scale={{ x: stageScale, y: stageScale }}
            style={{
              width: `${stagePixW}px`,
              height: `${stagePixH}px`,
              background: "#111",
            }}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) setSelectedId(null);
            }}
          >
            <Layer>
              {layers.map((l) => {
                if (!l.visible) return null;

                if (l.kind === "frame") {
                  return (
                    <FrameNode
                      key={l.id}
                      layer={l as FrameLayer}
                      frameW={frameW}
                      frameH={frameH}
                    />
                  );
                }

                return (
                  <PhotoNode
                    key={l.id}
                    layer={l as PhotoLayer}
                    registerRef={(id, node) => {
                      if (node) nodeRefs.current[id] = node;
                    }}
                    onSelect={() => setSelectedId(l.id)}
                    onDragEnd={() => onPhotoDragEnd(l.id)}
                    onTransformEnd={() => onPhotoTransformEnd(l.id)}
                  />
                );
              })}

              {selectedLayer?.kind === "photo" && (
                <Transformer
                  ref={trRef}
                  rotateEnabled
                  enabledAnchors={[
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                    "left",
                    "right",
                    "top",
                    "bottom",
                  ]}
                  boundBoxFunc={(oldBox, newBox) =>
                    newBox.width < 40 || newBox.height < 40 ? oldBox : newBox
                  }
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      <div
        style={{
          borderLeft: "1px solid #30363d",
          gridTemplateRows: "auto 1fr",
          minWidth: 280,
        }}
      >
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid #30363d",
            fontWeight: 700,
          }}
        >
          Layers (top → bottom)
        </div>
        <div
          style={{ padding: 12, overflowY: "auto", display: "grid", gap: 10 }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={topToBottomIds}
              strategy={verticalListSortingStrategy}
            >
              {[...layers].reverse().map((l, idxTop) => (
                <LayerRow
                  key={l.id}
                  item={l}
                  indexFromTop={idxTop + 1}
                  selected={selectedId === l.id}
                  onToggleVisible={() =>
                    setLayers((prev) =>
                      prev.map((p) =>
                        p.id === l.id ? { ...p, visible: !p.visible } : p
                      )
                    )
                  }
                  onClick={() => setSelectedId(l.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
