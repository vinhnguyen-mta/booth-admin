import React from "react";
import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";

const PhotoNode = React.memo(function PhotoNode({
  layer,
  registerRef,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: {
  layer: PhotoLayer;
  registerRef: (id: string, node: any) => void;
  onSelect: () => void;
  onDragEnd: () => void;
  onTransformEnd: () => void;
}) {
  const [imgEl] = useImage(layer.src, "anonymous");
  return (
    <KonvaImage
      ref={(node) => {
        if (node) registerRef(layer.id, node);
      }}
      image={imgEl || undefined}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      draggable
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      onClick={onSelect}
      onTap={onSelect}
    />
  );
});

export default PhotoNode;
