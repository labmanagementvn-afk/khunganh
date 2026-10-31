import type Konva from 'konva';
import { Text } from 'react-konva';
import type { TextElement } from '../types';

interface Props {
  el: TextElement;
  /** Nội dung thực sự hiển thị (với text nhập: giá trị người dùng nhập) */
  value: string;
  interactive: boolean;
  opacity?: number;
  onSelect?: () => void;
  onChange?: (patch: Partial<TextElement>) => void;
}

export function TextNode({ el, value, interactive, opacity = 1, onSelect, onChange }: Props) {
  return (
    <Text
      id={el.id}
      name="text"
      x={el.x}
      y={el.y}
      width={el.width}
      rotation={el.rotation}
      text={el.uppercase ? value.toUpperCase() : value}
      fontFamily={`"${el.fontFamily}"`}
      fontSize={el.fontSize}
      fontStyle={el.fontStyle}
      fill={el.fill}
      align={el.align}
      stroke={el.strokeWidth > 0 ? el.stroke : undefined}
      strokeWidth={el.strokeWidth}
      fillAfterStrokeEnabled
      lineJoin="round"
      opacity={opacity}
      listening={interactive}
      draggable={interactive}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragEnd={(e) => onChange?.({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Text;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange?.({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(20, node.width() * sx),
          fontSize: Math.max(6, Math.round(el.fontSize * sy)),
          strokeWidth: Math.round(el.strokeWidth * sy * 10) / 10,
        });
      }}
    />
  );
}

/** Text mới mặc định, đặt ở giữa canvas */
export function createTextElement(
  kind: TextElement['kind'],
  canvasW: number,
  canvasH: number,
  id: string,
): TextElement {
  const fontSize = Math.round(Math.max(canvasW, canvasH) / 22);
  const width = Math.round(canvasW * 0.8);
  return {
    id,
    kind,
    text: kind === 'fixed' ? 'Mã sản phẩm:' : 'AC-989VN',
    label: kind === 'input' ? 'Mã sản phẩm' : '',
    x: Math.round((canvasW - width) / 2),
    y: Math.round(canvasH * 0.85),
    width,
    rotation: 0,
    fontFamily: 'Be Vietnam Pro',
    fontSize,
    fontStyle: 'bold',
    fill: '#111111',
    align: 'center',
    stroke: '#ffffff',
    strokeWidth: 0,
    uppercase: false,
  };
}
