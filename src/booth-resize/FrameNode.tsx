import React from "react";
import useImage from "use-image";
import { Image as KonvaImage } from "react-konva";

const FrameNode = React.memo(function FrameNode({
  layer,
  frameW,
  frameH,
}: {
  layer: FrameLayer;
  frameW: number;
  frameH: number;
}) {
  const [imgEl] = useImage(layer.src, "anonymous");
  console.log("frameW", frameW);
  console.log("frameH", frameH);
  return (
    <KonvaImage
      image={imgEl || undefined}
      x={0}
      y={0}
      width={frameW}
      height={frameH}
      listening={false}
    />
  );
});

export default FrameNode;
