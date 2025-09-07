type Kind = "frame" | "photo";
type BaseLayer = {
  id: string;
  kind: Kind;
  name: string;
  visible: boolean;
  src: string;
};
type PhotoLayer = BaseLayer & {
  kind: "photo";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  naturalW: number;
  naturalH: number;
};
type FrameLayer = BaseLayer & {
  kind: "frame";
  naturalW: number;
  naturalH: number;
};

type AnyLayer = PhotoLayer | FrameLayer;