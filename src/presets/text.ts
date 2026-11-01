import type { TextElement } from '../types';

type TextOpts = Partial<TextElement> & Pick<TextElement, 'text' | 'x' | 'y' | 'width' | 'fontSize'>;

export function fixed(id: string, o: TextOpts): TextElement {
  return {
    id,
    kind: 'fixed',
    label: '',
    rotation: 0,
    fontFamily: 'Be Vietnam Pro',
    fontStyle: 'bold',
    fill: '#111111',
    align: 'left',
    stroke: '#ffffff',
    strokeWidth: 0,
    uppercase: false,
    letterSpacing: 0,
    ...o,
  };
}

export function input(id: string, label: string, o: TextOpts): TextElement {
  return { ...fixed(id, o), kind: 'input', label };
}
