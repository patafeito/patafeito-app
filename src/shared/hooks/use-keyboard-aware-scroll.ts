import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Keyboard, Platform, type KeyboardEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance, type TextInputInstance } from 'react-native';

/** Respiro entre o campo focado e o topo do teclado. */
const gap = 24;
/** No iOS o evento chega antes da animação do teclado (e do KeyboardAvoidingView dos diálogos); esperamos ela assentar. */
const settleMs = Platform.OS === 'ios' ? 280 : 120;

type KeyboardAwareContextValue = {
  inputFocused: (input: RefObject<TextInputInstance | null>) => void;
  inputBlurred: (input: RefObject<TextInputInstance | null>) => void;
};

/** Cada rolagem consciente do teclado avisa aos campos dentro dela; o mais próximo vence (diálogo sobre a tela). */
export const KeyboardAwareContext = createContext<KeyboardAwareContextValue | undefined>(undefined);

export function useKeyboardAwareField() {
  return useContext(KeyboardAwareContext);
}

/**
 * Com o Android em tela cheia (edge-to-edge), a janela não encolhe quando o teclado abre: ele cobre o conteúdo.
 * Este hook dá à rolagem um espaço extra do tamanho da parte coberta e rola até o campo focado ficar visível.
 * Só reage a campos que se registraram nela, para um diálogo não rolar a tela que está por baixo.
 */
export function useKeyboardAwareScroll(scrollRef: RefObject<ScrollViewInstance | null>) {
  const [bottomInset, setBottomInset] = useState(0);
  const keyboardTop = useRef<number | undefined>(undefined);
  const focused = useRef<RefObject<TextInputInstance | null> | undefined>(undefined);
  const offset = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const reveal = useCallback(() => {
    const top = keyboardTop.current;
    const input = focused.current?.current;
    const scroll = scrollRef.current;
    if (top === undefined || !input?.isFocused() || !scroll) return;
    // Primeiro abre espaço embaixo (a parte da rolagem coberta pelo teclado), depois rola até o campo.
    scroll.measureInWindow((_x, scrollY, _width, scrollHeight) => {
      setBottomInset(Math.max(0, scrollY + scrollHeight - top));
      timer.current = setTimeout(() => {
        input.measureInWindow((_ix, inputY, _iw, inputHeight) => {
          const below = inputY + inputHeight + gap - top;
          const above = scrollY + gap - inputY;
          if (below > 0) scroll.scrollTo({ y: offset.current + below, animated: true });
          else if (above > 0) scroll.scrollTo({ y: Math.max(0, offset.current - above), animated: true });
        });
      }, 60);
    });
  }, [scrollRef]);

  const scheduleReveal = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(reveal, settleMs);
  }, [reveal]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      keyboardTop.current = event.endCoordinates.screenY;
      if (focused.current) scheduleReveal();
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = undefined;
      clearTimeout(timer.current);
      setBottomInset(0);
    });
    return () => { show.remove(); hide.remove(); clearTimeout(timer.current); };
  }, [scheduleReveal]);

  const context = useMemo<KeyboardAwareContextValue>(() => ({
    inputFocused(input) {
      focused.current = input;
      // Trocar de campo com o teclado já aberto não dispara novo evento de teclado.
      if (keyboardTop.current !== undefined) scheduleReveal();
    },
    inputBlurred(input) {
      if (focused.current === input) focused.current = undefined;
    },
  }), [scheduleReveal]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
  }, []);

  return { bottomInset, onScroll, context };
}
